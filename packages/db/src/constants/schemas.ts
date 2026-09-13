/**
 * Zod validation schemas built from the constants.
 * Single source of truth: validation references the constant arrays directly.
 */
import { z } from "zod";

import { GRADE_LEVELS } from "./grades";
import { POSITION_TYPES, SECTIONAL_SCOPES } from "./positions";
import {
  PRIMARY_SUBJECTS,
  JUNIOR_SECONDARY_SUBJECTS,
  OL_COMPULSORY_SUBJECTS,
  BASKET_SUBJECTS,
  AL_STREAMS,
  AL_SUBJECTS,
  AL_COMMON_SUBJECTS,
  MOTHER_TONGUE_OPTIONS,
  RELIGION_OPTIONS,
  SUBJECTS_BY_LEVEL,
} from "./subjects";

/** Subject level — education stage grouping */
export const subjectLevelSchema = z.enum([
  "primary",
  "juniorSecondary",
  "ol",
  "al",
] as const);

/** Grade level validation — derived from GRADE_LEVELS constant */
export const gradeLevelSchema = z
  .number()
  .int()
  .refine(
    (val): val is (typeof GRADE_LEVELS)[number] =>
      (GRADE_LEVELS as readonly number[]).includes(val),
    { message: `Grade level must be one of: ${GRADE_LEVELS.join(", ")}` }
  );

/** Medium of instruction — derived from MOTHER_TONGUE_OPTIONS + english */
export const mediumSchema = z.enum([
  ...MOTHER_TONGUE_OPTIONS,
  "english",
] as const);

/** Position type key — derived from POSITION_TYPES */
export const positionTypeSchema = z.enum(
  Object.keys(POSITION_TYPES) as [string, ...string[]]
);

/** Sectional scope key — derived from SECTIONAL_SCOPES */
export const sectionalScopeSchema = z.enum(
  SECTIONAL_SCOPES as unknown as [string, ...string[]]
);

/** Subject key — union of all subject keys across levels */
export const subjectKeySchema = z.enum([
  ...new Set([
    ...PRIMARY_SUBJECTS,
    ...JUNIOR_SECONDARY_SUBJECTS,
    ...OL_COMPULSORY_SUBJECTS,
    ...Object.values(BASKET_SUBJECTS).flat(),
    ...AL_STREAMS,
    ...Object.values(AL_SUBJECTS).flat(),
    ...AL_COMMON_SUBJECTS,
  ]),
] as unknown as [string, ...string[]]);

/** Religion option — derived from RELIGION_OPTIONS */
export const religionSchema = z.enum(
  RELIGION_OPTIONS as unknown as [string, ...string[]]
);

/** Mother tongue option — derived from MOTHER_TONGUE_OPTIONS */
export const motherTongueSchema = z.enum(
  MOTHER_TONGUE_OPTIONS as unknown as [string, ...string[]]
);

/** A/L stream key — derived from AL_STREAMS */
export const alStreamSchema = z.enum(
  AL_STREAMS as unknown as [string, ...string[]]
);

/** O/L basket category */
export const basketCategorySchema = z.enum([
  "languagesHumanities",
  "aestheticsArts",
  "technicalVocational",
] as const);

/** Get subjects for a specific education level */
export const subjectsForLevelSchema = z
  .union([
    z.literal("primary"),
    z.literal("juniorSecondary"),
    z.literal("ol"),
    z.literal("al"),
  ])
  .transform((level) => SUBJECTS_BY_LEVEL[level]);

/** Qualification status */
export const qualificationStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);
