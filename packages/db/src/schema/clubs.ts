import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/valibot";
import * as v from "valibot";

export const clubIdSchema = v.pipe(v.string(), v.brand("ClubId"));
export type ClubId = v.InferOutput<typeof clubIdSchema>;

/**
 * A club slug: the stable key a gallery, event, announcement or news post is
 * attributed to.
 *
 * Format-validated rather than membership-validated. This used to be
 * `v.picklist(["photography"])`, which meant adding a club was a code change,
 * a reseed and a SQLite table rebuild on every table carrying a
 * `club in (...)` CHECK constraint. The list is data now; the constraint that
 * survives is the one that can be written by an admin in the CMS.
 */
export const clubSlugSchema = v.pipe(
  v.string(),
  v.regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u,
    "A club slug is lowercase words separated by single hyphens"
  ),
  v.maxLength(60),
  v.brand("ClubSlug")
);
export type ClubSlug = v.InferOutput<typeof clubSlugSchema>;

/**
 * A club or society.
 *
 * Two things were conflated in the old single-slug constant and are separate
 * here. `name` is what a visitor reads - "Photography Club". `role` is what the
 * club is *for*, set by the college rather than by whoever maintains the record:
 * a `society` meets through the week and competes, a `cadet_corps` trains
 * towards a civic duty, a `band` performs. It is a closed set because a CMS
 * editor picking from four honest options is a better outcome than one typing
 * free text into a field that then reads back inconsistently across the site.
 *
 * `photography` is seeded and is not deletable - the `club:submit` seat in
 * `packages/auth/src/roles.ts` is bound to that slug, so removing the club
 * would orphan the one identity that can submit a gallery.
 */
export const CLUB_ROLES = ["society", "cadet_corps", "band", "media"] as const;
export const clubRoleSchema = v.picklist(CLUB_ROLES);
export type ClubRole = v.InferOutput<typeof clubRoleSchema>;

export const CLUB_ROLE_LABEL: Record<ClubRole, string> = {
  society: "Society",
  cadet_corps: "Cadet corps",
  band: "Band & choir",
  media: "Media unit",
};

/** The one slug the seeded club seat is bound to. Deleting it is refused. */
export const PRIMARY_CLUB_SLUG = "photography" as const;

export const club = sqliteTable(
  "club",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    role: text("role").$type<ClubRole>().notNull(),
    description: text("description"),
    /** Omitted until the college publishes one. */
    coverImageId: text("cover_image_id"),
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
    index("club_role_idx").on(table.role),
    check(
      "club_role_check",
      sql`${table.role} in ('society', 'cadet_corps', 'band', 'media')`
    ),
  ]
);

const clubColumnRefinements = {
  id: () => clubIdSchema,
  slug: () => clubSlugSchema,
  role: () => clubRoleSchema,
};

export const clubSelectSchema = createSelectSchema(club, clubColumnRefinements);
export const clubInsertSchema = createInsertSchema(club, clubColumnRefinements);
export const clubUpdateSchema = createUpdateSchema(club, clubColumnRefinements);

export type Club = v.InferOutput<typeof clubSelectSchema>;
