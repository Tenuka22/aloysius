/**
 * A single `gradeSubjectConfig` row template: which subject belongs to which
 * basket category for a given grade level, in a given structure version.
 */
export interface StructureVersionEntry {
  gradeLevel: number;
  /**
   * `COMPULSORY_BASKET_CATEGORY` for a grade's non-elective subjects, an
   * O/L optional basket name, an A/L stream key, or any other
   * version-defined elective slot (e.g. "op1"). Every category and its
   * members are defined entirely within the version file that uses them.
   */
  basketCategory: string;
  /** A subject key literal, defined within this version file. */
  subjectKey: string;
  sortOrder: number;
}

/**
 * A named, immutable snapshot of the school's subject/curriculum structure.
 * Once any academic year references a version's `key`, that version's
 * `entries` must never change — see `README.md` in this directory.
 */
export interface StructureVersion {
  /** Matches the registry key in `index.ts`; immutable once shipped. */
  key: string;
  /** Shown in the admin structure-version picker. */
  description: string;
  entries: StructureVersionEntry[];
}
