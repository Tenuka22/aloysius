# Marking System

## Overview

Covers students, their class assignments and admission history, exam types, grade scales, subject marks, and optional-subject selection. All tables live in `packages/db/src/schema/marking.ts`; all procedures live in `packages/api/src/routers/marking/`.

The two invariants this system is built to protect:

1. **A student is admitted once.** Grade 6 entry, grade 12 entry, or a genuine transfer creates an admission record. Progressing to the next grade in a later year never re-registers or re-admits the student.
2. **Historical marks never change meaning.** Every mark row carries its own subject directly — it isn't derived by joining through whatever a student's _current_ optional-subject selection happens to be. Changing a student's selection later can never retroactively alter what an already-entered mark means.

## File Structure

```
packages/db/src/schema/marking.ts
├── student                     # Permanent record, not year-dependent
├── studentClassAssignment      # One row per student per year
├── studentAdmission            # One row per genuine admission event
├── examType                    # Exam instances, now grade-scoped
├── gradeScale                  # Mark → letter grade boundaries per year
├── subjectMark                 # Individual mark entries (denormalized subjectKey)
└── studentSubjectSelection     # Append-only optional-subject choice history

packages/api/src/routers/marking/
├── index.ts                          # Barrel
├── create-student.ts / update-student.ts / delete-student.ts / get-student.ts / list-students.ts
├── assign-student-to-class.ts        # Also handles first-ever-admission logic
├── list-students-by-class.ts
├── create-exam-type.ts / list-exam-types.ts
├── create-grade-scale.ts / list-grade-scale.ts
├── enter-subject-mark.ts / update-subject-mark.ts / list-marks-for-class.ts
├── get-student-history.ts            # All marks across all years for a student
├── set-subject-selection.ts          # Change flow — see below
├── get-current-subject-selections.ts
└── list-subject-selection-history.ts
```

## Student & Admission

### `student` (permanent record)

Not year-dependent. Key fields: `admissionNumber` (globally unique), `firstName`, `lastName`, `admissionType` (`"grade6" | "grade12" | "transfer"`), `birthCertificateNumber` (**not** unique globally — grade 6–11 and grade 12–13 are separate pools, so the same certificate number can legitimately appear in both), `admissionGrade` (the grade the student was first admitted at).

### `studentClassAssignment` (per year)

```ts
{
  (id, studentId, academicYearId, classId, createdAt);
}
```

Unique on `(studentId, academicYearId)` — one class per student per year. A student moving from grade 8 to grade 9 the following year is just a new row here.

### `studentAdmission` (per genuine admission event)

```ts
{
  (id,
    studentId,
    academicYearId,
    admissionType,
    birthCertificateNumber,
    previousSchool,
    documents,
    createdAt);
}
```

Unique on `(studentId, academicYearId)`.

**Created only on a student's first-ever class assignment.** `marking.assignStudentToClass`:

1. Counts existing `studentClassAssignment` rows for the student, across _every_ year, before inserting the new one.
2. Inserts the new `studentClassAssignment` row regardless.
3. If (and only if) the count from step 1 was zero, and the student's permanent record has an `admissionType` set, inserts a `studentAdmission` row using the admission details already on the `student` row.

So: grade 6 admission → row created on the grade-6-year assignment. Grade 7, 8, 9, 10, 11 continuation in later years → no new admission row, ever. Grade 12 transfer → the student's permanent record already has `admissionType: "grade12"`, so their first (grade-12) assignment creates the row; a re-admission for the same physical student re-entering later would go through the same first-assignment check against _that_ student record.

## Exam Types & Grading

### `examType` (grade-scoped)

```ts
{
  id, academicYearId, name, category,
  gradeLevel,   // integer, nullable at the DB level only for pre-existing rows;
                // REQUIRED at the API layer for every new exam type
  maxMark, sortOrder, createdAt,
}
```

Unique on `(academicYearId, gradeLevel, name)`.

**Why grade-scoped:** the same exam category (e.g. `"scholarship"`) commonly needs a different `maxMark` per grade — a grade 5 scholarship exam out of 100 vs. a grade 11 one out of 200. Each grade gets its own `examType` row rather than one row shared across every grade in the year.

`marking.createExamType` requires `gradeLevel`. `marking.listExamTypes` returns it and accepts an optional `gradeLevel` filter.

### `gradeScale`

Maps a mark range to a letter grade, per academic year, optionally per subject (`subjectKey: null` = a default scale for subjects without their own). Unique on `(academicYearId, subjectKey, grade)`.

