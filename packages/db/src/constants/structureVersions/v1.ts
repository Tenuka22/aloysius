import { COMPULSORY_BASKET_CATEGORY } from "./constants";
import type { StructureVersion, StructureVersionEntry } from "./types";

/**
 * v1 — first shipped structure version.
 *
 * IMMUTABLE. This file must never be edited once any academic year
 * references `"v1"` — see `README.md` in this directory.
 *
 * Deliberately self-contained: every subject key, compulsory or optional,
 * is written out literally right here instead of imported from a shared
 * curriculum constants file. A shared file is allowed to grow or be
 * corrected over time, and if this file read from it directly, a v1
 * academic year's materialized `gradeSubjectConfig` would silently change
 * shape whenever someone edited the shared list — exactly the drift
 * versioning exists to prevent. To change a grade's subject list (add,
 * remove, or move a subject between compulsory/optional/stream), add a new
 * version file (e.g. `v2.ts`) instead of touching this one.
 *
 * Sources: Nuffic's Sri Lanka primary/secondary education-system summary
 * (pre-2026-reform primary subject fields); NIE's Practical and Technical
 * Skills syllabus (implemented 2015 for grades 6-9); NIE's Department of
 * Aesthetic Education subject list; Department of Examinations 2025/2026
 * GCE O/L subject/basket timetable; Department of Examinations GCE A/L
 * stream/subject statistics. The 2026 reform's revised
 * primary/junior-secondary/O/L structure (which rolls out grade-by-grade
 * starting with Grade 1 and Grade 6) is intended to land as a separate
 * version once its subject lists are finalized, not as an edit to this one.
 */

const buildEntries = (
  gradeLevel: number,
  basketCategory: string,
  subjectKeys: readonly string[]
): StructureVersionEntry[] =>
  subjectKeys.map((subjectKey, sortOrder) => ({
    gradeLevel,
    basketCategory,
    subjectKey,
    sortOrder,
  }));

// ─── Primary (Grades 1-5), no electives ────────────────────────────────────
//
// Per Nuffic's Sri Lanka education-system summary, pre-2026-reform primary
// education is organized around 4 subject fields (language, mathematics,
// environment-related activities, religion) from grade 1, with English and
// the second national language added as subjects from grade 3 on.

const PRIMARY_GRADE_1_2_SUBJECTS = [
  "motherTongue",
  "mathematics",
  "environmentRelatedActivities",
  "religion",
] as const;

const PRIMARY_GRADE_3_5_SUBJECTS = [
  ...PRIMARY_GRADE_1_2_SUBJECTS,
  "englishLanguage",
  "secondNationalLanguage",
] as const;

const primaryEntries: StructureVersionEntry[] = [
  ...[1, 2].flatMap((gradeLevel) =>
    buildEntries(
      gradeLevel,
      COMPULSORY_BASKET_CATEGORY,
      PRIMARY_GRADE_1_2_SUBJECTS
    )
  ),
  ...[3, 4, 5].flatMap((gradeLevel) =>
    buildEntries(
      gradeLevel,
      COMPULSORY_BASKET_CATEGORY,
      PRIMARY_GRADE_3_5_SUBJECTS
    )
  ),
];

// ─── Junior Secondary (Grades 6-9) ──────────────────────────────────────────
//
// Core subjects per Nuffic/AACRAO summaries plus Practical and Technical
// Skills (PTS, implemented 2015 — a real NIE/MOE subject covering multiple
// technical competency areas including Agriculture, with ICT "integrated
// appropriately" into it rather than taught as its own subject at this
// level, per the PTS grade 6 syllabus). Aesthetic education is a genuine
// pick-one elective (per NIE's Department of Aesthetic Education), not a
// flat compulsory subject — it's modeled the same way as the O/L Basket II
// aesthetics/arts elective, reusing the same subject keys for continuity.

const JUNIOR_SECONDARY_CORE_SUBJECTS = [
  "religion",
  "motherTongue",
  "englishLanguage",
  "secondNationalLanguage",
  "mathematics",
  "science",
  "history",
  "geography",
  "civicEducation",
  "healthAndPhysicalEducation",
  "lifeCompetencies",
  "practicalTechnicalSkills",
] as const;

