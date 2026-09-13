/**
 * Subject constants for the Sri Lankan education system.
 * All subjects are defined by the Ministry of Education.
 */

import { getStageForGrade } from "./grades";
import type { GradeLevel } from "./grades";

// ─── Primary (Grades 1-5) ───────────────────────────────────────────────────

/**
 * Primary curriculum per Sri Lankan MOE — 8 subject fields:
 * Language, Mathematics, Environmental Studies, Religion,
 * English, Aesthetic Subjects, Health & PE, Life Competencies.
 */
export const PRIMARY_SUBJECTS = [
  "religion",
  "motherTongue",
  "english",
  "mathematics",
  "environmentRelatedActivities",
  "healthPhysicalEducation",
  "aestheticSubjects",
  "lifeCompetencies",
] as const;

// ─── Junior Secondary (Grades 6-9) ───────────────────────────────────────────

/**
 * Junior Secondary essential subjects per MOE curriculum.
 * Builds on primary with added sciences, civics, and skills.
 */
export const JUNIOR_SECONDARY_SUBJECTS = [
  "religion",
  "motherTongue",
  "english",
  "mathematics",
  "science",
  "history",
  "geography",
  "civicEducation",
  "healthPhysicalEducation",
  "aestheticSubjects",
  "secondLanguage",
  "ict",
  "entrepreneurship",
  "lifeCompetencies",
] as const;

// ─── Grade 6-9 Elective Components (MOE reform 2026+) ───────────────────────

/**
 * Transversal Skills for Junior Secondary (Grades 6-9) — MOE reform.
 * Skill-based modules integrated into the curriculum.
 */
export const JUNIOR_SECONDARY_TRANSVERSAL_SKILLS = [
  "digitalCitizenship",
  "entrepreneurialSkills",
  "leadershipSkills",
] as const;

/**
 * Optional/elective subjects available at Junior Secondary level (Grades 6-9).
 * Schools may offer a subset based on resources and teacher availability.
 */
export const JUNIOR_SECONDARY_ELECTIVES = [
  "agriculture",
  "homeEconomics",
  "dancing",
  "music",
  "art",
  "dramaTheatre",
] as const;

// ─── O/L Compulsory (Grades 10-11) ──────────────────────────────────────────

/**
 * 6 compulsory subjects for GCE O/L per Sri Lankan MOE/Department of Examinations.
 * Source: https://en.wikipedia.org/wiki/GCE_Ordinary_Level_in_Sri_Lanka
 */
export const OL_COMPULSORY_SUBJECTS = [
  /** Sinhala or Tamil (first language) */
  "motherTongue",
  /** Buddhism, Hinduism, Catholicism/Christianity, Islam, or Shaivism */
  "religion",
  /** English language */
  "english",
  "mathematics",
  "science",
  "history",
] as const;
export type OLCompulsorySubject = (typeof OL_COMPULSORY_SUBJECTS)[number];

// ─── O/L Religion Options ────────────────────────────────────────────────────

export const RELIGION_OPTIONS = [
  "buddhism",
  "hinduism",
  "catholicism",
  "christianity",
  "islam",
  "shaivism",
] as const;
export type ReligionOption = (typeof RELIGION_OPTIONS)[number];

// ─── O/L Mother Tongue Options ───────────────────────────────────────────────

export const MOTHER_TONGUE_OPTIONS = ["sinhala", "tamil"] as const;
export type MotherTongue = (typeof MOTHER_TONGUE_OPTIONS)[number];

// ─── O/L Basket Subject Categories ───────────────────────────────────────────

export const BASKET_CATEGORIES = {
  languagesHumanities: "languagesHumanities",
  aestheticsArts: "aestheticsArts",
  technicalVocational: "technicalVocational",
} as const;

export type BasketCategory =
  (typeof BASKET_CATEGORIES)[keyof typeof BASKET_CATEGORIES];

/**
 * O/L basket subjects grouped by category.
 * Source: https://en.wikipedia.org/wiki/GCE_Ordinary_Level_in_Sri_Lanka
 * Students pick ONE subject from EACH of the three baskets (3 elective subjects total).
 */
export const BASKET_SUBJECTS = {
  languagesHumanities: [
    "businessAccountingStudies",
    "geography",
    "civicEducation",
    "entrepreneurshipStudies",
    /** For Tamil-medium students */
    "secondLanguageSinhala",
    /** For Sinhala-medium students */
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
  ] as const,
  aestheticsArts: [
    /** Eastern Music */
    "musicOriental",
    /** Western Music */
    "musicWestern",
    /** Carnatic Music */
    "musicCarnatic",
    "art",
    /** Eastern Dancing */
    "dancingIndigenous",
    /** Bharatha Dancing */
    "dancingBharatha",
    /** English Literature */
    "appreciationEnglishLiteraryTexts",
    /** Sinhala Literature */
    "appreciationSinhalaLiteraryTexts",
    /** Tamil Literature */
    "appreciationTamilLiteraryTexts",
    /** Arabic Literature */
    "appreciationArabicLiteraryTexts",
    "dramaTheatre",
  ] as const,
  technicalVocational: [
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
  ] as const,
} as const;

