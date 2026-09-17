# Staff Management System

## Overview

Aloysius manages academic staff (teachers, sectional heads, principals) with year-based assignments for positions, classes, and subject teaching. All curriculum data (grades, subjects, positions) is defined as TypeScript constants — only staff records, assignments, and year configurations are stored in the database.

> Subject/curriculum data now lives entirely in versioned files under `constants/structureVersions/` — see [subjects.md](./subjects.md). This doc covers staff, academic years, classes, and subject _assignments_ (who teaches what); it does not re-explain the curriculum structure itself.

## Sri Lankan Education System

The system models the Sri Lankan Ministry of Education structure:

```
Grade 1-5    → Primary
Grade 6-9    → Junior Secondary
Grade 10-11  → Senior Secondary Phase I (GCE O/L)
Grade 12-13  → Senior Secondary Phase II (GCE A/L)
```

Schools are classified by type:

- **Type 1AB**: Offers A/L with Science stream (Grades 1-13)
- **Type 1C**: Offers A/L Arts & Commerce (Grades 1-13)
- **Type 2**: Up to Grade 11
- **Type 3**: Up to Grade 8

## File Structure

```
packages/db/src/
├── constants/
│   ├── grades.ts          # Grade levels 1-13, education stages
│   ├── positions.ts       # Staff position types and sectional scopes
│   ├── teachers.ts        # Appointment/employment types, qualification
│   │                      # levels + order, document types, subject
│   │                      # specialization categories (teacher-specific only)
│   ├── demographics.ts    # GENDERS, MARITAL_STATUSES, BLOOD_GROUPS — generic
│   │                      # person attributes, not teacher-specific
│   ├── geography.ts       # SRI_LANKA_DISTRICTS
│   ├── religions.ts       # RELIGION_OPTIONS (personal/demographic field)
│   ├── languages.ts       # MOTHER_TONGUE_OPTIONS (class medium, staff
│   │                      # native language — operational, not curriculum)
│   └── structureVersions/ # All subject/curriculum data — see subjects.md
├── config/
│   ├── school.ts             # School-specific config (hardcoded)
│   └── teacher-validation.ts # Validation helpers (NIC, phone, password
│                              # strength, qualification labels, experience
│                              # calculation)
└── schema/
    ├── staff.ts           # staff, academicYear (incl. structureVersionKey),
    │                      # staffPosition tables
    ├── academics.ts       # class_, subjectAssignment, gradeSubjectConfig
    │                      # tables — see subjects.md for gradeSubjectConfig
    └── qualifications.ts  # teacherQualification, employmentVerification,
                            # passwordRotationHistory tables

packages/api/src/routers/staff/
├── index.ts               # Barrel composing procedures
├── list-staff.ts          # List all staff
├── get-staff.ts           # Get single staff member
├── create-staff.ts        # Create staff (admin)
├── update-staff.ts        # Update staff (admin)
├── delete-staff.ts        # Delete staff (admin)
├── list-academic-years.ts # List academic years
├── create-academic-year.ts# Create academic year, accepting/validating a
│                          # structureVersionKey and materializing
│                          # gradeSubjectConfig — see subjects.md
├── set-current-year.ts    # Set current year
├── list-staff-positions.ts# List position assignments
├── assign-position.ts     # Assign position to staff
├── remove-position.ts     # Remove position assignment
├── list-classes.ts        # List classes by year
├── create-class.ts        # Create class
├── assign-class-teacher.ts# Assign homeroom/sub-homeroom
├── list-subject-assignments.ts # List subject assignments
├── assign-subject.ts      # Assign subject to teacher
├── list-subjects.ts       # List subjects for a structure version,
│                          # filtered by school config — see subjects.md
├── list-grades.ts         # List grades (from constants)
├── list-positions.ts      # List positions (from constants)
├── list-structure-versions.ts # List registered structure versions
├── update-profile.ts      # Self-service: phone/portrait
├── upload-qualification.ts# Upload qualification doc
├── list-qualifications.ts # List qualifications
├── approve-qualification.ts # Approve/reject qualification
└── staff.test.ts          # Tests
```

## Constants (Hardcoded, Not Database)

### Grades

`packages/db/src/constants/grades.ts`

