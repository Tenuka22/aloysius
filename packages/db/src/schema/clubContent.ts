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

import { announcement, announcementIdSchema } from "./announcements";
import { brand } from "./brand";
import type { Brand } from "./brand";
import { club } from "./clubs";
import { files } from "./files";

export type ClubEventId = Brand<string, "ClubEventId">;
export const clubEventIdSchema = v.pipe(
  v.string(),
  brand<string, "ClubEventId">()
);

export type ClubAnnouncementId = Brand<string, "ClubAnnouncementId">;
export const clubAnnouncementIdSchema = v.pipe(
  v.string(),
  brand<string, "ClubAnnouncementId">()
);

export type ClubAchievementId = Brand<string, "ClubAchievementId">;
export const clubAchievementIdSchema = v.pipe(
  v.string(),
  brand<string, "ClubAchievementId">()
);

/**
 * Club-level content: events and announcements.
 *
 * Both are scoped to a club and never appear on the site until a CMS reviewer
 * approves the submission that created them (see `approvals.ts`). Unlike
 * galleries, these are not global - a club event is shown on the club's own
 * pages and in the events strip, never as a site-wide gallery.
 */
export const clubEvent = sqliteTable(
  "club_event",
  {
    id: text("id").primaryKey(),

    clubId: text("club_id")
      .notNull()
      .references(() => club.id, { onDelete: "cascade" }),

    /** URL segment, unique within the owning club. */
    slug: text("slug").notNull(),

    title: text("title").notNull(),
    description: text("description"),

    location: text("location"),

    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),

    coverImageId: text("cover_image_id").references(() => files.id, {
      onDelete: "set null",
    }),

    publishedAt: integer("published_at", { mode: "timestamp_ms" }),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("clubEvent_club_slug_uq").on(table.clubId, table.slug),
    index("clubEvent_club_startsAt_idx").on(table.clubId, table.startsAt),
    index("clubEvent_startsAt_idx").on(table.startsAt),
    check(
      "clubEvent_window_ordered",
      sql`${table.endsAt} >= ${table.startsAt}`
    ),
  ]
);

/**
 * A club announcement.
 *
 * `globalAnnouncementId` is the link to the school-wide announcement this club
 * is amplifying - "the photography club is also running the inter-house
 * photography competition announced globally". The link is written by the club
 * but only lands when the submission carrying it is approved, so a club cannot
 * borrow school-level wording without a reviewer seeing it.
 */
export const clubAnnouncement = sqliteTable(
  "club_announcement",
  {
    id: text("id").primaryKey(),

    clubId: text("club_id")
      .notNull()
      .references(() => club.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    body: text("body").notNull(),

    imageId: text("image_id").references(() => files.id, {
      onDelete: "set null",
    }),

    /** The global announcement being amplified, if any. */
    globalAnnouncementId: text("global_announcement_id").references(
      () => announcement.id,
      { onDelete: "set null" }
    ),

    effectiveFrom: integer("effective_from", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),

    publishedAt: integer("published_at", { mode: "timestamp_ms" }),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("clubAnnouncement_club_idx").on(table.clubId),
    index("clubAnnouncement_global_idx").on(table.globalAnnouncementId),
    index("clubAnnouncement_publishedAt_idx").on(table.publishedAt),
    check(
      "clubAnnouncement_window_ordered",
      sql`${table.expiresAt} is null or ${table.effectiveFrom} is null or ${table.expiresAt} > ${table.effectiveFrom}`
    ),
  ]
);

export const clubEventSelectSchema = createSelectSchema(clubEvent, {
  id: () => clubEventIdSchema,
});
export const clubEventInsertSchema = createInsertSchema(clubEvent, {
  id: () => clubEventIdSchema,
  slug: () => v.pipe(v.string(), v.minLength(1)),
  title: () => v.pipe(v.string(), v.minLength(1)),
  startsAt: () => v.date(),
  endsAt: () => v.date(),
});

export const clubAnnouncementSelectSchema = createSelectSchema(
  clubAnnouncement,
  {
    id: () => clubAnnouncementIdSchema,
    globalAnnouncementId: () => v.optional(v.nullable(announcementIdSchema)),
  }
);
export const clubAnnouncementInsertSchema = createInsertSchema(
  clubAnnouncement,
  {
    id: () => clubAnnouncementIdSchema,
    title: () => v.pipe(v.string(), v.minLength(1)),
    body: () => v.pipe(v.string(), v.minLength(1)),
    globalAnnouncementId: () => v.optional(v.nullable(announcementIdSchema)),
  }
);

/**
 * Something a club achieved.
 *
 * Deliberately separate from the root-level `achievement` table, which is the
 * school's record of what it as a school has done. Those are different claims
 * with different audiences: "the College won the national science fair" is
 * global content authored by the CMS, while "the Photography Club came second at
 * the inter-house competition" is the club's own and is written by the club.
 * Merging them would mean either a club editing school-level copy or a global
 * achievement quietly being attributed to whichever club logged it last.
 *
 * A gallery links to a club achievement through `galleryLink`, and to a
 * school-wide achievement or event the same way - a club can point its
 * photographs at either without either becoming the other's.
 */
export const clubAchievement = sqliteTable(
  "club_achievement",
  {
    id: text("id").primaryKey(),

    clubId: text("club_id")
      .notNull()
      .references(() => club.id, { onDelete: "cascade" }),

    title: text("title").notNull(),

    detail: text("detail"),

    /**
     * Free-form grouping, e.g. "Inter-house", "National", "Club". Unlike the
     * global `achievement.category` this is not a controlled vocabulary: what a
     * club competes in is the club's business, and a fixed list would reject
     * the first competition it had not heard of.
     */
    category: text("category"),

    /** When it happened. Free text rather than a date column: competitions are
     *  often logged weeks after the fact and "2026 Inter-house" is a real value
     *  that a date field would reject. */
    achievedOn: text("achieved_on"),

    imageId: text("image_id").references(() => files.id, {
      onDelete: "set null",
    }),

    publishedAt: integer("published_at", { mode: "timestamp_ms" }),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("clubAchievement_club_idx").on(table.clubId),
    index("clubAchievement_publishedAt_idx").on(table.publishedAt),
  ]
);

export const clubAchievementSelectSchema = createSelectSchema(clubAchievement, {
  id: () => clubAchievementIdSchema,
});
export const clubAchievementInsertSchema = createInsertSchema(clubAchievement, {
  id: () => clubAchievementIdSchema,
  title: () => v.pipe(v.string(), v.minLength(1)),
});

export type ClubEvent = v.InferOutput<typeof clubEventSelectSchema>;
export type ClubAnnouncement = v.InferOutput<
  typeof clubAnnouncementSelectSchema
>;
export type ClubAchievement = v.InferOutput<typeof clubAchievementSelectSchema>;
