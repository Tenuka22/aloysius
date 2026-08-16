// Single source of truth for the string-enum value domains shared across the
// Drizzle schema (text(..., { enum })) and the API Zod schemas (z.enum(...)).
// Both consumers derive from the same `as const` arrays so a value can never
// drift between the database and the API/UI types.

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const AUTHOR_TYPES = ["student", "faculty", "club", "org"] as const;
export type AuthorType = (typeof AUTHOR_TYPES)[number];

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const MEMBERSHIP_STATUSES = ["pending", "approved", "rejected", "revoked"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const DONATION_STATUSES = ["pending", "confirmed", "cancelled"] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const AUDIENCES = ["all", "students", "parents", "staff", "alumni"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const ACTIVITY_TYPES = ["club", "sport", "other"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACHIEVEMENT_CATEGORIES = [
  "academic",
  "sports",
  "arts",
  "clubs",
  "community",
  "other",
] as const;
export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

export const STUDENT_WORK_CATEGORIES = [
  "film",
  "art",
  "music",
  "writing",
  "design",
  "photography",
  "code",
  "other",
] as const;
export type StudentWorkCategory = (typeof STUDENT_WORK_CATEGORIES)[number];

export const EXAM_TYPES = ["scholarship", "ol", "al"] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export const STREAMS = [
  "physical_science",
  "biological_science",
  "commerce",
  "arts",
  "technology",
] as const;
export type Stream = (typeof STREAMS)[number];

export const EVENT_OUTCOMES = ["success", "postponed", "failed"] as const;
export type EventOutcome = (typeof EVENT_OUTCOMES)[number];

export const CLUB_MEMBER_ROLES = ["admin", "member"] as const;
export type ClubMemberRole = (typeof CLUB_MEMBER_ROLES)[number];

export const NOTIFICATION_TYPES = [
  "membership_request",
  "membership_approved",
  "membership_rejected",
  "membership_revoked",
  "content_approved",
  "content_rejected",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];