```ts
export const GRADE_LEVELS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
] as const;
export type GradeLevel = (typeof GRADE_LEVELS)[number];

export const EDUCATION_STAGES = {
  primary: { grades: [1, 2, 3, 4, 5], label: "Primary" },
  juniorSecondary: { grades: [6, 7, 8, 9], label: "Junior Secondary" },
  seniorSecondaryPhaseI: {
    grades: [10, 11],
    label: "Senior Secondary Phase I (O/L)",
  },
  seniorSecondaryPhaseII: {
    grades: [12, 13],
    label: "Senior Secondary Phase II (A/L)",
  },
};
```

### Subjects

Subject/curriculum data (compulsory subjects per grade, O/L baskets, A/L streams) is no longer a flat constants file — it's defined per code-versioned "structure version" and materialized into the `gradeSubjectConfig` table per academic year. See **[subjects.md](./subjects.md)** for the full model.

### Positions

`packages/db/src/constants/positions.ts`

```ts
export const POSITION_TYPES = {
  principal: { name: "Principal", category: "leadership" },
  vicePrincipal: { name: "Vice Principal", category: "leadership" },
  assistantPrincipal: { name: "Assistant Principal", category: "leadership" },
  sectionalHead: { name: "Sectional Head", category: "sectional" },
  headOfDepartment: { name: "Head of Department", category: "sectional" },
  teacher: { name: "Teacher", category: "teaching" },
};

export const SECTIONAL_SCOPES = [
  "prePrimary",
  "primary",
  "grade6_7",
  "grade8_9",
  "grade10_11",
  "grade12_13",
  "grade12_13_science",
  "grade12_13_commerce",
  "grade12_13_arts",
];
```

**Key insight:** Sectional heads ARE teachers. A Grade 9 sectional head also teaches a subject. The `staffPosition` table tracks their administrative role; the `subjectAssignment` table tracks what they teach.

### Teacher Constants

`packages/db/src/constants/teachers.ts` — personal, employment, and qualification enums for the extended staff profile.

| Constant | Shape | Notes |
| --- | --- | --- |
| `GENDERS` | `["male", "female"]` | Male or female only, per requirement |
| `MARITAL_STATUSES` | `["single", "married", "divorced", "widowed"]` |  |
| `BLOOD_GROUPS` | `["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]` |  |
| `APPOINTMENT_TYPES` | 8 keys (`permanent`, `temporary`, `specifiedPeriod`, `directRecruitment`, `promoted`, `transferred`, `acting`, `contract`) | Each carries a `label`, `description`, and `requiresDocument` |
| `APPOINTMENT_DOCUMENT_REQUIREMENTS` | `Record<AppointmentType, string[]>` | Documents needed per appointment type (e.g. `promoted` needs both a promotion letter and the previous appointment letter) |
| `EMPLOYMENT_STATUSES` | `active`, `onLeave`, `suspended`, `retired`, `terminated` | Each with `label` + `description` |
| `QUALIFICATION_LEVELS` | 13 keys from `gceOl` to `phD` | Each has a numeric `level` (1-9) for seniority comparison, a `label`, and a `description` |
| `QUALIFICATION_ORDER` | Ordered array of the 13 qualification keys | Low-to-high, used for UI ordering |
| `SRI_LANKA_DISTRICTS` | All 25 districts | Lowercase keys, e.g. `"colombo"`, `"anuradhapura"` |
| `DOCUMENT_TYPES` | `nationalIdentityCard`, `passport`, `appointmentLetter`, `degreeCertificate`, `teachingLicense`, `marriageCertificate`, `birthCertificate` | Each declares which verification flow (`requiredFor`) it belongs to |
| `SUBJECT_SPECIALIZATION_CATEGORIES` | 10 categories (primary, languages, mathematics, science, humanities, commerce, artsAesthetics, physicalEducation, technology, vocational) | Used to tag a qualification's subject specialization |

