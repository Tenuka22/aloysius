# Product Spec: Database Schema Redesign

## Problem

The current database schema has several architectural issues:

1. Teachers sign up via OAuth — need predefined admin-created accounts with rotatable passwords
2. Academic year lacks explicit date ranges (Jan–Dec)
3. Separate teacher-officer and student-officer dashboards — should be unified teacher dashboard
4. O/L basket configuration is hardcoded — needs DB-stored config for layout flexibility
5. No admission tracking for grade 6 newcomers or grade 12 transfers
6. No fine-grained RBAC permission system
7. Subject/curriculum data was a single shared, growing constants file — useful for historical integrity in isolation, but it meant a school's curriculum couldn't evolve (a grade's subject count changing, a new elective category, a corrected exam-subject name) without every academic year silently sharing the same live values
8. Basket/subject structure per academic year is seeded ad hoc — no versioned, auditable link between an academic year and the exact structure it uses, so it's hard to guarantee two years share identical rules or evolve the scheme safely
9. Students' optional-subject choices aren't a first-class, revisable record — changing a student's optional subject risks silently altering what already-recorded marks mean

## Desired Behavior

### Teacher Accounts

- Admin creates teacher accounts with predefined usernames + rotatable passwords
- No open signup — teachers receive credentials from admin
- Each teacher selects their academic year on login → sees their dashboard
- Teacher dashboard shows: assigned subjects, assigned classes, mark entry interface

### Academic Year

- Admin-managed with explicit date ranges (e.g., Jan 2027 – Dec 2027)
- Only one year marked as `isCurrent` at a time
- Academic year drives all year-scoped data (classes, assignments, marks)

### Academic Structure Versions

- The school's entire subject/curriculum structure for every grade level is defined in code as a named, immutable "structure version" (e.g. `v1`, `v2`) — never edited in place once any academic year uses it, and never assembled from a shared file that could change independently of the version itself
- When an admin creates a new academic year, they pick a structure version:
  - Default: the same version the most recently created academic year used (the common case — same scheme, roll forward unchanged)
  - Explicit switch: pick a newer version when the school migrates to a different curriculum (e.g. a grade's subject count changes, baskets go from 3 to 4, an exam subject is renamed or split)
- Introducing a new scheme requires adding a new version to code first, documented by a README that states the rule plainly: never edit a shipped version, and never let a version reference curriculum data from anywhere outside itself. The admin panel can only choose versions that already exist in code, so structural changes stay a reviewed code change, not an ad-hoc database edit
- On creation, the academic year's full subject/basket configuration is copied from the chosen version into records scoped to that year — so if the code version is later extended, a past academic year's stored configuration never moves
- Every academic year remains permanently pinned to whichever version (and copied configuration) it was created with, keeping the structure of past years predictable forever
- A school's own configuration (which O/L basket categories and A/L streams it actually runs, and its grade range) further filters what actually gets copied — a school not offering a particular A/L stream never gets that stream's subjects materialized for its academic years

### Student Management

- Grade 6 admission: new students enter via birth certificate number + admission number
- Grade 12 admission: transfer/re-admission students enter at grade 12
- Students are assigned to a class each academic year via `studentClassAssignment`
- A student progressing to their next grade in a later year is never re-registered or re-admitted — only a genuinely new admission (grade 6 entry, grade 12 entry, or transfer) creates an admission record; continuing to grade 7, 8, 9, 10, or 11 is just a new class assignment
- Grade 6–11 and grade 12–13 are separate pools — same birth cert can exist in both
- Admission number is globally unique

### Optional Subject Selection

- From the grade level where basket/optional subjects apply, a student manager selects that student's basket subjects for the academic year from the options defined by that year's structure version
- Student managers can change a student's optional subject selection later in the same year (e.g. ICT → Home Economics)
- Changing the selection never rewrites history: marks already entered for the previous subject keep referencing that subject exactly as entered — they are not moved, relabeled, or deleted
- The system keeps a dated history of every selection and change, so it is always possible to see which subject a student was enrolled in on any given date. The "current" selection is simply the latest record in that history; nothing is overwritten in place
- Subjects every student takes automatically (with no choice involved) are never something a student manager "selects" — the system rejects any attempt to select a compulsory subject through this flow

### Subject & Curriculum Data

- All subject/curriculum data — compulsory subjects per grade, O/L optional baskets, O/L religion and mother-tongue exam choices, A/L streams and their subjects — is defined entirely inside each structure version, sourced from Ministry of Education and Department of Examinations material. There is no separate, shared "list of all subjects" that every version reads from
- A version is a complete, standalone snapshot: it never references another version's or a shared file's curriculum data, so a school's curriculum can change shape (more or fewer subjects for a grade, a corrected or renamed exam subject, a new A/L stream) purely by shipping a new version, without any risk to a year already built on an older one
- O/L "religion" and "mother tongue" are modeled as compulsory _choices_ (every student sits one of several religion papers, and one of the two mother-tongue papers) rather than a single fixed subject — this matches how the actual O/L examination works
- Admin panel exposes curriculum layout only as a structure-version picker; changing the layout requires a code change, not a live database edit

### Marking System

- Teachers enter marks for students in their assigned classes
- Exam types, grade scales, subject marks per student per exam per subject
- The same exam category (e.g. "Scholarship") can have a different maximum mark per grade (e.g. grade 5 out of 100, grade 11 out of 200) — exam types are scoped per grade, not shared across every grade in a year
- Flexible marking structure per grade/subject/year

### RBAC

- Unified `teacher` role replaces `teacherOfficer`/`studentOfficer`
- Fine-grained permissions: `(resource, action, role)` triples
- Roles: `admin`, `teacher`, `cms`

## Success Criteria

1. Admin can create teacher accounts with predefined credentials
2. Teacher can log in, select academic year, see their dashboard with assigned subjects/classes
3. Teacher can enter marks for students in their classes
4. Grade 6 students can be admitted with birth certificate + admission number
5. Grade 12 transfer students can be admitted
6. A student is never re-admitted or re-registered for continuing grades — exactly one admission record exists per student across their entire time at the school (barring a genuine transfer)
7. No duplicate student assignments per year
8. An academic year's subject/curriculum configuration is always traceable to the exact structure version it was created from, and that configuration never changes retroactively — even if the version's own file is later extended for future years
9. Changing a student's optional subject preserves every previously entered mark exactly as recorded, while correctly showing the student's current subject going forward
10. A structure version's subject/curriculum content is grounded in real Ministry of Education / Department of Examinations subject lists, not invented groupings

## Edge Cases

- Teacher assigned to multiple classes of same grade (e.g., Grade 7A and Grade 7B)
- Student transfers mid-year (new class assignment for same year)
- Academic year change: all year-scoped data is partitioned by academicYearId
- Grade 12 re-admission: student from grades 6–11 re-enters at grade 12
- Admin creates a new academic year without specifying a version → defaults to the prior year's version; migrating to a new scheme requires that version to already exist in code
- Student changes basket subject twice in the same year → selection history contains all three states (original, first change, second change); each mark stays pinned to whatever subject was true when it was entered
- Two students in the same class/grade pick different basket subjects → each mark row carries its own subject, so mixed selections within a class are represented correctly
- A student manager attempts to "select" a compulsory subject → rejected; compulsory subjects apply automatically and are never a selection
- A school doesn't offer a particular A/L stream or O/L basket category → that stream/category's subjects are never materialized into that school's academic years, even though the code version defines them (for schools that do offer them)

## Non-Goals

- Student self-service portal (students don't log in)
- Automated grade progression (admin manually assigns classes each year)
- Parent portal
- A fully verified, DoE-confirmed mapping of exactly which subjects are compulsory vs. optional _within_ each A/L stream (the current version's per-stream subject pools are an app-modeled starting point, not sourced from an official combination table, and should be verified before relying on them for real student data)