// ─── A/L Streams ─────────────────────────────────────────────────────────────

export const AL_STREAMS = [
  "bioScience",
  "physicalScience",
  "commerce",
  "arts",
  "engineeringTechnology",
  "bioSystemsTechnology",
] as const;

export type ALStream = (typeof AL_STREAMS)[number];

/**
 * A/L subjects grouped by stream — Sri Lankan MOE/Department of Examinations.
 * Source: https://en.wikipedia.org/wiki/GCE_Advanced_Level_in_Sri_Lanka
 *
 * Students choose 3 subjects from ONE stream (or mix 2+1 across streams).
 */
export const AL_SUBJECTS = {
  /** Biology, Chemistry are mandatory; choose Physics OR Agricultural Science */
  bioScience: ["biology", "chemistry", "physics", "agriculturalScience"],
  /** Combined Mathematics and Physics are mandatory; choose Chemistry OR ICT */
  physicalScience: ["combinedMathematics", "physics", "chemistry", "ict"],
  /** Accounting and Economics are core; choose Business Studies OR Business Statistics */
  commerce: [
    "accounting",
    "businessStudies",
    "economics",
    "businessStatistics",
    "ict",
  ],
  /** Arts/Social Sciences & Humanities — broad choice of subjects */
  arts: [
    "buddhistCivilizations",
    "hinduCivilizations",
    "islamCivilizations",
    "christianCivilizations",
    "greekRomanCivilizations",
    /** Buddhism */
    "buddhistStudies",
    "hinduism",
    "islam",
    "christianity",
    "politicalScience",
    "history",
    "geography",
    "logic",
    "economics",
    "mathematics",
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
    "homeEconomics",
    "dancing",
    "music",
    "art",
    "dramaTheatre",
    "massMediaCommunication",
    "agriculturalScience",
  ],
  /** Technology stream (introduced 2013) — Engineering or Bio-system tracks */
  engineeringTechnology: [
    "engineeringTechnology",
    /** compulsory for both tracks */
    "scienceForTechnology",
    "ict",
  ],
  bioSystemsTechnology: [
    "bioSystemsTechnology",
    /** compulsory for both tracks */
    "scienceForTechnology",
    "agriculturalScience",
  ],
} as const;

/**
 * A/L common/compulsory subjects.
 * General English and GIT are compulsory but not counted for university entrance ranking.
 * A Common General test is also required (must pass).
 */
export const AL_COMMON_SUBJECTS = [
  "generalEnglish",
  "generalInformationTechnology",
  "commonGeneralTest",
] as const;

// ─── Subject Groupings by Education Level ───────────────────────────────────

/**
 * All subjects taught at Primary level (Grades 1-5).
 * Useful for: listing available subjects, marks entry for primary grades.
 */
export const SUBJECTS_BY_LEVEL = {
  primary: PRIMARY_SUBJECTS,
  juniorSecondary: JUNIOR_SECONDARY_SUBJECTS,
  /** O/L compulsory + all basket electives */
  ol: [
    ...OL_COMPULSORY_SUBJECTS,
    ...Object.values(BASKET_SUBJECTS).flat(),
  ] as const,
  /** A/L stream subjects + common subjects */
  al: [...Object.values(AL_SUBJECTS).flat(), ...AL_COMMON_SUBJECTS] as const,
} as const;

export type SubjectLevel = keyof typeof SUBJECTS_BY_LEVEL;

/**
 * Get all subjects for a given grade level.
 * Returns the appropriate subject set based on the education stage.
 */
export const getSubjectsForGrade = (grade: GradeLevel): readonly string[] => {
  const stage = getStageForGrade(grade);
  switch (stage) {
    case "primary": {
      return PRIMARY_SUBJECTS;
    }
    case "juniorSecondary": {
      return JUNIOR_SECONDARY_SUBJECTS;
    }
    case "seniorSecondaryPhaseI": {
      // O/L: compulsory + basket electives
      return [
        ...OL_COMPULSORY_SUBJECTS,
        ...Object.values(BASKET_SUBJECTS).flat(),
      ] as const;
    }
    case "seniorSecondaryPhaseII": {
      // A/L: all stream subjects + common
      return [
        ...Object.values(AL_SUBJECTS).flat(),
        ...AL_COMMON_SUBJECTS,
      ] as const;
    }
    default: {
      return [];
    }
  }
};

/**
 * Map each O/L basket subject to its category.
 * Useful for: validating subject choices (1 per basket), marks grouping.
 */
