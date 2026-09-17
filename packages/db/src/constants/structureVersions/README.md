# Structure Versions

This directory defines the school's entire subject/curriculum structure as immutable, named versions (`v1`, `v2`, ...). There is no separate shared curriculum constants file — every version is fully self-contained: every subject key, for every grade, compulsory or optional, is written out literally inside that version's own file.

## The rule

**Never edit a version file once any academic year references its key.** If the structure needs to change (a grade's subject list changes, a basket or stream's contents change, a new elective slot is added, etc.), add a new file, e.g. `v2.ts`, and register it in `index.ts`. Do not modify `v1.ts` after it ships.

**Never import curriculum data (subject lists, basket contents, stream subjects) into a version file from anywhere else.** A version's `entries` must be literal data owned by that file. If a version imported an array from a shared module, that shared module could be edited later (even "additively") and the version's materialized `gradeSubjectConfig` rows for academic years created _after_ the edit would silently differ from rows already materialized for years created _before_ it — exactly the drift this whole mechanism exists to prevent. The only things safe to import into a version file are stable, non-curriculum conventions like `COMPULSORY_BASKET_CATEGORY` (a fixed sentinel string, not subject data).

This is what lets an academic year stay pinned to exactly the structure it was created with, forever, even as the school's curriculum evolves in later years.

## How it's used

- `academicYear.structureVersionKey` records which version an academic year was created with.
- On academic year creation, the chosen version's `entries` are copied ("materialized") into `gradeSubjectConfig` rows scoped to that academic year. This is a one-time copy, not a live join; later additions to this registry can never retroactively change a year that already materialized its config.
- Each entry's `basketCategory` is either `COMPULSORY_BASKET_CATEGORY` (every student at that grade takes the subject), an O/L optional basket name, an A/L stream key, or any other version-defined elective slot key (e.g. `"op1"`). Non-compulsory categories are what a student picks from via `studentSubjectSelection`; compulsory ones simply apply to every student and are never selected.
- The admin UI's version picker defaults to whatever version the most recently created academic year used, so the common case (no scheme change) requires no action.
- `index.ts` also exposes `ALL_KNOWN_SUBJECT_KEYS`, the deduplicated union of every subject key across every registered version — the closed set `gradeSubjectConfig`/`subjectAssignment` subject keys are validated against, since there is no standalone curriculum constants file anymore.

## Adding a new version

1. Create `vN.ts` exporting a `StructureVersion` with `key: "vN"` and the full set of `{ gradeLevel, basketCategory, subjectKey, sortOrder }` entries for every affected grade, written out literally in that file: both its compulsory subjects (filed under `COMPULSORY_BASKET_CATEGORY`) and any optional/elective/stream categories it offers.
2. Register it in `STRUCTURE_VERSIONS` in `index.ts`.
3. Every `gradeLevel` in the new version is validated against `GRADE_LEVELS` at module load; `basketCategory` and `subjectKey` are only checked for being non-empty, since they're version-owned labels with no external registry to check membership against. A malformed entry fails the build, not a later API call.
4. Leave every existing version file untouched.