### `subjectMark`

```ts
{
  id, studentClassAssignmentId, examTypeId,
  subjectKey,   // denormalized — see below
  mark, grade, enteredByStaffId, createdAt, updatedAt,
}
```

Unique on `(studentClassAssignmentId, examTypeId, subjectKey)` — one mark per student per exam per subject.

**`subjectKey` is stored directly on the row, not derived from a join.** This is deliberate and is the entire foundation the optional-subject-selection history relies on: whatever subject a mark was entered under is permanent, independent of anything that happens to the student's selection afterward.

## Optional Subject Selection

Which subjects _exist_ for a grade (compulsory or elective, and what the elective options are) is curriculum data — see [subjects.md](./subjects.md). This section is about a different, per-student question: _which_ elective a given student picked.

### `studentSubjectSelection`

```ts
{
  id, studentId, academicYearId,
  basketCategory,        // never COMPULSORY_BASKET_CATEGORY — only genuinely
                          // optional categories are ever "selected"
  subjectKey,
  previousSelectionId,   // FK to the row this one supersedes, or null
  supersededAt,          // null = this is the active selection
  createdAt,
}
```

Append-only. Nothing is ever updated in place except stamping `supersededAt` on the row being retired. A partial unique index guarantees exactly one active row per `(studentId, academicYearId, basketCategory)`:

```sql
CREATE UNIQUE INDEX sss_active_unique
  ON student_subject_selection (student_id, academic_year_id, basket_category)
  WHERE superseded_at IS NULL;
```

### Change flow — `marking.setSubjectSelection`

1. Reject outright if `basketCategory === COMPULSORY_BASKET_CATEGORY` — compulsory subjects apply automatically and are never a selection.
2. Look up the student's grade for that year via `studentClassAssignment` → `class_`.
3. Validate the new `subjectKey` actually exists in that year's materialized `gradeSubjectConfig` for `(gradeLevel, basketCategory)` — rejecting, for example, a subject that isn't offered for that basket at that grade.
4. Look up the current active row for `(studentId, academicYearId, basketCategory)`, if any, and set its `supersededAt = now()`.
5. Insert a new row with `previousSelectionId` pointing at the old row's id (or `null` if there wasn't one) and `supersededAt = null`.

### Reading it back

- `marking.getCurrentSubjectSelections(studentId, academicYearId)` — the active row per basket category. This is what a mark-entry UI should use to know which subjects to show for a student.
- `marking.listSubjectSelectionHistory(studentId, academicYearId)` — every row, oldest first, active and superseded alike, for audit/reporting.

### Why marks are safe

Say a student selects `ict` for their `technicalVocational` basket, a mark of 88 is entered for it, and the student manager later changes the selection to `homeEconomics`:

- `subjectSelection.set` supersedes the `ict` row and inserts a new `homeEconomics` row. The `ict` row still exists, just marked superseded — nothing is deleted.
- The `subjectMark` row from earlier still has `subjectKey: "ict"`, `mark: 88` — completely untouched, because it never referenced the selection table in the first place.
- `getCurrentSubjectSelections` now reports `homeEconomics` as current, correctly reflecting the change going forward, while every past mark stays exactly as recorded.

## API Summary

| Procedure | Notes |
| --- | --- |
| `marking.createStudent` | Accepts `admissionType`, `birthCertificateNumber`, `admissionGrade` on the permanent record |
| `marking.assignStudentToClass` | Creates `studentAdmission` only on the student's true first-ever assignment (see above) |
| `marking.createExamType` / `listExamTypes` | Grade-scoped; `gradeLevel` required on create, filterable on list |
| `marking.createGradeScale` / `listGradeScale` | Per academic year, optionally per subject |
| `marking.enterSubjectMark` / `updateSubjectMark` / `listMarksForClass` | `subjectKey` is captured directly at entry time |
| `marking.getStudentHistory` | All marks across all years for a student |
| `marking.setSubjectSelection` | The append-only change flow above |
| `marking.getCurrentSubjectSelections` / `listSubjectSelectionHistory` | Current vs. full audit trail |

## Related

- [subjects.md](./subjects.md) — how the set of available subjects per grade is defined and versioned (`gradeSubjectConfig`), which `setSubjectSelection` validates against.
- [staff.md](./staff.md) — teacher subject _assignments_ (who teaches what), a separate concept from a student's subject _selection_ documented here.