export const OL_BASKET_SUBJECT_CATEGORY: Record<
  (typeof BASKET_SUBJECTS)[keyof typeof BASKET_SUBJECTS][number],
  BasketCategory
> = {
  /** Category I */
  businessAccountingStudies: "languagesHumanities",
  geography: "languagesHumanities",
  civicEducation: "languagesHumanities",
  entrepreneurshipStudies: "languagesHumanities",
  secondLanguageSinhala: "languagesHumanities",
  secondLanguageTamil: "languagesHumanities",
  pali: "languagesHumanities",
  sanskrit: "languagesHumanities",
  french: "languagesHumanities",
  german: "languagesHumanities",
  hindi: "languagesHumanities",
  japanese: "languagesHumanities",
  arabic: "languagesHumanities",
  korean: "languagesHumanities",
  chinese: "languagesHumanities",
  russian: "languagesHumanities",
  /** Category II */
  musicOriental: "aestheticsArts",
  musicWestern: "aestheticsArts",
  musicCarnatic: "aestheticsArts",
  art: "aestheticsArts",
  dancingIndigenous: "aestheticsArts",
  dancingBharatha: "aestheticsArts",
  appreciationEnglishLiteraryTexts: "aestheticsArts",
  appreciationSinhalaLiteraryTexts: "aestheticsArts",
  appreciationTamilLiteraryTexts: "aestheticsArts",
  appreciationArabicLiteraryTexts: "aestheticsArts",
  dramaTheatre: "aestheticsArts",
  /** Category III */
  ict: "technicalVocational",
  agricultureFoodTechnology: "technicalVocational",
  aquaticBioresourcesTechnology: "technicalVocational",
  artsCrafts: "technicalVocational",
  homeEconomics: "technicalVocational",
  healthPhysicalEducation: "technicalVocational",
  communicationMediaStudies: "technicalVocational",
  designConstructionTechnology: "technicalVocational",
  designMechanicalTechnology: "technicalVocational",
  designElectricalElectronicTechnology: "technicalVocational",
  electronicWritingShorthandSinhala: "technicalVocational",
  electronicWritingShorthandTamil: "technicalVocational",
  electronicWritingShorthandEnglish: "technicalVocational",
};

export type OLBasketSubject =
  (typeof BASKET_SUBJECTS)[keyof typeof BASKET_SUBJECTS][number];

/**
 * Map each A/L subject to its stream.
 * Useful for: validating stream choices, marks grouping by stream.
 */
export const AL_SUBJECT_STREAM: Record<
  (typeof AL_SUBJECTS)[keyof typeof AL_SUBJECTS][number],
  ALStream
> = {
  // BioScience
  biology: "bioScience",
  chemistry: "bioScience",
  physics: "bioScience",
  agriculturalScience: "bioScience",
  // PhysicalScience
  combinedMathematics: "physicalScience",
  ict: "physicalScience",
  // Commerce
  accounting: "commerce",
  businessStudies: "commerce",
  economics: "commerce",
  businessStatistics: "commerce",
  // Arts
  buddhistCivilizations: "arts",
  hinduCivilizations: "arts",
  islamCivilizations: "arts",
  christianCivilizations: "arts",
  greekRomanCivilizations: "arts",
  buddhistStudies: "arts",
  hinduism: "arts",
  islam: "arts",
  christianity: "arts",
  politicalScience: "arts",
  history: "arts",
  geography: "arts",
  logic: "arts",
  mathematics: "arts",
  sinhala: "arts",
  tamil: "arts",
  english: "arts",
  pali: "arts",
  sanskrit: "arts",
  arabic: "arts",
  hindi: "arts",
  french: "arts",
  german: "arts",
  russian: "arts",
  chinese: "arts",
  japanese: "arts",
  korean: "arts",
  homeEconomics: "arts",
  dancing: "arts",
  music: "arts",
  art: "arts",
  dramaTheatre: "arts",
  massMediaCommunication: "arts",
  // EngineeringTechnology
  engineeringTechnology: "engineeringTechnology",
  scienceForTechnology: "engineeringTechnology",
  // BioSystemsTechnology
  bioSystemsTechnology: "bioSystemsTechnology",
};

export type ALSubject = (typeof AL_SUBJECTS)[keyof typeof AL_SUBJECTS][number];

// ─── All Subject Keys ────────────────────────────────────────────────────────

/** Union of every subject key across all education levels */
export type AllSubjectKey =
  | (typeof PRIMARY_SUBJECTS)[number]
  | (typeof JUNIOR_SECONDARY_SUBJECTS)[number]
  | (typeof JUNIOR_SECONDARY_TRANSVERSAL_SKILLS)[number]
  | (typeof JUNIOR_SECONDARY_ELECTIVES)[number]
  | OLCompulsorySubject
  | OLBasketSubject
  | ALStream
  | ALSubject
  | (typeof AL_COMMON_SUBJECTS)[number];
