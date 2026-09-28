import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import * as v from "valibot";

import { user } from "./auth";
import { brand } from "./brand";
import type { Brand } from "./brand";
import { club, clubIdSchema } from "./clubs";

export type GlobalSubmissionId = Brand<string, "GlobalSubmissionId">;
export const globalSubmissionIdSchema = v.pipe(
  v.string(),
  brand<string, "GlobalSubmissionId">()
);

export type ClubSubmissionId = Brand<string, "ClubSubmissionId">;
export const clubSubmissionIdSchema = v.pipe(
  v.string(),
  brand<string, "ClubSubmissionId">()
);

/**
 * Review state of a submission. `pending` is the only state in which the
 * payload is inert; approving applies it to the live table, rejecting drops it.
 */
export const SUBMISSION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "withdrawn",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/**
 * What a submission asks the CMS to do. `create` is the common case and is why
 * `target_id` is nullable below - a not-yet-existing row has no id yet.
 */
export const SUBMISSION_OPERATIONS = ["create", "update", "delete"] as const;
export type SubmissionOperation = (typeof SUBMISSION_OPERATIONS)[number];

/**
 * Global-scope targets. The photography club's galleries and their items are
 * the reason this table exists.
 *
 * The global announcement is deliberately absent: `announcement` is authored by
 * the CMS, and the CMS reviewer *is* the author, so routing its edits through a
 * review queue would be a second, meaningless gate.
 */
export const GLOBAL_SUBMISSION_TARGETS = [
  "gallery",
  "galleryItem",
  "galleryLink",
  "person",
  "event",
  "achievement",
] as const;
export type GlobalSubmissionTarget = (typeof GLOBAL_SUBMISSION_TARGETS)[number];

/** Club-scope targets, always tied to the club that owns them. */
export const CLUB_SUBMISSION_TARGETS = [
  "club",
  "clubEvent",
  "clubAnnouncement",
  "clubAchievement",
] as const;
export type ClubSubmissionTarget = (typeof CLUB_SUBMISSION_TARGETS)[number];

/**
 * A proposed change to global content, awaiting CMS approval.
 *
 * ## Why the payload lives here and not on the content tables
 *
 * The live tables hold only approved state. A club's in-progress edit is a row
 * in this table, so "the club changed the cover image" and "the CMS approved the
 * new cover image" are two different facts with two different timestamps. That
 * is what makes the re-approval requirement enforceable: approving a second
 * submission for a target that already has one replaces the first, and the
 * previously published row is untouched until the reviewer acts.
 *
 * ## Invariants enforced here, not in application code
 *
 * - At most one `pending` submission per target - the partial unique index. A
 *   club editing the same gallery twice supersedes its first submission rather
 *   than queueing a second, so a reviewer never sees two competing versions.
 *   `create` submissions carry a null `target_id`, and SQLite treats nulls as
 *   distinct in a unique index, so a club may queue several new items at once
 *   (a gallery is normally uploaded as a batch) while still never queueing two
 *   competing versions of the same existing row.
 * - A reviewed submission has both a reviewer and a review time; a pending one
 *   has neither - the check constraint.
 */
export const globalContentSubmission = sqliteTable(
  "global_content_submission",
  {
    id: text("id").primaryKey(),

    target: text("target").$type<GlobalSubmissionTarget>().notNull(),

    /** Existing row being edited or deleted; null when `operation` is "create". */
    targetId: text("target_id"),

    operation: text("operation").$type<SubmissionOperation>().notNull(),

    /**
     * JSON-encoded proposed field values, shaped by the target's payload
     * schema in the API layer. Applied to the live table on approval.
     */
    payload: text("payload").notNull(),

    /**
     * JSON-encoded snapshot of the live row at submit time, so the review UI
     * can show the reviewer a before/after diff without re-deriving it.
     */
    baseSnapshot: text("base_snapshot"),

    /**
     * The club the submitter belongs to. Recorded for scoping the review queue
     * and for the audit trail; a CMS editor may also submit directly.
     */
    submittedByClubId: text("submitted_by_club_id").references(() => club.id, {
      onDelete: "set null",
    }),

    status: text("status")
      .$type<SubmissionStatus>()
      .notNull()
      .default("pending"),

    submittedById: text("submitted_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    submittedAt: integer("submitted_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),

    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),

    /** Why it was rejected, or guidance for the resubmission. */
    reviewNote: text("review_note"),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("globalContentSubmission_target_idx").on(
      table.target,
      table.targetId
    ),
    index("globalContentSubmission_status_idx").on(table.status),
    index("globalContentSubmission_submittedBy_idx").on(table.submittedById),
    index("globalContentSubmission_club_idx").on(table.submittedByClubId),

    uniqueIndex("globalContentSubmission_pending_uq")
      .on(table.target, table.targetId)
      .where(sql`${table.status} = 'pending'`),

    check(
      "globalContentSubmission_create_has_no_target",
      sql`(${table.operation} = 'create' and ${table.targetId} is null) or (${table.operation} <> 'create' and ${table.targetId} is not null)`
    ),

    /*
     * A decided submission records who decided it and when; an undecided one
     * records neither. `withdrawn` is deliberately exempt: the submitter took
     * the proposal back, so no reviewer exists. Requiring `reviewed_by_id` here
     * would force every withdrawal to either name the submitter as the reviewer
     * of their own proposal - a lie in the audit trail - or fail the constraint
     * and make withdrawal impossible. The submitter is already on the row as
     * `submitted_by_id`, and `submitted_at` says when they sent it.
     */
    check(
      "globalContentSubmission_reviewed_fields_paired",
      sql`(${table.status} in ('pending', 'withdrawn') and ${table.reviewedAt} is null and ${table.reviewedById} is null) or (${table.status} in ('approved', 'rejected') and ${table.reviewedAt} is not null and ${table.reviewedById} is not null)`
    ),
  ]
);

