# Tech Spec: Database Schema Redesign

## Overview

Refactor the `@aloysius/db` schema to support predefined teacher accounts, flexible academic years, unified teacher dashboard, code-versioned subject/curriculum structure, student admission tracking, and role consolidation.

**Stack**: Drizzle ORM + Turso/libSQL + better-auth + oRPC + Valibot

---

## Current Auth Architecture (Preserved)

The project already uses better-auth with:

- **Predefined credential accounts** via `ensureCredentialUser()` in `packages/auth/src/admin.ts`
- **Username plugin** for username-based login
- **Admin plugin** with custom roles and RBAC via `createAccessControl()`
- **Roles**: `admin`, `cms`, `teacher`

The `ensureCredentialUser` function creates users with:

- Synthetic internal email (`<username>@aloysius.internal`)
- Hashed password stored in `account` table
- Role assertion on every run (prevents drift)

The `studentOfficer`/`teacherOfficer` roles have already been consolidated into a single `teacher` role (see `packages/auth/src/permissions.ts`, `index.ts`, `admin.ts`, and `packages/api/src/index.ts`'s `teacherProcedure`).

---

## Schema Changes

### 1. `staff.ts` — Academic Year

**Table: `academicYear`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK |  |
| `year` | integer NOT NULL UNIQUE |  |
| `startDate` | text (ISO date), nullable | e.g. "2027-01-01" |
| `endDate` | text (ISO date), nullable | e.g. "2027-12-31" |
| `structureVersionKey` | text, nullable at the DB level | Which `StructureVersion` (see below) this year's `gradeSubjectConfig` was materialized from. Nullable only for pre-existing rows migrated before this column existed; **required** at the API layer (`academicYearInsertSchema`) for every new academic year. Not a DB foreign key — the code registry in `constants/structureVersions` is the source of truth, validated at the API layer. |
| `isCurrent` | boolean DEFAULT false |  |
| `createdAt` | integer (timestamp_ms) |  |

---

### 2. `academics.ts` — Class, Subject Assignment & Grade Subject Config

**Table: `class_`** — Admin-created per academic year (`gradeLevel`, `name`, `medium`, homeroom teachers). No curriculum-versioning involvement.

**Table: `subjectAssignment`** — What a teacher teaches in a year. Unique on `(staffId, academicYearId, subjectKey, classId)`.

**Table: `gradeSubjectConfig`** — Which subjects exist for a grade in a given academic year, both compulsory and optional.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | text PK |  |
| `academicYearId` | text FK → academicYear | NOT NULL, CASCADE |
| `gradeLevel` | integer | NOT NULL |
| `basketCategory` | text | NOT NULL — `COMPULSORY_BASKET_CATEGORY` for non-elective subjects, an O/L optional basket name, an A/L stream key, or a junior-secondary elective slot (e.g. `"op1"`). Deliberately a free-form string (not a closed picklist): the set of valid categories is owned by whichever `StructureVersion` produced the row, not a single global enum. |
| `subjectKey` | text | NOT NULL — free-form string; validated at the schema layer against `ALL_KNOWN_SUBJECT_KEYS` (the union of every subject key across every registered `StructureVersion`; see below) |
| `sortOrder` | integer | NOT NULL DEFAULT 0 |
| `createdAt` | integer (timestamp_ms) | NOT NULL |

**Unique**: `(academicYearId, gradeLevel, basketCategory, subjectKey)`. **Indexes**: `(academicYearId, gradeLevel)`, `(basketCategory)`.

Rows are never hand-seeded: they're materialized once, at academic-year creation, from a code-versioned `StructureVersion` (below), filtered to what this school's `SCHOOL` config actually offers.

#### Subject/curriculum structure is entirely code-versioned — `constants/structureVersions/`

There is **no shared curriculum constants file** (`constants/subjects.ts` was removed). Instead, every subject/curriculum fact — compulsory subjects per grade, O/L optional baskets, O/L religion/mother-tongue choices, A/L streams and their subjects — lives inside a named, immutable version file, fully self-contained.

**Why self-contained, not a shared import**: an earlier draft had version files import subject lists from a shared `constants/subjects.ts`. That's a real bug, not just a style preference — subjects.ts is documented as "additive only, edited over time," and if a version file read from it directly, a later edit to that shared file would silently change what a _new_ academic year materializes, even though academic years created _before_ the edit already have their own frozen rows. Two years pinned to the same `structureVersionKey` would then materialize _different_ content depending only on when they were created — exactly the drift versioning exists to prevent. So the rule is stricter than "don't edit a shipped version": **a version file must never import curriculum data from anywhere else.** The only import that's safe is `COMPULSORY_BASKET_CATEGORY`, a fixed sentinel string (schema convention, not curriculum data).

```
constants/structureVersions/
  constants.ts   # COMPULSORY_BASKET_CATEGORY = "compulsory"
  types.ts       # StructureVersionEntry / StructureVersion types
  v1.ts          # first shipped structure — immutable once any year references it; fully self-contained data
  index.ts       # STRUCTURE_VERSIONS registry, LATEST_STRUCTURE_VERSION_KEY, getStructureVersion(),
                 # ALL_KNOWN_SUBJECT_KEYS (union across every registered version, for schema validation)
  README.md      # the append-only + self-containment rules, spelled out
```

```typescript
export type StructureVersionEntry = {
  gradeLevel: number;
  basketCategory: string; // COMPULSORY_BASKET_CATEGORY, an O/L basket, an A/L stream, or an elective slot
  subjectKey: string; // a literal subject key, defined within this version file
  sortOrder: number;
};

export type StructureVersion = {
  key: string; // "v1" — matches the registry key, immutable
  description: string; // shown in the admin version picker
  entries: StructureVersionEntry[];
};
```

`gradeLevel` on every entry is validated against `GRADE_LEVELS` at module load; `basketCategory`/`subjectKey` are only checked for being non-empty (there's no external registry to check membership against — each version owns its own labels). A malformed version fails at build time, not at write time.

**`v1`'s content** (grades 1-13), sourced from Nuffic's Sri Lanka education-system summary (primary), NIE's Practical and Technical Skills syllabus (junior secondary, implemented 2015) and Department of Aesthetic Education subject list, and Department of Examinations 2025/2026 GCE O/L and A/L subject/timetable material:

| Grades | Category | Content |
| --- | --- | --- |
| 1-2 (Primary) | `compulsory` | 4 subject fields: mother tongue, mathematics, environment-related activities, religion |
| 3-5 (Primary) | `compulsory` | Same 4 fields, plus English and the second national language (added as subjects from grade 3 per the Ministry's pre-2026-reform structure) |
| 6-9 (Junior Secondary) | `compulsory` | 12 core subjects, including Practical and Technical Skills (PTS) — a real NIE/MOE subject implemented in 2015 covering multiple technical competency areas (including Agriculture), with ICT "integrated appropriately" into it rather than taught as a separate subject at this level |
| 6-9 | `aesthetic` | A genuine pick-one elective (per NIE's Department of Aesthetic Education) — not a flat compulsory "aesthetic subjects" entry, and not an invented multi-slot model. Reuses the same subject keys as the O/L Basket II elective for continuity (art, music variants, dancing variants, drama/theatre-by-language). |
| 10-11 (O/L) | `compulsory` | 4 subjects every student takes with no choice: English, mathematics, science, history |
| 10-11 | `religion` | Compulsory _choice_ — every student sits exactly one of 5 religion papers (buddhism, saivanery, catholicism, christianity, islam) |
| 10-11 | `motherTongue` | Compulsory _choice_ — sinhala or tamil language & literature |
| 10-11 | `languagesHumanities` / `aestheticsArts` / `technicalVocational` | The 3 O/L optional baskets (Category I/II/III per the DoE timetable); one subject picked from each. Basket II's drama/theatre paper is modeled per-language (Sinhala/Tamil/English), matching the DoE's separate papers. |
| 12-13 (A/L) | `compulsory` | General English + Common General Test, required regardless of stream. (General Information Technology is deliberately **not** included here or as a stream subject — it's a separate DoE qualification whose structural placement isn't confirmed yet.) |
| 12-13 | `bioScience` / `physicalScience` / `commerce` / `arts` / `engineeringTechnology` / `bioSystemsTechnology` | The 6 DoE-confirmed A/L streams, each with a subject pool. **The per-stream pools are an app-modeled approximation**, not a DoE-published combination table (the DoE records subject results individually, not as a stream-to-subject map) — exact compulsory-vs-optional rules within a stream (e.g. Bio Science requires Biology + Chemistry, then Physics _or_ Agricultural Science) aren't encoded. Treat as a starting point to verify, not ground truth. |

Corrections made across two review passes, relative to earlier drafts: (1) some subject names were wrong or outdated (`shaivism` → `saivanery`, matching the DoE's official paper name); drama/theatre split into its 3 per-language papers; (2) O/L "religion" and "mother tongue" are compulsory _choices_ with their own option sets, not flat compulsory subject keys — modeled as their own basket categories using the same selection mechanism as the optional baskets, though every school offers every religion/mother-tongue option so these aren't filtered by `SCHOOL` config the way optional baskets/streams are; (3) Practical and Technical Skills was missing entirely from junior secondary despite being a real, confirmed subject; (4) junior-secondary "aesthetic subjects" was wrongly modeled as a flat compulsory entry plus a separate, unsourced 4-slot elective pool that duplicated the same subjects — it's actually one pick-one elective category, now modeled that way; (5) primary's subject list was drawn from a 2026-reform-era document while the version's own docstring claimed to model the pre-reform structure — corrected to the actual pre-reform 4-subject-field structure (6 fields from grade 3).

**School-config filtering**: `constants/config/school.ts` (`SCHOOL`) still decides which O/L basket categories and A/L streams _this school_ actually runs (`offeredOLBasketCategories`, `offeredALStreams`), plus the school's grade range. `isStructureEntryOfferedBySchool(gradeLevel, basketCategory, compulsoryBasketCategory)` applies that filter; it's used both by materialization (a school not offering `bioSystemsTechnology` never gets those rows) and by the `listSubjects` read endpoint (so it reflects exactly what creating a year today would materialize).

**Materialization on academic-year creation**: in `staff.createAcademicYear`, look up `STRUCTURE_VERSIONS[structureVersionKey]` (throwing `BAD_REQUEST` if unknown), filter its entries through `isStructureEntryOfferedBySchool`, and insert the result as `gradeSubjectConfig` rows scoped to the new `academicYearId`. This is a one-time copy, not a live join — later additions to the registry, or to other years using the same key, can never retroactively change a year that already materialized its config.

**Default on creation**: `structureVersionKey` defaults to the most recently created academic year's value (roll forward unchanged) when omitted; picking a different version is an explicit choice.

**Migration**: backfill existing academic years' `structureVersionKey` to `"v1"`, and materialize `gradeSubjectConfig` retroactively for any year missing rows (using the same school-config-filtered `v1` entries), leaving any year that already has rows untouched.

---

### 3. `marking.ts` — Student Admission, Exam Types & Subject Selection History

**Table: `student`** — `admissionType` ("grade6" | "grade12" | "transfer"), `birthCertificateNumber` (NOT unique globally — grade 6–11 and 12–13 are separate pools), `admissionGrade`.

**Table: `studentClassAssignment`** — One row per student per year (`UNIQUE(studentId, academicYearId)`). A student progressing to the next grade in a later year is just a new row here — never a fresh admission event.

**Table: `studentAdmission`** — Tracks admission events. `assignStudentToClass` creates a `studentAdmission` row **only on a student's first-ever class assignment** (checked via a `COUNT` on prior `studentClassAssignment` rows for that student, across all years, before inserting), using the admission details already recorded on the permanent `student` row. Grades 7–11 continuation, and any later year's assignment, never re-registers the student or creates a second admission row. Unique on `(studentId, academicYearId)`.

**Table: `examType`** — Defines exam instances (First Term, Scholarship, etc.) per academic year.

| Column | Type | Notes |
| --- | --- | --- |
| `gradeLevel` | integer, nullable at the DB level | The same exam category (e.g. "scholarship") commonly needs a different `maxMark` per grade — a grade 5 scholarship exam out of 100 vs. a grade 11 one out of 200 — so each grade gets its own exam type row rather than sharing one. Nullable only for pre-existing rows; **required** at the API layer for every new exam type. |

**Unique**: `(academicYearId, gradeLevel, name)` (was `(academicYearId, name)` before grading became grade-scoped).

**Table: `gradeScale`** — Unchanged.

**Table: `subjectMark`** — Unchanged; `subjectKey` is already denormalized directly on every mark row (not derived from a join). This is the historical-integrity anchor `studentSubjectSelection` relies on: whatever subject a mark was entered under stays true forever, no matter what the student's selection later becomes.

**Table: `studentSubjectSelection`** — A student's chosen optional/basket subject for a given academic year + basket category, append-only.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | text PK |  |
| `studentId` | text FK → student | NOT NULL, CASCADE |
| `academicYearId` | text FK → academicYear | NOT NULL, CASCADE |
| `basketCategory` | text | NOT NULL — never `COMPULSORY_BASKET_CATEGORY`; free-form string, validated against that year's materialized `gradeSubjectConfig` by the `setSubjectSelection` handler, not by a closed enum |
| `subjectKey` | text | NOT NULL |
| `previousSelectionId` | text FK → studentSubjectSelection | NULLABLE — the prior selection this one supersedes |
| `supersededAt` | integer (timestamp_ms) | NULLABLE — NULL means this is the active selection |
| `createdAt` | integer (timestamp_ms) | NOT NULL |

**Partial unique index** (SQLite/libSQL supports `WHERE` on unique indexes):

```sql
CREATE UNIQUE INDEX sss_active_unique
  ON student_subject_selection (student_id, academic_year_id, basket_category)
  WHERE superseded_at IS NULL;
```

Guarantees exactly one active selection per student, per year, per basket category, while allowing unlimited superseded rows as history.

**Change flow (`marking.setSubjectSelection`)**:

1. Reject outright if `basketCategory === COMPULSORY_BASKET_CATEGORY`.
2. Look up the student's grade for that year via `studentClassAssignment` → `class_`.
3. Validate the new `subjectKey` exists in that year's materialized `gradeSubjectConfig` for `(gradeLevel, basketCategory)`.
4. Look up the current active row for `(studentId, academicYearId, basketCategory)`, if any, and set its `supersededAt = now()`.
5. Insert a new row with `previousSelectionId` pointing at the old row's id (or `null`) and `supersededAt = NULL`.

Nothing is ever updated in place except stamping `supersededAt` on the row being retired.

**Read side**: `marking.getCurrentSubjectSelections(studentId, academicYearId)` returns the active row per basket category. `marking.listSubjectSelectionHistory(studentId, academicYearId)` returns the full chain, oldest first, for audit/reporting.

---

### 4. `auth.ts` — Role Consolidation

Already implemented: `teacher` role replaces `studentOfficer`/`teacherOfficer` throughout `packages/auth` and `packages/api`.

---

### 5. Unchanged Files

`brand.ts`, `primitives.ts`, `files.ts`, `cms.ts`, `qualifications.ts` — no changes.

---

## Constants (`packages/db/src/constants`)

| File | Role |
| --- | --- |
| `structureVersions/*` | **New.** All subject/curriculum data — see above. |
| `languages.ts` | **New.** `MOTHER_TONGUE_OPTIONS` — a stable, non-curriculum operational option (class medium, staff native language), not scoped to a structure version. |
| `religions.ts` | **New.** `RELIGION_OPTIONS` — a person's personal religion for demographic records, distinct from the O/L exam "religion" subject choice (which is curriculum data living in `structureVersions`). |
| `demographics.ts` | **New.** `GENDERS`, `MARITAL_STATUSES`, `BLOOD_GROUPS` — generic person-attribute constants, split out of `teachers.ts` since they aren't teacher-specific. |
| `geography.ts` | **New.** `SRI_LANKA_DISTRICTS` — split out of `teachers.ts` for the same reason (usable for any address field, not just staff). |
| `teachers.ts` | Narrowed to genuinely teacher/employment-specific constants: `APPOINTMENT_TYPES`, `EMPLOYMENT_STATUSES`, `QUALIFICATION_LEVELS`, `DOCUMENT_TYPES`, `SUBJECT_SPECIALIZATION_CATEGORIES`. |
| `subjects.ts` | **Removed.** Its curriculum content moved into `structureVersions/v1.ts` (self-contained, corrected); `MOTHER_TONGUE_OPTIONS`/`RELIGION_OPTIONS` moved to `languages.ts`/`religions.ts` above. |
| `grades.ts`, `positions.ts` | Unchanged. |

`packages/db/src/config/school.ts` gained `isStructureEntryOfferedBySchool()`, used by both materialization and `listSubjects`.

---

## API Changes (`packages/api`)

### Staff Router

| Procedure | Change |
| --- | --- |
| `createAcademicYear` | Accepts `startDate`, `endDate`, `structureVersionKey` (optional, defaults to the most recent year's value) in addition to `year`. Validates the key against `STRUCTURE_VERSIONS`, then materializes `gradeSubjectConfig` (school-config-filtered) in the same handler. |
| `listAcademicYears` | Returns `structureVersionKey` |
| `listStructureVersions` | **New.** Lists registered version keys + descriptions for the admin version picker. |
| `listSubjects` | Rewritten: takes an optional `structureVersionKey` (defaults to latest), returns that version's entries filtered by `SCHOOL` config — i.e. exactly what creating a year with that version would materialize. Replaces the old implementation that read the now-removed `constants/subjects.ts` directly. |
| `assignSubject` | Validate against `gradeSubjectConfig` |

### Marking Router

| Procedure | Change |
| --- | --- |
| `createStudent` | Accept `admissionType`, `birthCertificateNumber`, `admissionGrade` |
| `assignStudentToClass` | Creates a `studentAdmission` record only on the student's first-ever class assignment (see schema section above) |
| `createExamType` | Requires `gradeLevel` |
| `listExamTypes` | Returns `gradeLevel`; accepts an optional `gradeLevel` filter |
| `setSubjectSelection` | **New.** See change flow above. |
| `getCurrentSubjectSelections` | **New.** |
| `listSubjectSelectionHistory` | **New.** |

### Router Updates

Already implemented: `teacherProcedure` replaces `studentOfficerProcedure`/`teacherOfficerProcedure` throughout.

---

## Dashboard Changes (`apps/web`)

No academic-year, structure-version, or subject-selection UI exists yet anywhere in `apps/web` — this feature currently ships as a backend/API capability only, verified via real-database API tests (see Testing Plan). If/when an admin academic-year screen is built, it should:

- Include a structure-version picker (defaulting to the prior year's version) sourced from `staff.listStructureVersions`.
- Surface a student's current basket-subject selection with a "change subject" action calling `marking.setSubjectSelection`, plus a read-only history view via `marking.listSubjectSelectionHistory`.

---

## Migration Strategy

Migrations are hand-verified (this project's `drizzle-kit migrate` has a known Windows/libsql quirk — see `scripts/migrate.mjs` — so each migration was applied statement-by-statement against a scratch libsql file to confirm it runs clean, both from empty and against a DB with pre-existing rows).

1. `<timestamp>_structure_versions_and_subject_selection`: creates `student_subject_selection` (+ partial unique index), adds `academic_year.structure_version_key` and `exam_type.grade_level` (the latter requires SQLite's table-rebuild pattern since `exam_type`'s unique constraint changed shape), then two data statements: backfill `structure_version_key = 'v1'` for any existing academic year, and materialize `grade_subject_config` for any academic year missing rows, from `v1`'s school-config-filtered entries.
2. Run via `bun run db:migrate`.

---

## Testing Plan

Real-database tests (`@aloysius/db/testing`'s `createTestDb()` — full schema pushed to a scratch libsql file) exercising the actual `appRouter` procedures, not mocks:

1. `packages/api/src/routers/staff/structure-version.test.ts`:
   - Creating an academic year with `structureVersionKey: "v1"` materializes exactly the school-config-filtered `gradeSubjectConfig` rows (332 for this school's `SCHOOL` config).
   - An unknown `structureVersionKey` is rejected (`BAD_REQUEST`).
   - Omitting `structureVersionKey` defaults to the most recently created year's value.
   - Two years on the same version get independent row sets — mutating one never affects the other.
   - `listStructureVersions` returns the registered `v1` key.
2. `packages/api/src/routers/marking/subject-selection.test.ts`:
   - `setSubjectSelection` called twice for the same `(student, year, basketCategory)` leaves exactly one active row and a 2-entry history chain; a `subjectMark` entered under the first selection keeps its original `subjectKey` after the change.
   - Selecting a subject not offered for that basket/grade is rejected.
   - Selecting the compulsory category directly is rejected.
   - `assignStudentToClass` creates exactly one `studentAdmission` row across two years of continuous assignment for the same student, dated to the first year.
3. Existing mock-based tests (`staff.test.ts`, `index.test.ts`) updated for the new required/optional fields; `drizzle-kit generate` used throughout development to verify migration SQL shape.
