# Staff Management System

## Overview

Aloysius manages academic staff (teachers, sectional heads, principals) with year-based assignments for positions, classes, and subject teaching. All curriculum data (grades, subjects, positions) is defined as TypeScript constants — only staff records, assignments, and year configurations are stored in the database.

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
│   ├── subjects.ts        # All curriculum subjects (MOE-defined)
│   ├── positions.ts       # Staff position types and sectional scopes
│   └── index.ts           # Barrel export
├── config/
│   └── school.ts          # School-specific config (hardcoded)
└── schema/
    ├── staff.ts           # Staff, academicYear, staffPosition tables
    ├── academics.ts       # class_, subjectAssignment tables
    └── qualifications.ts  # Qualification upload/approval table

packages/api/src/routers/staff/
├── index.ts               # Barrel composing 23 procedures
├── list-staff.ts          # List all staff
├── get-staff.ts           # Get single staff member
├── create-staff.ts        # Create staff (admin)
├── update-staff.ts        # Update staff (admin)
├── delete-staff.ts        # Delete staff (admin)
├── list-academic-years.ts # List academic years
├── create-academic-year.ts# Create academic year
├── set-current-year.ts    # Set current year
├── list-staff-positions.ts# List position assignments
├── assign-position.ts     # Assign position to staff
├── remove-position.ts     # Remove position assignment
├── list-classes.ts        # List classes by year
├── create-class.ts        # Create class
├── assign-class-teacher.ts# Assign homeroom/sub-homeroom
├── list-subject-assignments.ts # List subject assignments
├── assign-subject.ts      # Assign subject to teacher
├── list-subjects.ts       # List subjects (from constants)
├── list-grades.ts         # List grades (from constants)
├── list-positions.ts      # List positions (from constants)
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

`packages/db/src/constants/subjects.ts`

Subjects are defined per education level:

| Level | Subjects | Count |
| --- | --- | --- |
| Primary (1-5) | religion, motherTongue, english, mathematics, science, history, geography, healthPE, lifeCompetencies, practicalSkills, aestheticSubjects, secondLanguage | 12 |
| Junior Secondary Essential (6-9) | Same as primary + ict, entrepreneurshipFinancialLiteracy | 14 |
| Junior Secondary Transversal (6-9) | digitalCitizenship, mediaStudies, socialServices | 3 |
| Junior Secondary Further Learning (6-9) | scienceForFurtherLearning, mathematicsForFurtherLearning, ictForFurtherLearning, historyForFurtherLearning, appreciationOfLiteratureForFurtherLearning | 5 |
| O/L Compulsory (10-11) | religion, motherTongue, english, mathematics, science, history | 6 |
| O/L Basket (10-11) | 3 categories: languagesHumanities (16), aestheticsArts (13), technicalVocational (13) | 42 |
| A/L Streams | bioScience, physicalScience, commerce, arts, engineeringTechnology, bioSystemsTechnology | 6 streams |
| A/L Common | generalEnglish, generalInformationTechnology | 2 |

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

`packages/db/src/schema/staff.ts`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | UUID |
| `name` | text NOT NULL | Full name |
| `email` | text UNIQUE | Work email (nullable) |
| `nic` | text UNIQUE | National Identity Card (nullable) |
| `phone` | text | Contact number (nullable) |
| `portraitFileId` | text FK → files.id | Profile photo (nullable) |
| `createdAt` | integer (timestamp_ms) | Auto-set |
| `updatedAt` | integer (timestamp_ms) | Auto-set |

### Academic Year Table

| Column      | Type                   | Notes                       |
| ----------- | ---------------------- | --------------------------- |
| `id`        | text PK                | UUID                        |
| `year`      | integer UNIQUE         | e.g., 2027                  |
| `isCurrent` | boolean                | One year flagged as current |
| `createdAt` | integer (timestamp_ms) | Auto-set                    |

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
staff.createAcademicYear({ year: 2027 })
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

Staff can upload qualifications (degrees, certificates, etc.) that require admin approval before becoming verified.

### Qualification Table

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | UUID |
| `staffId` | text FK → staff.id | The staff member |
| `title` | text NOT NULL | e.g., "BSc Education" |
| `fileId` | text FK → files.id | The uploaded document |
| `status` | text DEFAULT "pending" | "pending" \| "approved" \| "rejected" |
| `reviewedBy` | text FK → staff.id | Admin who reviewed |
| `reviewNote` | text | Admin's note |
| `createdAt` | integer (timestamp_ms) | Auto-set |
| `reviewedAt` | integer (timestamp_ms) | When reviewed |

### Qualification Flow

1. **Staff uploads**: `uploadQualification({ staffId, title, fileId })` → status = "pending"
2. **Admin reviews**: `approveQualification({ id, status: "approved", reviewNote: "Verified" })`
3. **Staff views**: `listQualifications({})` — sees own qualifications

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

`packages/auth/src/permissions.ts`

```ts
export const statement = {
  ...defaultStatements,
  file: ["create", "list", "delete"],
  staff: ["create", "read", "update", "delete"],
  assignment: ["create", "read", "update", "delete"],
  qualification: ["create", "read", "approve"],
};
```

| Role    | Permissions                                          |
| ------- | ---------------------------------------------------- |
| `admin` | file, staff, assignment, qualification (all actions) |
| `user`  | qualification (create, read only)                    |

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

| Endpoint                   | Input      | Description      |
| -------------------------- | ---------- | ---------------- |
| `staff.listAcademicYears`  | none       | List all years   |
| `staff.createAcademicYear` | `{ year }` | Create year      |
| `staff.setCurrentYear`     | `{ id }`   | Set current year |

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

| Endpoint              | Output                                 |
| --------------------- | -------------------------------------- |
| `staff.listSubjects`  | All subjects filtered by school config |
| `staff.listGrades`    | All grades filtered by school config   |
| `staff.listPositions` | Position types + sectional scopes      |

### Self-Service

| Endpoint | Input | Description |
| --- | --- | --- |
| `staff.updateProfile` | `{ phone?, portraitFileId? }` | Update own phone/portrait |

### Qualifications

| Endpoint | Auth | Input | Description |
| --- | --- | --- | --- |
| `staff.uploadQualification` | protected | `{ staffId, title, fileId }` | Upload doc |
| `staff.listQualifications` | protected | `{ staffId?, status? }` | List (own or all) |
| `staff.approveQualification` | admin | `{ id, status, reviewNote? }` | Approve/reject |

## Year Transition

When a new academic year starts:

1. Create the new year: `staff.createAcademicYear({ year: 2028 })`
2. Set it as current: `staff.setCurrentYear({ id: "newYearId" })`
3. Create classes for the new year
4. Re-assign positions (staff may change roles year-to-year)
5. Re-assign subject teaching (staff may teach different subjects/classes)
6. Previous year's data remains untouched in the database