Helper functions: `getQualificationLevel`, `compareQualifications`, `getHighestQualification` (all operate on `QUALIFICATION_LEVELS`' numeric `level`).

### Validation Schemas

`packages/db/src/constants/schemas.ts` builds Zod schemas directly from the constants above — a single source of truth so validation can never drift from the enum lists. Key exports:

| Schema | Validates |
| --- | --- |
| `phoneSchema` | Sri Lankan mobile format: `+947XXXXXXXX` or `07XXXXXXXX` |
| `nicSchema` | Old NIC (9 digits + `V`) or new NIC (12 digits) |
| `dateSchema` | `YYYY-MM-DD` |
| `addressSchema` | Address line 1/2, city, district, GN division, 5-digit postal code |
| `qualificationInputSchema` | `{ qualification, yearObtained?, institution?, subjectSpecialization?, specializationCategory?, documentFileId? }` — the shape `uploadQualification` accepts |
| `strongPasswordSchema` | 12+ chars, upper/lower/digit/special character |
| `updateStaffSchema` | Full extended staff profile (personal, address, employment, portrait/NIC file IDs) — **not currently wired into `updateStaff`'s handler**, which still validates only `name/email/nic/phone` inline |
| `qualificationReviewSchema` | `{ id, status, reviewNote? }` — the shape `approveQualification` accepts |
| `rotatePasswordSchema` / `adminRotatePasswordSchema` | Self-service vs admin-initiated password rotation (no router uses these yet) |

### Validation Helpers

`packages/db/src/config/teacher-validation.ts` wraps the schemas above into ergonomic functions: `validatePasswordStrength`, `isPasswordStrongEnough`, `validateNIC`, `validatePhone`, `calculateYearsOfExperience` (derives experience from `appointmentDate`, not manually entered), `getQualificationLabel`, `validateStaffUpdate`, `getAppointmentTypeLabel`, `getDefaultEmploymentStatus`, and `validateGender`/`validateMaritalStatus`/`validateBloodGroup`/`validateDistrict`. None of these are called by the current staff routers yet — they exist ahead of the CRUD endpoints being extended to accept the new profile fields.

### School Config

`packages/db/src/config/school.ts` — hardcoded, not database.

```ts
export const SCHOOL: SchoolConfig = {
  name: "Aloysius College",
  type: "1AB",
  gradeRange: { min: 1, max: 13 },
  mediums: ["sinhala", "tamil", "english"],
  religions: ["buddhism", "catholicism", "islam"],
  motherTongues: ["sinhala", "tamil"],
  offeredOLBasketCategories: [
    "languagesHumanities",
    "aestheticsArts",
    "technicalVocational",
  ],
  offeredALStreams: ["bioScience", "physicalScience", "commerce", "arts"],
  offeredGrade9Optionals: true,
};
```

The `list-subjects` and `list-grades` API endpoints read from this config to filter what the school offers. A Type 3 school (up to Grade 8) would never show O/L or A/L subjects.

## Database Schema

### Staff Table

`packages/db/src/schema/staff.ts` — a permanent record (not year-dependent). Only `id`, `name`, `email`, `nic`, `phone`, `portraitFileId` are currently read/written by the staff CRUD routers (`listStaff`/`getStaff`/`createStaff`/`updateStaff`/`updateProfile`); every other column below exists in the schema and has a matching Zod shape in `updateStaffSchema`, but no router accepts it yet.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | UUID |
| `name` | text NOT NULL | Full name |
| `email` | text UNIQUE | Work email (nullable) |
| `nic` | text UNIQUE | National Identity Card (nullable) |
| `phone` | text | Contact number (nullable) |
| `birthDate` | text (ISO date) | Not yet exposed via any router |
| `gender` | text (`Gender`) | `"male"` \| `"female"` — not yet exposed |
| `religion` | text | Not yet exposed |
| `motherTongue` | text | Not yet exposed |
| `bloodGroup` | text (`BloodGroup`) | Not yet exposed |
| `maritalStatus` | text (`MaritalStatus`) | Not yet exposed |
| `spouseName` | text | Not yet exposed |
| `addressLine1` / `addressLine2` | text | Not yet exposed |
| `city` | text | Not yet exposed |
| `district` | text (`SriLankaDistrict`) | Not yet exposed |
| `gramaNiladhariDivision` | text | Not yet exposed |
| `postalCode` | text | Not yet exposed |
| `emergencyContactName` / `emergencyContactPhone` | text | Not yet exposed |
| `appointmentType` | text (`AppointmentType`) | Not yet exposed |
| `appointmentDate` | text (ISO date) | Drives `calculateYearsOfExperience`; not yet exposed |
| `teacherServiceNo` | text | Not yet exposed |
| `employmentStatus` | text (`EmploymentStatus`) | Not yet exposed |
| `portraitFileId` | text FK → files.id | Profile photo (nullable) — editable via `updateProfile` |
| `nationalIdentityCardFileId` | text FK → files.id | NIC scan (nullable) — not yet exposed |
| `createdAt` | integer (timestamp_ms) | Auto-set |
| `updatedAt` | integer (timestamp_ms) | Auto-set |

Indexes: `email`, `nic`, `appointmentType`, `employmentStatus`.

### Academic Year Table

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | UUID |
| `year` | integer UNIQUE | e.g., 2027 |
| `startDate` | text (ISO date), nullable | e.g. "2027-01-01" |
| `endDate` | text (ISO date), nullable | e.g. "2027-12-31" |
| `structureVersionKey` | text, nullable at DB level | Which curriculum structure version this year's `gradeSubjectConfig` came from — **required** at the API layer for every new year. See [subjects.md](./subjects.md). |
| `isCurrent` | boolean | One year flagged as current |
| `createdAt` | integer (timestamp_ms) | Auto-set |

### Staff Position Table

Tracks what role a staff member holds in a given year.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | UUID |
| `staffId` | text FK → staff.id | Cascade delete |
| `academicYearId` | text FK → academicYear.id | Cascade delete |
| `position` | text NOT NULL | Enum key (e.g., "principal") |
| `sectionalScope` | text | Enum key for sectional heads (e.g., "grade8_9") |
| `createdAt` | integer (timestamp_ms) | Auto-set |

Unique constraint: `(staffId, academicYearId, position, sectionalScope)`

## Class Configuration

### How Classes Work

Classes are year-dependent configurations that define how students are grouped. Each class belongs to:

- An **academic year** (e.g., 2027)
- A **grade level** (1-13)
- Has a **name** (e.g., "9A", "12SC1")
- Has a **medium** of instruction (sinhala, tamil, english)

### Class Table

`packages/db/src/schema/academics.ts`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | UUID |
| `academicYearId` | text FK → academicYear.id | Cascade delete |
| `gradeLevel` | integer NOT NULL | 1-13 |
| `name` | text NOT NULL | e.g., "9A", "12SC1" |
| `medium` | text DEFAULT "sinhala" | "sinhala" \| "tamil" \| "english" |
| `homeroomTeacherId` | text FK → staff.id | Nullable, set null on delete |
| `subHomeroomTeacherId` | text FK → staff.id | Nullable, set null on delete |
| `createdAt` | integer (timestamp_ms) | Auto-set |

Unique constraint: `(academicYearId, gradeLevel, name)`

### Class Setup Flow

**Step 1: Create the academic year**

```
staff.createAcademicYear({ year: 2027, structureVersionKey: "v1" })
// structureVersionKey is optional — omitted, it defaults to the most
// recently created academic year's version
```

**Step 2: Create classes for each grade**

```
staff.createClass({ academicYearId: "ay1", gradeLevel: 9, name: "9A", medium: "sinhala" })
staff.createClass({ academicYearId: "ay1", gradeLevel: 9, name: "9B", medium: "sinhala" })
staff.createClass({ academicYearId: "ay1", gradeLevel: 9, name: "9C", medium: "english" })
staff.createClass({ academicYearId: "ay1", gradeLevel: 12, name: "12SC1", medium: "sinhala" })
staff.createClass({ academicYearId: "ay1", gradeLevel: 12, name: "12CM1", medium: "sinhala" })
```

**Step 3: Assign homeroom teachers**

```
staff.assignClassTeacher({ classId: "c1", homeroomTeacherId: "s1", subHomeroomTeacherId: "s2" })
```

### Class Naming Conventions

| Grade | Example Names | Notes |
| --- | --- | --- |
| 1-5 | 1A, 2B, 3C | Simple letter suffix |
| 6-9 | 6A, 7B, 8C, 9A | Simple letter suffix |
| 10-11 | 10A, 11B | O/L classes |
| 12-13 | 12SC1, 12CM1, 13AR1 | Stream prefix: SC=Science, CM=Commerce, AR=Arts |

### Subject Assignments

Subject assignments connect a teacher to a subject, grade, and optionally a specific class.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | UUID |
| `staffId` | text FK → staff.id | The teacher |
| `academicYearId` | text FK → academicYear.id | The year |
| `subjectKey` | text NOT NULL | Enum key (e.g., "mathematics") |
| `gradeLevel` | integer NOT NULL | 1-13 |
| `classId` | text FK → class_.id | Nullable: null = all classes of this grade |

Unique constraint: `(staffId, academicYearId, subjectKey, classId)`.

`subjectKey` isn't validated against a fixed enum here — it's validated at the schema layer against `ALL_KNOWN_SUBJECT_KEYS`, the union of every subject key across every registered structure version (see [subjects.md](./subjects.md)). Whether a subject actually makes sense for that `gradeLevel` in that `academicYearId` is tracked separately by `gradeSubjectConfig` (also documented in subjects.md) — `assignSubject` does not currently cross-check against it.

**Examples:**

```ts
// Mr. Perera teaches Mathematics to all of Grade 9
assignSubject({
  staffId: "s1",
  academicYearId: "ay1",
  subjectKey: "mathematics",
  gradeLevel: 9,
});

// Ms. Silva teaches Science only to class 9A
assignSubject({
  staffId: "s2",
  academicYearId: "ay1",
  subjectKey: "science",
  gradeLevel: 9,
  classId: "c1",
});

// Mr. Fernando teaches Physics to all of Grade 12
assignSubject({
  staffId: "s3",
  academicYearId: "ay1",
  subjectKey: "physics",
  gradeLevel: 12,
});
```

## Qualification/Certification System

Staff can record qualifications (degrees, certificates, etc.) with an optional supporting document; the document requires admin approval before becoming verified. `packages/db/src/schema/qualifications.ts` defines three tables — only `teacherQualification` has routers today.

### Qualification Table (`teacherQualification`)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | UUID |
| `staffId` | text FK → staff.id | Cascade delete |
| `qualification` | text NOT NULL | `QualificationLevel` enum key (e.g., `"bachelorEducation"`) |
| `yearObtained` | integer | Nullable |
| `institution` | text | Nullable |
| `subjectSpecialization` | text | Nullable, free text (e.g., "Mathematics") |
| `specializationCategory` | text | Nullable, `SubjectSpecializationCategory` enum key |
| `documentFileId` | text FK → files.id, `onDelete: "set null"` | Nullable — some qualifications have no uploaded doc |
| `documentStatus` | text DEFAULT "pending" | "pending" \| "approved" \| "rejected" |
| `reviewedBy` | text FK → staff.id, `onDelete: "set null"` | Admin who reviewed |
| `reviewNote` | text | Admin's note |
| `reviewedAt` | integer (timestamp_ms) | When reviewed |
| `createdAt` / `updatedAt` | integer (timestamp_ms) | Auto-set |

Unique constraint: `(staffId, qualification, yearObtained, institution)` — prevents duplicate records of the same credential. Indexed on `staffId` and `documentStatus`.

### Employment Verification & Password History Tables (schema only)

Two more tables live in `qualifications.ts` but have no API routers yet:

- **`employmentVerification`** — `staffId`, `documentType` (e.g., `"appointmentLetter"`, `"nationalIdentityCard"`), `fileId`, `status`/`reviewedBy`/`reviewNote`/`reviewedAt` (same approval shape as qualifications). `employmentVerificationInputSchema` in `constants/schemas.ts` already defines its input shape.
- **`passwordRotationHistory`** — audit log of password changes: `staffId`, `changedBy`, `changeMethod` (`"admin"` | `"self"`), `changedAt`. `rotatePasswordSchema`/`adminRotatePasswordSchema` exist for this but nothing writes to the table yet.

### Qualification Flow

1. **Staff uploads own**: `uploadQualification({ qualification, yearObtained?, institution?, subjectSpecialization?, specializationCategory?, documentFileId? })` (no `staffId` — resolved from the caller's session) → `documentStatus = "pending"`
2. **Admin uploads for anyone**: same call plus `staffId` — admin is the only role allowed to pass `staffId` explicitly
3. **Admin reviews**: `approveQualification({ id, status: "approved" | "rejected", reviewNote? })`
4. **Staff views**: `listQualifications({})` — sees only their own; admin can pass `staffId`/`status` to filter across everyone

### RBAC for Qualifications

| Action         | Admin              | User (Staff)    |
| -------------- | ------------------ | --------------- |
| Upload own     | Yes (any staff)    | Yes (self only) |
| View           | All qualifications | Own only        |
| Approve/Reject | Yes                | No              |

## Self-Service Profile Updates

Staff can update their own phone number and portrait photo via `updateProfile`. Admin-only fields (name, email, nic, position) cannot be changed by staff.

```ts
// Staff updates own profile
updateProfile({ phone: "0771234567", portraitFileId: "f1" });
```

| Field               | Who Can Edit                |
| ------------------- | --------------------------- |
| `name`              | Admin only                  |
| `email`             | Admin only                  |
| `nic`               | Admin only                  |
| `phone`             | Staff member (self) + Admin |
| `portraitFileId`    | Staff member (self) + Admin |
| `position`          | Admin only                  |
| `subjectAssignment` | Admin only                  |

## RBAC Permissions

Staff CRUD, position, class, and subject-assignment endpoints below are all `adminProcedure`. Qualification endpoints and the teacher role's own permissions are documented in **[auth.md](./auth.md)** — this file doesn't duplicate that content.

## API Endpoints

### Staff CRUD (admin only)

| Endpoint | Input | Description |
| --- | --- | --- |
| `staff.listStaff` | none | List all staff |
| `staff.getStaff` | `{ id }` | Get staff by ID |
| `staff.createStaff` | `{ name, email?, nic?, phone? }` | Create staff |
| `staff.updateStaff` | `{ id, name?, email?, nic?, phone? }` | Update staff |
| `staff.deleteStaff` | `{ id }` | Delete staff |

### Academic Years (admin only)

| Endpoint | Input | Description |
| --- | --- | --- |
| `staff.listAcademicYears` | none | List all years (returns `structureVersionKey`, `startDate`, `endDate`) |
| `staff.createAcademicYear` | `{ year, startDate?, endDate?, structureVersionKey? }` | Create year; materializes `gradeSubjectConfig` — see [subjects.md](./subjects.md) |
| `staff.setCurrentYear` | `{ id }` | Set current year |
| `staff.listStructureVersions` | none | List registered curriculum structure versions |

### Position Assignments (admin only)

| Endpoint | Input | Description |
| --- | --- | --- |
| `staff.listStaffPositions` | `{ academicYearId, staffId? }` | List assignments |
| `staff.assignPosition` | `{ staffId, academicYearId, position, sectionalScope? }` | Assign role |
| `staff.removePosition` | `{ id }` | Remove assignment |

### Classes (admin only)

| Endpoint | Input | Description |
| --- | --- | --- |
| `staff.listClasses` | `{ academicYearId, gradeLevel? }` | List classes |
| `staff.createClass` | `{ academicYearId, gradeLevel, name, medium? }` | Create class |
| `staff.assignClassTeacher` | `{ classId, homeroomTeacherId?, subHomeroomTeacherId? }` | Assign teachers |

### Subject Assignments (admin only)

| Endpoint | Input | Description |
| --- | --- | --- |
| `staff.listSubjectAssignments` | `{ academicYearId, staffId?, gradeLevel?, subjectKey? }` | List assignments |
| `staff.assignSubject` | `{ staffId, academicYearId, subjectKey, gradeLevel, classId? }` | Assign subject |

### Constants (admin only, read-only)

| Endpoint | Input | Output |
| --- | --- | --- |
| `staff.listSubjects` | `{ structureVersionKey? }` | That structure version's subjects, filtered by school config — see [subjects.md](./subjects.md) |
| `staff.listGrades` | none | All grades filtered by school config |
| `staff.listPositions` | none | Position types + sectional scopes |
| `staff.listStructureVersions` | none | Registered structure version keys + descriptions |

### Self-Service

| Endpoint | Input | Description |
| --- | --- | --- |
| `staff.updateProfile` | `{ phone?, portraitFileId? }` | Update own phone/portrait |

### Qualifications

| Endpoint | Auth | Input | Description |
| --- | --- | --- | --- |
| `staff.uploadQualification` | protected | `{ qualification, yearObtained?, institution?, subjectSpecialization?, specializationCategory?, documentFileId?, staffId? }` | Record a qualification; `staffId` required for admin, forbidden/defaulted-to-self for non-admin |
| `staff.listQualifications` | protected | `{ staffId?, status? }` | List (own only for non-admin; admin can filter by any `staffId`) |
| `staff.approveQualification` | admin | `{ id, status: "approved" \| "rejected", reviewNote? }` | Approve/reject the document |

## Year Transition

When a new academic year starts:

1. Create the new year: `staff.createAcademicYear({ year: 2028 })` — reuses the prior year's structure version by default, or pass `structureVersionKey` explicitly to migrate to a new curriculum scheme (see [subjects.md](./subjects.md))
2. Set it as current: `staff.setCurrentYear({ id: "newYearId" })`
3. Create classes for the new year
4. Re-assign positions (staff may change roles year-to-year)
5. Re-assign subject teaching (staff may teach different subjects/classes)
6. Previous year's data remains untouched in the database