/**
 * A proposed change to club-level content, awaiting CMS approval.
 *
 * Same contract as `global_content_submission`, with the club recorded
 * explicitly because club content has exactly one owner: the review queue for
 * a club officer shows their own club's pending items, and a submission can
 * never be moved between clubs.
 */
export const clubContentSubmission = sqliteTable(
  "club_content_submission",
  {
    id: text("id").primaryKey(),

    /** The club that owns the target; also the scope of the submitter's access. */
    clubId: text("club_id")
      .notNull()
      .references(() => club.id, { onDelete: "cascade" }),

    target: text("target").$type<ClubSubmissionTarget>().notNull(),

    /** Existing row being edited or deleted; null when `operation` is "create". */
    targetId: text("target_id"),

    operation: text("operation").$type<SubmissionOperation>().notNull(),

    payload: text("payload").notNull(),

    baseSnapshot: text("base_snapshot"),

    status: text("status")
      .$type<SubmissionStatus>()
      .notNull()
      .default("pending"),

    submittedById: text("submitted_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    submittedAt: integer("submitted_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),

    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),

    reviewNote: text("review_note"),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("clubContentSubmission_club_target_idx").on(
      table.clubId,
      table.target,
      table.targetId
    ),
    index("clubContentSubmission_status_idx").on(table.status),
    index("clubContentSubmission_submittedBy_idx").on(table.submittedById),

    uniqueIndex("clubContentSubmission_pending_uq")
      .on(table.clubId, table.target, table.targetId)
      .where(sql`${table.status} = 'pending'`),

    check(
      "clubContentSubmission_create_has_no_target",
      sql`(${table.operation} = 'create' and ${table.targetId} is null) or (${table.operation} <> 'create' and ${table.targetId} is not null)`
    ),

    /* See `globalContentSubmission_reviewed_fields_paired`: `withdrawn` is
     * exempt because nobody reviewed it. */
    check(
      "clubContentSubmission_reviewed_fields_paired",
      sql`(${table.status} in ('pending', 'withdrawn') and ${table.reviewedAt} is null and ${table.reviewedById} is null) or (${table.status} in ('approved', 'rejected') and ${table.reviewedAt} is not null and ${table.reviewedById} is not null)`
    ),
  ]
);

export const globalContentSubmissionSelectSchema = createSelectSchema(
  globalContentSubmission,
  {
    id: () => globalSubmissionIdSchema,
    target: () => v.picklist(GLOBAL_SUBMISSION_TARGETS),
    operation: () => v.picklist(SUBMISSION_OPERATIONS),
    status: () => v.picklist(SUBMISSION_STATUSES),
    submittedByClubId: () => v.optional(v.nullable(clubIdSchema)),
  }
);
export const globalContentSubmissionInsertSchema = createInsertSchema(
  globalContentSubmission,
  {
    id: () => globalSubmissionIdSchema,
    target: () => v.picklist(GLOBAL_SUBMISSION_TARGETS),
    operation: () => v.picklist(SUBMISSION_OPERATIONS),
    status: () => v.picklist(SUBMISSION_STATUSES),
    payload: () => v.pipe(v.string(), v.minLength(2)),
  }
);

export const clubContentSubmissionSelectSchema = createSelectSchema(
  clubContentSubmission,
  {
    id: () => clubSubmissionIdSchema,
    clubId: () => clubIdSchema,
    target: () => v.picklist(CLUB_SUBMISSION_TARGETS),
    operation: () => v.picklist(SUBMISSION_OPERATIONS),
    status: () => v.picklist(SUBMISSION_STATUSES),
  }
);
export const clubContentSubmissionInsertSchema = createInsertSchema(
  clubContentSubmission,
  {
    id: () => clubSubmissionIdSchema,
    clubId: () => clubIdSchema,
    target: () => v.picklist(CLUB_SUBMISSION_TARGETS),
    operation: () => v.picklist(SUBMISSION_OPERATIONS),
    status: () => v.picklist(SUBMISSION_STATUSES),
    payload: () => v.pipe(v.string(), v.minLength(2)),
  }
);

export type GlobalContentSubmission = v.InferOutput<
  typeof globalContentSubmissionSelectSchema
>;
export type ClubContentSubmission = v.InferOutput<
  typeof clubContentSubmissionSelectSchema
>;
