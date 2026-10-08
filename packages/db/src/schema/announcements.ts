import { sql } from "drizzle-orm";
import type { SQL, SQLWrapper } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import * as v from "valibot";

import { user } from "./auth";
import { brand } from "./brand";
import type { Brand } from "./brand";
import { CLUBS, clubSlugSchema } from "./club-photos";
import { files } from "./files";

/** `column in ('a', 'b')` for a CHECK. Values are code constants, never input. */
const sqlInList = (column: SQLWrapper, values: readonly string[]): SQL =>
  sql`${column} in (${sql.raw(values.map((value) => `'${value}'`).join(", "))})`;

export type AnnouncementId = Brand<string, "AnnouncementId">;
export const announcementIdSchema = v.pipe(
  v.string(),
  brand<string, "AnnouncementId">()
);

/** Who an announcement is addressed to. Drives the notice-strip filtering. */
export const ANNOUNCEMENT_AUDIENCES = [
  "all",
  "students",
  "staff",
  "parents",
  "alumni",
] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

/**
 * Visual urgency. `info` is the default; `urgent` is what pins an item to the
 * top of the strip on every page.
 */
export const ANNOUNCEMENT_SEVERITIES = ["info", "important", "urgent"] as const;
export type AnnouncementSeverity = (typeof ANNOUNCEMENT_SEVERITIES)[number];

export const ANNOUNCEMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;
export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

/**
 * A school-wide announcement.
 *
 * Authored either by the CMS directly (`authorId` is a CMS/admin seat, row
 * starts `approved`-equivalent via the CMS publish flow) or submitted by a
 * club seat through `club.submitAnnouncement`, in which case `authorId` is
 * the submitting seat and `status` starts `pending` until a CMS reviewer
 * (`club.reviewAnnouncement`) approves it. `announcement_review_fields_paired`
 * makes "approved with no reviewer" and "still pending but reviewed" both
 * unrepresentable, same shape as `club_photo`.
 */
export const announcement = sqliteTable(
  "announcement",
  {
    id: text("id").primaryKey(),

    /** Which club submitted this announcement. Same one-club-per-seat model
     * as `club_photo` - see `club-photos.ts`. */
    club: text("club").notNull(),

    slug: text("slug").notNull().unique(),

    title: text("title").notNull(),
    body: text("body").notNull(),

    audience: text("audience")
      .$type<AnnouncementAudience>()
      .notNull()
      .default("all"),

    severity: text("severity")
      .$type<AnnouncementSeverity>()
      .notNull()
      .default("info"),

    /** Held to the top of the strip regardless of publish time. */
    isPinned: integer("is_pinned", { mode: "boolean" })
      .notNull()
      .default(false),

    /** Optional illustration. */
    imageId: text("image_id").references(() => files.id, {
      onDelete: "set null",
    }),

    /** Window during which the announcement is shown. Both ends optional. */
    effectiveFrom: integer("effective_from", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),

    publishedAt: integer("published_at", { mode: "timestamp_ms" }),

    /** CMS author. */
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    /** `pending` until a CMS reviewer (admin|cms) decides; only `approved`
     * rows are selected by the public notices query. */
    status: text("status")
      .$type<AnnouncementStatus>()
      .default("pending")
      .notNull(),

    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    reviewNote: text("review_note"),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("announcement_audience_idx").on(table.audience),
    index("announcement_pinned_idx").on(table.isPinned),
    index("announcement_publishedAt_idx").on(table.publishedAt),
    index("announcement_author_idx").on(table.authorId),
    index("announcement_club_status_idx").on(table.club, table.status),
    check(
      "announcement_window_ordered",
      sql`${table.expiresAt} is null or ${table.effectiveFrom} is null or ${table.expiresAt} > ${table.effectiveFrom}`
    ),
    check("announcement_club_check", sqlInList(table.club, CLUBS)),
    check(
      "announcement_status_check",
      sqlInList(table.status, ANNOUNCEMENT_STATUSES)
    ),
    check(
      "announcement_review_fields_paired",
      sql`(${table.status} = 'pending' and ${table.reviewedById} is null and ${table.reviewedAt} is null)
          or (${table.status} <> 'pending' and ${table.reviewedById} is not null and ${table.reviewedAt} is not null)`
    ),
  ]
);

export const announcementSelectSchema = createSelectSchema(announcement, {
  id: () => announcementIdSchema,
  club: () => clubSlugSchema,
  audience: () => v.picklist(ANNOUNCEMENT_AUDIENCES),
  severity: () => v.picklist(ANNOUNCEMENT_SEVERITIES),
  status: () => v.picklist(ANNOUNCEMENT_STATUSES),
  reviewNote: () =>
    v.optional(v.nullable(v.pipe(v.string(), v.maxLength(1000)))),
});
export const announcementInsertSchema = createInsertSchema(announcement, {
  id: () => announcementIdSchema,
  club: () => clubSlugSchema,
  slug: () => v.pipe(v.string(), v.minLength(1)),
  title: () => v.pipe(v.string(), v.minLength(1)),
  body: () => v.pipe(v.string(), v.minLength(1)),
  audience: () => v.picklist(ANNOUNCEMENT_AUDIENCES),
  severity: () => v.picklist(ANNOUNCEMENT_SEVERITIES),
});

export type Announcement = v.InferOutput<typeof announcementSelectSchema>;
