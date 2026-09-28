import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import * as v from "valibot";

import { brand } from "./brand";
import type { Brand } from "./brand";
import { files } from "./files";
import { optionalNullable } from "./primitives";

export type ClubId = Brand<string, "ClubId">;
export const clubIdSchema = v.pipe(v.string(), brand<string, "ClubId">());

/** Lifecycle of a club. Clubs are created by the CMS, so this is not approval-gated. */
export const CLUB_STATUSES = ["active", "archived"] as const;
export type ClubStatus = (typeof CLUB_STATUSES)[number];

/**
 * A club or society.
 *
 * Clubs are school-level registry records rather than club-authored content, so
 * they carry no approval state: the CMS creates them. What a club *posts*
 * (galleries, events, announcements) lives in `gallery.ts` and
 * `clubContent.ts`, and every write to those goes through the submission
 * tables in `approvals.ts` first.
 */
export const club = sqliteTable(
  "club",
  {
    id: text("id").primaryKey(),

    /** URL segment, e.g. "photography" -> /clubs/photography. */
    slug: text("slug").notNull().unique(),

    name: text("name").notNull(),
    description: text("description"),

    /** Wide banner used on the club's own section header. */
    coverImageId: text("cover_image_id").references(() => files.id, {
      onDelete: "set null",
    }),

    /** Full-bleed background behind the club section. */
    backgroundImageId: text("background_image_id").references(() => files.id, {
      onDelete: "set null",
    }),

    status: text("status").$type<ClubStatus>().notNull().default("active"),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("club_status_idx").on(table.status),
    index("club_coverImage_idx").on(table.coverImageId),
  ]
);

export const clubSelectSchema = createSelectSchema(club, {
  id: () => clubIdSchema,
  status: () => v.picklist(CLUB_STATUSES),
});
export const clubInsertSchema = createInsertSchema(club, {
  id: () => clubIdSchema,
  slug: () => v.pipe(v.string(), v.minLength(1)),
  name: () => v.pipe(v.string(), v.minLength(1)),
  status: () => v.picklist(CLUB_STATUSES),
});

export type Club = v.InferOutput<typeof clubSelectSchema>;

/** Re-exported so callers can build a nullable club reference without importing two modules. */
export const optionalClubId = optionalNullable(clubIdSchema);
