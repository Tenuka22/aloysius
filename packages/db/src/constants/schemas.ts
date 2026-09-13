import { z } from "zod";

/**
 * Zod validation schemas built from the constants.
 * Single source of truth: validation references the constant arrays directly.
 */
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
} from "./subjects";
import {
  GENDERS,
  MARITAL_STATUSES,
  BLOOD_GROUPS,
  APPOINTMENT_TYPES,
  EMPLOYMENT_STATUSES,
  QUALIFICATION_LEVELS,
  SRI_LANKA_DISTRICTS,
} from "./teachers";

// Top-level regex constants (lint requires top-level, unicode-aware regexes)
const SL_PHONE_RE = /^(?:\+94|0)[7]\d{8}$/u;
const NIC_OLD_RE = /^\d{9}[vV]$/u;
const NIC_NEW_RE = /^\d{12}$/u;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/u;
const POSTAL_CODE_RE = /^\d{5}$/u;
const PW_UPPER_RE = /[A-Z]/u;
const PW_LOWER_RE = /[a-z]/u;
const PW_DIGIT_RE = /\d/u;
const PW_SPECIAL_RE = /[^A-Za-z0-9]/u;

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

/** Qualification status */
export const qualificationStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);

/** Gender — Male or Female only */
export const genderSchema = z.enum(GENDERS as unknown as [string, ...string[]]);

/** Marital status */
export const maritalStatusSchema = z.enum(
  MARITAL_STATUSES as unknown as [string, ...string[]]
);

/** Blood group */
export const bloodGroupSchema = z.enum(
  BLOOD_GROUPS as unknown as [string, ...string[]]
);

/** Appointment type — MOE employment types */
export const appointmentTypeSchema = z.enum(
  Object.keys(APPOINTMENT_TYPES) as unknown as [string, ...string[]]
);

/** Employment status */
export const employmentStatusSchema = z.enum(
  Object.keys(EMPLOYMENT_STATUSES) as unknown as [string, ...string[]]
);

/** Sri Lankan district */
export const districtSchema = z.enum(
  SRI_LANKA_DISTRICTS as unknown as [string, ...string[]]
);

/** Qualification level — for validation */
export const qualificationLevelSchema = z.enum(
  Object.keys(QUALIFICATION_LEVELS) as [string, ...string[]]
);

/** Optional phone number — Sri Lankan format if provided */
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || SL_PHONE_RE.test(val),
    "Invalid Sri Lankan phone number format"
  );

/** Optional NIC — validated format if provided */
export const nicSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || NIC_OLD_RE.test(val) || NIC_NEW_RE.test(val),
    "Invalid NIC format (9 digits + V or 12 digits)"
  );

/** Optional date — ISO format if provided */
export const dateSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || ISO_DATE_RE.test(val),
    "Date must be in YYYY-MM-DD format"
  );

/** Address schema — all fields optional */
export const addressSchema = z.object({
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  district: districtSchema.optional(),
  gramaNiladhariDivision: z.string().optional(),
  postalCode: z
    .string()
    .regex(POSTAL_CODE_RE, "Invalid postal code")
    .optional(),
});

/** Qualification input schema */
export const qualificationInputSchema = z.object({
  qualification: qualificationLevelSchema,
  yearObtained: z.number().int().min(1900).max(2100).optional(),
  institution: z.string().optional(),
  subjectSpecialization: z.string().optional(),
  specializationCategory: z.string().optional(),
  documentFileId: z.string().optional(),
});

/** Password strength schema — for admin password rotation */
// Better-auth handles min/max length via config, we add complexity requirements
export const strongPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(PW_UPPER_RE, "Must contain uppercase letter")
  .regex(PW_LOWER_RE, "Must contain lowercase letter")
  .regex(PW_DIGIT_RE, "Must contain number")
  .regex(PW_SPECIAL_RE, "Must contain special character");

/** Staff update input — all fields optional except name/email which require auth */
export const updateStaffSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.email().optional(),
  nic: nicSchema,
  phone: phoneSchema,
  birthDate: dateSchema,
  gender: genderSchema.optional(),
  religion: religionSchema.optional(),
  motherTongue: motherTongueSchema.optional(),
  bloodGroup: bloodGroupSchema.optional(),
  maritalStatus: maritalStatusSchema.optional(),
  spouseName: z.string().optional(),
  address: addressSchema.optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: phoneSchema,
  appointmentType: appointmentTypeSchema.optional(),
  appointmentDate: dateSchema,
  teacherServiceNo: z.string().optional(),
  employmentStatus: employmentStatusSchema.optional(),
  portraitFileId: z.string().optional(),
  nationalIdentityCardFileId: z.string().optional(),
});

/** Employment verification document input */
export const employmentVerificationInputSchema = z.object({
  staffId: z.string(),
  documentType: z.enum([
    "nationalIdentityCard",
    "passport",
    "appointmentLetter",
    "temporaryAppointmentLetter",
    "specifiedPeriodLetter",
    "recruitmentLetter",
    "promotionLetter",
    "transferLetter",
    "actingAppointmentLetter",
    "contractAgreement",
  ]),
  fileId: z.string(),
});

/** Qualification review input */
export const qualificationReviewSchema = z.object({
  id: z.string(),
  status: qualificationStatusSchema,
  reviewNote: z.string().optional(),
});

/** Password rotation input (self-service) */
export const rotatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: strongPasswordSchema,
});

/** Password rotation input (admin-initiated) */
export const adminRotatePasswordSchema = z.object({
  staffId: z.string(),
  newPassword: strongPasswordSchema,
});
