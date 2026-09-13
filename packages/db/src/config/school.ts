/**
 * School-specific configuration.
 * This file is hardcoded — not stored in the database.
 * Edit this to match your school's profile.
 */

export interface SchoolConfig {
  name: string;
  type: "1AB" | "1C" | "type2" | "type3";
  gradeRange: { min: number; max: number };
  mediums: readonly ("sinhala" | "tamil" | "english")[];
  religions: readonly (
    | "buddhism"
    | "hinduism"
    | "catholicism"
    | "christianity"
    | "islam"
  )[];
  motherTongues: readonly ("sinhala" | "tamil")[];
  offeredOLBasketCategories: readonly (
    | "languagesHumanities"
    | "aestheticsArts"
    | "technicalVocational"
  )[];
  offeredALStreams: readonly (
    | "bioScience"
    | "physicalScience"
    | "commerce"
    | "arts"
    | "engineeringTechnology"
    | "bioSystemsTechnology"
  )[];
  offeredGrade9Optionals: boolean;
}

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
} as const;
