import { sql } from "drizzle-orm";
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
import { files } from "./files";

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

/**
 * A school-wide announcement.
 *
 * This is the *global* announcement set. It is authored by the CMS rather than
 * by a club, so it carries no submission state: the CMS reviewer is the author.
 * Club announcements that amplify one of these live in `club_announcement` and
 * reference this table - the link is itself approval-gated, because linking to
 * a global announcement puts school-level wording in front of a club audience.
 */
export const announcement = sqliteTable(
  "announcement",
  {
    id: text("id").primaryKey(),

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
    check(
      "announcement_window_ordered",
      sql`${table.expiresAt} is null or ${table.effectiveFrom} is null or ${table.expiresAt} > ${table.effectiveFrom}`
    ),
  ]
);

export const announcementSelectSchema = createSelectSchema(announcement, {
  id: () => announcementIdSchema,
  audience: () => v.picklist(ANNOUNCEMENT_AUDIENCES),
  severity: () => v.picklist(ANNOUNCEMENT_SEVERITIES),
});
export const announcementInsertSchema = createInsertSchema(announcement, {
  id: () => announcementIdSchema,
  slug: () => v.pipe(v.string(), v.minLength(1)),
  title: () => v.pipe(v.string(), v.minLength(1)),
  body: () => v.pipe(v.string(), v.minLength(1)),
  audience: () => v.picklist(ANNOUNCEMENT_AUDIENCES),
  severity: () => v.picklist(ANNOUNCEMENT_SEVERITIES),
});

export type Announcement = v.InferOutput<typeof announcementSelectSchema>;
