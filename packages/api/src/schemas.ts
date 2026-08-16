import { z } from "zod";
import {
  ACTIVITY_TYPES,
  ACHIEVEMENT_CATEGORIES,
  AUDIENCES,
  AUTHOR_TYPES,
  CONTENT_STATUSES,
  DONATION_STATUSES,
  EVENT_OUTCOMES,
  EXAM_TYPES,
  MEMBERSHIP_STATUSES,
  REVIEW_STATUSES,
  STREAMS,
  STUDENT_WORK_CATEGORIES,
  type AuthorType,
  type ContentStatus,
  type MembershipStatus,
  type ReviewStatus,
} from "@aloysius-web/db/enums";

// Enum domains are defined once in @aloysius-web/db/enums (the same `as const`
// arrays feed both the Drizzle schema and these Zod schemas), so a value can
// never drift between the database and the API/UI types.

export const contentStatusSchema = z.enum(CONTENT_STATUSES);
export const authorTypeSchema = z.enum(AUTHOR_TYPES);
export const reviewStatusSchema = z.enum(REVIEW_STATUSES);
export const membershipStatusSchema = z.enum(MEMBERSHIP_STATUSES);
export const donationStatusSchema = z.enum(DONATION_STATUSES);
export const audienceSchema = z.enum(AUDIENCES);
export const activityTypeSchema = z.enum(ACTIVITY_TYPES);
export const achievementCategorySchema = z.enum(ACHIEVEMENT_CATEGORIES);
export const studentWorkCategorySchema = z.enum(STUDENT_WORK_CATEGORIES);
export const examTypeSchema = z.enum(EXAM_TYPES);
export const streamSchema = z.enum(STREAMS);
export const eventOutcomeSchema = z.enum(EVENT_OUTCOMES);

// API-only enum domains — no matching DB column, so they live here.
export const sortDirectionSchema = z.enum(["asc", "desc"]);
export const reviewActionSchema = z.enum(["approve", "reject"]);
export const contentKindSchema = z.enum(["news", "event", "announcement", "studentWork", "album"]);

// OB gallery "link" discriminated union (event/donation/none) — shared by the
// create and update procedures that attach an OB gallery to a related record.
export const galleryLinkSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("event"), id: z.string() }),
  z.object({ type: z.literal("donation"), id: z.string() }),
  z.object({ type: z.literal("none") }),
]);

// Explicit re-exports of the DB-derived literal types for consumers that want
// the type without importing the API schema object.
export type { AuthorType, ContentStatus, MembershipStatus, ReviewStatus };