# Subject & Curriculum Structure

## Overview

Every subject/curriculum fact — which subjects a grade takes, which are optional, O/L basket layouts, A/L streams — is defined in code as an immutable, named **structure version** (`v1`, `v2`, ...), not stored as editable database rows and not read from a single shared "list of all subjects" constants file (there used to be one, `constants/subjects.ts`; it's been removed).

An academic year picks a structure version when it's created. That version's data is copied ("materialized") once into the `gradeSubjectConfig` table, scoped to that year. From then on, the academic year's curriculum is whatever got copied — it never changes even if the version file (or a later version) changes.

This solves two problems the old design had:

1. **Auditability** — "what subjects did grade 9 take in 2025?" has one authoritative, permanent answer per year, not a value derived from whatever the current code happens to say.
2. **Safe evolution** — a school's curriculum genuinely changes over time (a subject added or removed, a basket restructured, a naming correction). Under the old design any such edit would silently apply to every year, past and future. Now it requires shipping a new version; existing years are untouched.

## File Structure

```
packages/db/src/constants/structureVersions/
├── constants.ts   # COMPULSORY_BASKET_CATEGORY = "compulsory" (schema convention, not curriculum data)
├── types.ts       # StructureVersionEntry / StructureVersion types
├── v1.ts          # First shipped structure — immutable once any year references it
├── index.ts       # STRUCTURE_VERSIONS registry, LATEST_STRUCTURE_VERSION_KEY,
│                  # getStructureVersion(), ALL_KNOWN_SUBJECT_KEYS
└── README.md      # The append-only + self-containment rules, spelled out
```

```
packages/db/src/schema/academics.ts
└── gradeSubjectConfig   # Materialized per-year rows (see below)

packages/db/src/schema/marking.ts
└── studentSubjectSelection  # Per-student optional-subject history (see marking.md)

packages/db/src/config/school.ts
└── isStructureEntryOfferedBySchool()  # Filters a version's entries to what this school runs

packages/api/src/routers/staff/
├── create-academic-year.ts     # Validates + materializes a structure version
├── list-structure-versions.ts  # Lists registered versions
└── list-subjects.ts            # Read-only: a version's entries, school-filtered
```

## The Two Rules

Both are enforced by convention + code review, not by the type system, and are spelled out in `structureVersions/README.md`:

1. **Never edit a version file once any academic year references its key.** Ship a new version instead (e.g. `v2.ts`).
2. **A version file must never import curriculum data from anywhere else** — not from another version, not from a shared constants file. Every subject key, for every grade, is written out literally inside that one file. This is stricter than rule 1: even a "harmless" shared-constant edit would let two academic years pinned to the _same_ version key materialize _different_ content depending only on when they were created, since materialization re-evaluates whatever the import currently resolves to.

The only import that's exempt from rule 2 is `COMPULSORY_BASKET_CATEGORY` — a fixed sentinel string, not curriculum data (every version must agree on the same value for the "is this category selectable" check to work).

## Types

```ts
export type StructureVersionEntry = {
  gradeLevel: number;
  // COMPULSORY_BASKET_CATEGORY, an O/L basket name, an A/L stream key,
  // or an elective slot (e.g. "op1", "aesthetic"). Free-form — the set of
  // valid categories is owned entirely by the version, not a global enum.
  basketCategory: string;
  // A literal subject key, defined within this version file.
  subjectKey: string;
  sortOrder: number;
};

export type StructureVersion = {
  key: string; // "v1" — matches the registry key, immutable
  description: string; // shown in the admin version picker
  entries: StructureVersionEntry[];
};
```

`gradeLevel` on every entry is validated against `GRADE_LEVELS` at module load (`index.ts` runs this for every registered version, immediately, so a malformed version fails at build/boot time, not the first time someone tries to use it). `basketCategory`/`subjectKey` are only checked for being non-empty — there's no external registry to check membership against.

## `v1`'s Content

Sourced from: Nuffic's Sri Lanka education-system summary (primary), the NIE's Practical and Technical Skills syllabus (junior secondary, implemented 2015) and Department of Aesthetic Education subject list, and Department of Examinations 2025/2026 GCE O/L and A/L subject/timetable material.

| Grades | Category | Content |
| --- | --- | --- |
| 1-2 (Primary) | `compulsory` | 4 subject fields: mother tongue, mathematics, environment-related activities, religion |
| 3-5 (Primary) | `compulsory` | Same 4 fields, plus English and the second national language (added from grade 3) |
| 6-9 (Junior Secondary) | `compulsory` | 12 core subjects, including **Practical and Technical Skills** (a real NIE/MOE subject implemented in 2015, covering multiple technical competency areas including Agriculture — ICT is "integrated appropriately" into it rather than taught as a separate subject at this level) |
| 6-9 | `aesthetic` | A single pick-one elective (per NIE's Department of Aesthetic Education) — reuses the same subject keys as the O/L Basket II elective (art, music variants, dancing variants, drama/theatre-by-language) |
| 10-11 (O/L) | `compulsory` | 4 fixed subjects with no choice: English, mathematics, science, history |
| 10-11 | `religion` | A compulsory _choice_ — every student sits exactly one of 5 religion papers (buddhism, saivanery, catholicism, christianity, islam) |
| 10-11 | `motherTongue` | A compulsory _choice_ — sinhala or tamil language & literature |
| 10-11 | `languagesHumanities` / `aestheticsArts` / `technicalVocational` | The 3 O/L optional baskets (Category I/II/III per the DoE timetable); one subject picked from each |
| 12-13 (A/L) | `compulsory` | General English + Common General Test, required regardless of stream |
| 12-13 | `bioScience` / `physicalScience` / `commerce` / `arts` / `engineeringTechnology` / `bioSystemsTechnology` | The 6 DoE-confirmed A/L streams, each with a subject pool |

**Known limitations, stated in the code itself, not swept under the rug:**

- The A/L per-stream subject pools are an app-modeled approximation, not a DoE-published combination table — the DoE records subject results individually, not as a stream→subject map. Exact compulsory-vs-optional rules within a stream (e.g. Bio Science requires Biology + Chemistry, then Physics _or_ Agricultural Science) aren't encoded.
- General Information Technology (GIT) is deliberately **not** included anywhere in `v1` — it's a separate DoE qualification whose structural placement isn't confirmed.
- The Ministry's 2026 curriculum reform (rolling out grade-by-grade from Grade 1 and Grade 6) isn't represented; it's intended to land as a new version once its subject lists are finalized.

## `gradeSubjectConfig` — the materialized per-year table

```ts
export const gradeSubjectConfig = sqliteTable("grade_subject_config", {
  id: text("id").primaryKey(),
  academicYearId: text("academic_year_id").notNull(), // FK, cascade
  gradeLevel: integer("grade_level").notNull(),
  basketCategory: text("basket_category").notNull(),
  subjectKey: text("subject_key").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
```

Unique on `(academicYearId, gradeLevel, basketCategory, subjectKey)`. Indexed on `(academicYearId, gradeLevel)` and `(basketCategory)`.

Rows are **never hand-seeded** — they only ever come from `staff.createAcademicYear`'s materialization step:

1. Look up `STRUCTURE_VERSIONS[structureVersionKey]` (defaulting to the most recently created academic year's version if omitted); throw `BAD_REQUEST` if the key is unknown.
2. Filter its `entries` through `isStructureEntryOfferedBySchool(gradeLevel, basketCategory, COMPULSORY_BASKET_CATEGORY)` — this school's `SCHOOL` config (`offeredOLBasketCategories`, `offeredALStreams`, `gradeRange`) decides which optional categories actually get materialized. Compulsory subjects and the O/L religion/mother-tongue choice categories are never filtered — every school offers those.
3. Insert the filtered result as `gradeSubjectConfig` rows scoped to the new `academicYearId`.

This is a one-time copy, not a live join. Two academic years referencing the same `structureVersionKey` each get their own, independent row set — mutating one's rows (or shipping a new, corrected version) never touches the other.

## API

| Procedure | Purpose |
| --- | --- |
| `staff.createAcademicYear` | `{ year, startDate?, endDate?, structureVersionKey? }` — validates/defaults the version, then materializes `gradeSubjectConfig` as above |
| `staff.listAcademicYears` | Returns each year's `structureVersionKey` alongside `startDate`/`endDate` |
| `staff.listStructureVersions` | Lists registered version keys + descriptions, for an admin version picker |
| `staff.listSubjects` | `{ structureVersionKey? }` — returns that version's entries filtered by `SCHOOL` config, i.e. exactly what creating a year with that version would materialize. Read-only; doesn't touch any specific academic year's already-materialized rows. |
| `staff.assignSubject` | Validates `subjectKey` against `ALL_KNOWN_SUBJECT_KEYS` (the schema-level closed set) but does not currently cross-check the subject against `gradeSubjectConfig` for that specific grade/year |

## Adding a New Version

1. Create `vN.ts` exporting a `StructureVersion` with `key: "vN"` and the full set of `{ gradeLevel, basketCategory, subjectKey, sortOrder }` entries for every affected grade — written out literally, not imported.
2. Register it in `STRUCTURE_VERSIONS` in `index.ts`.
3. Leave every existing version file untouched.
4. New academic years can now pick `"vN"`; existing years keep whatever version they were created with.

See `constants/structureVersions/README.md` for the full checklist.

## Related

- [marking.md](./marking.md) — how a student's optional-subject _choice_ (as opposed to which subjects exist) is tracked, and why changing it never rewrites historical marks.
- [staff.md](./staff.md) — teacher subject _assignments_ (who teaches what), which is a separate table (`subjectAssignment`) from the curriculum structure documented here.
