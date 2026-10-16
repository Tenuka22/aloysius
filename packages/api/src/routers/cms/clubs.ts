import { announcement } from "@aloysius/db/schema/announcements";
import { gallery } from "@aloysius/db/schema/club-photos";
import {
  club,
  clubIdSchema,
  clubRoleSchema,
  PRIMARY_CLUB_SLUG,
} from "@aloysius/db/schema/clubs";
import { newsPost } from "@aloysius/db/schema/news-posts";
import { event } from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import { asc, count, eq } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";

const clubFieldsSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  slug: v.pipe(
    v.string(),
    v.regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/u,
      "Lowercase words separated by single hyphens, e.g. choir-and-band"
    ),
    v.maxLength(60)
  ),
  role: clubRoleSchema,
  description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(600)))),
});

/*
 * One shared shape for "what does this club own", used by both the list and the
 * delete guard. `count()` rather than a left-joined column, because joining
 * four tables at once multiplies the rows and a column-read gives 1 where the
 * real answer is 4.
 */
const clubContentCounts = {
  galleries: count(gallery.id),
  events: count(event.id),
  announcements: count(announcement.id),
  newsPosts: count(newsPost.id),
};

const CONTENT_TOTAL_KEYS = [
  "galleries",
  "events",
  "announcements",
  "newsPosts",
] as const;

const hasContent = (
  counts: Record<(typeof CONTENT_TOTAL_KEYS)[number], number>
) => CONTENT_TOTAL_KEYS.some((key) => counts[key] > 0);

/**
 * Every club with a count of what it owns, so the CMS screen can answer "what
 * does this club own" - and whether deleting it would orphan anything - in one
 * query per list rather than five per club.
 */
export const listClubs = cmsProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select({
      id: club.id,
      slug: club.slug,
      name: club.name,
      role: club.role,
      description: club.description,
      publishedAt: club.publishedAt,
      ...clubContentCounts,
    })
    .from(club)
    .leftJoin(gallery, eq(gallery.club, club.slug))
    .leftJoin(event, eq(event.club, club.slug))
    .leftJoin(announcement, eq(announcement.club, club.slug))
    .leftJoin(newsPost, eq(newsPost.club, club.slug))
    .groupBy(club.id)
    .orderBy(asc(club.name))
    .all();

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    role: row.role,
    description: row.description,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    galleries: row.galleries,
    events: row.events,
    announcements: row.announcements,
    newsPosts: row.newsPosts,
    /**
     * The seeded slug is what the `photography-admin` seat's `club:submit`
     * grant is bound to, so the screen must know it is not deletable.
     */
    isPrimary: row.slug === PRIMARY_CLUB_SLUG,
    inUse: hasContent(row),
  }));
});

/**
 * The public `/students` page's own read of the club registry: just enough
 * to render a card per club, with none of the ownership counts or draft
 * state that only the CMS screen needs.
 */
export const listPublishedClubs = publicProcedure.handler(
  async ({ context }) => {
    const rows = await context.db
      .select({
        id: club.id,
        slug: club.slug,
        name: club.name,
        description: club.description,
      })
      .from(club)
      .orderBy(asc(club.name))
      .all();

    return rows;
  }
);

export const createClub = cmsProcedure
  .input(clubFieldsSchema)
  .handler(async ({ input, context }) => {
    const clash = await context.db
      .select({ id: club.id })
      .from(club)
      .where(eq(club.slug, input.slug))
      .limit(1)
      .get();

    if (clash) {
      throw new ORPCError("CONFLICT", {
        message: `A club with the slug "${input.slug}" already exists`,
      });
    }

    const id = await context.db
      .insert(club)
      .values({
        name: input.name,
        slug: input.slug,
        role: input.role,
        description: input.description ?? null,
        publishedAt: new Date(),
      })
      .returning({ id: club.id })
      .get();

    return { id };
  });

/**
 * Rename a club, and change its slug only when nothing is attributed to it.
 *
 * The slug is the join key across four tables, so changing it on a club that
 * owns content would orphan every one of those rows: the content would still
 * exist, pointing at a slug nothing resolves to. Refusing is the honest answer,
 * and `listClubs` reports `inUse` so the screen can make the field read-only.
 */
export const updateClub = cmsProcedure
  .input(v.object({ id: clubIdSchema, ...clubFieldsSchema.entries }))
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select({ slug: club.slug, ...clubContentCounts })
      .from(club)
      .leftJoin(gallery, eq(gallery.club, club.slug))
      .leftJoin(event, eq(event.club, club.slug))
      .leftJoin(announcement, eq(announcement.club, club.slug))
      .leftJoin(newsPost, eq(newsPost.club, club.slug))
      .where(eq(club.id, input.id))
      .groupBy(club.id)
      .limit(1)
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Club not found" });
    }

    const slugChanged = input.slug !== existing.slug;

    if (slugChanged && hasContent(existing)) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "This club has content attributed to it, so its slug cannot change. Rename the club instead.",
      });
    }

    if (slugChanged) {
      const clash = await context.db
        .select({ id: club.id })
        .from(club)
        .where(eq(club.slug, input.slug))
        .limit(1)
        .get();
      if (clash) {
        throw new ORPCError("CONFLICT", {
          message: `A club with the slug "${input.slug}" already exists`,
        });
      }
    }

    await context.db
      .update(club)
      .set({
        name: input.name,
        slug: input.slug,
        role: input.role,
        description: input.description ?? null,
      })
      .where(eq(club.id, input.id))
      .run();

    return { id: input.id };
  });

/**
 * Delete a club.
 *
 * Refused for the seeded `photography` slug, because the `photography-admin`
 * seat's `club:submit` grant is bound to it - deleting the club would leave
 * that identity able to submit galleries against a club that no longer exists.
 * Refused for any club that still owns content, for the orphaning reason the
 * slug cannot change either.
 */
export const deleteClub = cmsProcedure
  .input(v.object({ id: clubIdSchema }))
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select({ slug: club.slug, ...clubContentCounts })
      .from(club)
      .leftJoin(gallery, eq(gallery.club, club.slug))
      .leftJoin(event, eq(event.club, club.slug))
      .leftJoin(announcement, eq(announcement.club, club.slug))
      .leftJoin(newsPost, eq(newsPost.club, club.slug))
      .where(eq(club.id, input.id))
      .groupBy(club.id)
      .limit(1)
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Club not found" });
    }

    if (existing.slug === PRIMARY_CLUB_SLUG) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "The Photography Club is the submission seat's club and cannot be deleted.",
      });
    }

    if (hasContent(existing)) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "This club still has content attributed to it. Remove that content first.",
      });
    }

    await context.db.delete(club).where(eq(club.id, input.id)).run();

    return { id: input.id };
  });