/** Pick-one aesthetic elective — same subject keys as the O/L Basket II. */
const JUNIOR_SECONDARY_AESTHETIC_OPTIONS = [
  "art",
  "musicOriental",
  "musicWestern",
  "musicCarnatic",
  "dancingIndigenous",
  "dancingBharatha",
  "dramaTheatreSinhala",
  "dramaTheatreTamil",
  "dramaTheatreEnglish",
] as const;

const juniorSecondaryEntries: StructureVersionEntry[] = [6, 7, 8, 9].flatMap(
  (gradeLevel) => [
    ...buildEntries(
      gradeLevel,
      COMPULSORY_BASKET_CATEGORY,
      JUNIOR_SECONDARY_CORE_SUBJECTS
    ),
    ...buildEntries(
      gradeLevel,
      "aesthetic",
      JUNIOR_SECONDARY_AESTHETIC_OPTIONS
    ),
  ]
);

// ─── O/L (Grades 10-11) ─────────────────────────────────────────────────────
//
// Per the Department of Examinations 2025/2026 O/L timetable: 4 subjects
// are strictly fixed for everyone; "religion" and "motherTongue" are each a
// compulsory *choice* (every student takes one, but which paper varies), so
// they're modeled as their own selectable categories rather than a single
// flat subject key. The three elective baskets are examination categories
// I, II, and III; a student picks one subject from each.

const OL_FIXED_COMPULSORY = [
  "englishLanguage",
  "mathematics",
  "science",
  "history",
] as const;

/** Compulsory choice: every student sits exactly one religion paper. */
const OL_RELIGION_OPTIONS = [
  "buddhism",
  "saivanery",
  "catholicism",
  "christianity",
  "islam",
] as const;

/** Compulsory choice: every student sits exactly one first-language paper. */
const OL_MOTHER_TONGUE_OPTIONS = [
  "sinhalaLanguageAndLiterature",
  "tamilLanguageAndLiterature",
] as const;

/** Basket I — languages & humanities. */
const OL_BASKET_LANGUAGES_HUMANITIES = [
  "businessAccountingStudies",
  "geography",
  "civicEducation",
  "entrepreneurshipStudies",
  "secondLanguageSinhala",
  "secondLanguageTamil",
  "pali",
  "sanskrit",
  "french",
  "german",
  "hindi",
  "japanese",
  "arabic",
  "korean",
  "chinese",
  "russian",
] as const;

/** Basket II — aesthetics & arts. */
const OL_BASKET_AESTHETICS_ARTS = [
  "musicOriental",
  "musicWestern",
  "musicCarnatic",
  "art",
  "dancingIndigenous",
  "dancingBharatha",
  "appreciationEnglishLiteraryTexts",
  "appreciationSinhalaLiteraryTexts",
  "appreciationTamilLiteraryTexts",
  "appreciationArabicLiteraryTexts",
  "dramaTheatreSinhala",
  "dramaTheatreTamil",
  "dramaTheatreEnglish",
] as const;

/** Basket III — technical & vocational. */
const OL_BASKET_TECHNICAL_VOCATIONAL = [
  "ict",
  "agricultureFoodTechnology",
  "aquaticBioresourcesTechnology",
  "artsCrafts",
  "homeEconomics",
  "healthPhysicalEducation",
  "communicationMediaStudies",
  "designConstructionTechnology",
  "designMechanicalTechnology",
  "designElectricalElectronicTechnology",
  "electronicWritingShorthandSinhala",
  "electronicWritingShorthandTamil",
  "electronicWritingShorthandEnglish",
] as const;

const OL_GRADES = [10, 11] as const;

const olEntries: StructureVersionEntry[] = OL_GRADES.flatMap((gradeLevel) => [
  ...buildEntries(gradeLevel, COMPULSORY_BASKET_CATEGORY, OL_FIXED_COMPULSORY),
  ...buildEntries(gradeLevel, "religion", OL_RELIGION_OPTIONS),
  ...buildEntries(gradeLevel, "motherTongue", OL_MOTHER_TONGUE_OPTIONS),
  ...buildEntries(
    gradeLevel,
    "languagesHumanities",
    OL_BASKET_LANGUAGES_HUMANITIES
  ),
  ...buildEntries(gradeLevel, "aestheticsArts", OL_BASKET_AESTHETICS_ARTS),
  ...buildEntries(
    gradeLevel,
    "technicalVocational",
    OL_BASKET_TECHNICAL_VOCATIONAL
  ),
]);

