import { GRADE_LEVELS } from "../grades";
import type { StructureVersion } from "./types";
import { v1 } from "./v1";

export type { StructureVersion, StructureVersionEntry } from "./types";
export { COMPULSORY_BASKET_CATEGORY } from "./constants";

/**
 * Every structure version the school has ever shipped, keyed by its
 * immutable `key`. Append new versions here — never edit an existing
 * version's file or registry entry. See `README.md` for the full rule.
 */
export const STRUCTURE_VERSIONS: Record<string, StructureVersion> = {
  v1,
};

/**
 * The version new academic years should default to when the admin hasn't
 * explicitly picked a different one (typically overridden per-request with
 * the most recently created academic year's own version instead).
 */
export const LATEST_STRUCTURE_VERSION_KEY = "v1";

const isKnownGradeLevel = (gradeLevel: number): boolean =>
  (GRADE_LEVELS as readonly number[]).includes(gradeLevel);

/**
 * Basket category is intentionally open-ended (covers `COMPULSORY_BASKET_CATEGORY`,
 * O/L optional baskets, A/L streams, and elective slots like "op1") — there
 * is no single global enum to check membership against, so this only rules
 * out empty/malformed values.
 */
const isKnownBasketCategory = (basketCategory: string): boolean =>
  basketCategory.trim().length > 0;

/**
 * Subject keys are defined entirely within each version file now — there is
 * no shared global subject registry to check membership against (each
 * version is deliberately self-contained; see the module doc in `v1.ts`).
 * This only rules out empty/malformed values.
 */
const isKnownSubjectKey = (subjectKey: string): boolean =>
  subjectKey.trim().length > 0;

const validateStructureVersion = (version: StructureVersion): void => {
  for (const entry of version.entries) {
    if (!isKnownGradeLevel(entry.gradeLevel)) {
      throw new Error(
        `Structure version "${version.key}" references unknown grade level ${entry.gradeLevel}`
      );
    }
    if (!isKnownBasketCategory(entry.basketCategory)) {
      throw new Error(
        `Structure version "${version.key}" has an empty basket category`
      );
    }
    if (!isKnownSubjectKey(entry.subjectKey)) {
      throw new Error(
        `Structure version "${version.key}" has an empty subject key`
      );
    }
  }
};

// Fail fast at module load if a shipped version is malformed, rather than at
// the moment an admin tries to create an academic year with it.
for (const version of Object.values(STRUCTURE_VERSIONS)) {
  validateStructureVersion(version);
}

/**
 * Look up a structure version by key, throwing if it isn't registered. A new
 * scheme must land as a new version module (and pass module-load validation)
 * before any academic year can reference it.
 */
export const getStructureVersion = (key: string): StructureVersion => {
  const version = STRUCTURE_VERSIONS[key];
  if (!version) {
    throw new Error(`Unknown structure version key: "${key}"`);
  }
  return version;
};

/**
 * Every subject key used by any registered version, deduplicated. Used as
 * the closed set `gradeSubjectConfig`/`subjectAssignment` subject keys are
 * validated against, since there's no standalone curriculum constants file
 * anymore — the versions themselves are the source of truth.
 */
const seenSubjectKeys: Record<string, true> = {};
for (const version of Object.values(STRUCTURE_VERSIONS)) {
  for (const entry of version.entries) {
    seenSubjectKeys[entry.subjectKey] = true;
  }
}

export const ALL_KNOWN_SUBJECT_KEYS = Object.keys(seenSubjectKeys) as [
  string,
  ...string[],
];