// ─── A/L (Grades 12-13) ─────────────────────────────────────────────────────
//
// Streams and the compulsory common components are confirmed by the
// Department of Examinations. The per-stream subject pools below are an
// app-modeled approximation built from the DoE's broader A/L subject list —
// the DoE records subject results individually rather than publishing a
// single canonical "stream -> subject" combination table, and the exact
// compulsory-vs-optional rules *within* a stream (e.g. Bio Science requires
// Biology + Chemistry, then Physics OR Agricultural Science) aren't encoded
// here. Treat this as a reasonable starting point, not a verified source of
// truth, and adjust before relying on it for real student data.
//
// General Information Technology (GIT) is a separate Department of
// Examinations qualification, not an ordinary stream subject or a common
// component alongside General English/Common General Test, so it's
// deliberately left out until its structural placement is confirmed.

const AL_STREAM_SUBJECTS: Record<string, readonly string[]> = {
  bioScience: [
    "biology",
    "chemistry",
    "physics",
    "agriculturalScience",
    "higherMathematics",
  ],
  physicalScience: [
    "combinedMathematics",
    "physics",
    "chemistry",
    "ict",
    "higherMathematics",
  ],
  commerce: [
    "accounting",
    "businessStudies",
    "economics",
    "businessStatistics",
    "ict",
    "geography",
  ],
  arts: [
    "buddhism",
    "hinduism",
    "christianity",
    "islam",
    "buddhistCivilization",
    "hinduCivilization",
    "christianCivilization",
    "islamicCivilization",
    "greekAndRomanCivilization",
    "politicalScience",
    "history",
    "geography",
    "logicAndScientificMethod",
    "economics",
    "agriculturalScience",
    "sinhala",
    "tamil",
    "english",
    "pali",
    "sanskrit",
    "arabic",
    "hindi",
    "french",
    "german",
    "russian",
    "chinese",
    "japanese",
    "korean",
    "malay",
    "homeEconomics",
    "dancingIndigenous",
    "dancingBharatha",
    "musicOriental",
    "musicCarnatic",
    "musicWestern",
    "art",
    "dramaTheatreSinhala",
    "dramaTheatreTamil",
    "dramaTheatreEnglish",
    "communicationMediaStudies",
  ],
  engineeringTechnology: [
    "engineeringTechnology",
    "scienceForTechnology",
    "civilTechnology",
    "mechanicalTechnology",
    "electricalElectronicInformationTechnology",
  ],
  bioSystemsTechnology: [
    "bioSystemsTechnology",
    "scienceForTechnology",
    "agroTechnology",
    "bioResourceTechnology",
    "foodTechnology",
  ],
};

/** Compulsory for every A/L student regardless of stream. */
const AL_COMMON_COMPONENTS = ["commonGeneralTest", "generalEnglish"] as const;

const AL_GRADES = [12, 13] as const;

const alEntries: StructureVersionEntry[] = AL_GRADES.flatMap((gradeLevel) => [
  ...buildEntries(gradeLevel, COMPULSORY_BASKET_CATEGORY, AL_COMMON_COMPONENTS),
  ...Object.entries(AL_STREAM_SUBJECTS).flatMap(([stream, subjectKeys]) =>
    buildEntries(gradeLevel, stream, subjectKeys)
  ),
]);

const entries: StructureVersionEntry[] = [
  ...primaryEntries,
  ...juniorSecondaryEntries,
  ...olEntries,
  ...alEntries,
];

export const v1: StructureVersion = {
  key: "v1",
  description:
    "Primary (1-5): 4 subject fields from grade 1, plus English and second national language from grade 3. Junior secondary (6-9): core subjects including Practical and Technical Skills, plus a pick-one aesthetic elective. O/L (10-11): fixed compulsory subjects, compulsory religion/mother-tongue choices, and the 3-basket elective layout. A/L (12-13): streams with their subject pools plus common compulsory components (General English, Common General Test).",
  entries,
};
