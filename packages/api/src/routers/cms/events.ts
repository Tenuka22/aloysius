import { fileIdSchema } from "@aloysius/db/schema/files";
import { event, eventIdSchema } from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

const eventFieldsSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(4000)))),
  location: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200)))),
  startsAt: v.pipe(v.string(), v.isoTimestamp()),
  endsAt: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp()))),
  coverImageId: v.optional(v.nullable(fileIdSchema)),
});

const slugify = (title: string, id: string) =>
  `${title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/(?<edgeDash>^-|-$)/gu, "")
    .slice(0, 60)}-${id.slice(0, 8)}`;

/**
 * Every event, soonest-first. One query backs both the public events page
 * (which filters out ones that have already finished) and the CMS management
 * screen (which needs the past ones too, to edit or delete them).
 */
export const listEvents = publicProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      coverImageId: event.coverImageId,
    })
    .from(event)
    .orderBy(asc(event.startsAt))
    .all();

  const urls = await resolveFileUrls(
    context.db,
    rows.flatMap((row) => (row.coverImageId ? [row.coverImageId] : []))
  );

  return rows.map((row) => ({
    ...row,
    coverImageUrl: row.coverImageId
      ? (urls.get(row.coverImageId) ?? null)
      : null,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
  }));
});

/**
 * CMS staff writing an event directly - no club, no review queue. See
 * `announcements.ts`'s `createAnnouncement` for why `status` is `approved`
 * and the author stands in as their own reviewer.
 */
export const createEvent = cmsProcedure
  .input(eventFieldsSchema)
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();
    const now = new Date();
    const record = await context.db
      .insert(event)
      .values({
        id,
        club: null,
        slug: slugify(input.title, id),
        title: input.title,
        description: input.description ?? null,
        location: input.location ?? null,
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        coverImageId: input.coverImageId ?? null,
        submittedById: context.session.user.id,
        status: "approved",
        reviewedById: context.session.user.id,
        reviewedAt: now,
        publishedAt: now,
      })
      .returning()
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateEvent = cmsProcedure
  .input(v.object({ id: eventIdSchema, ...eventFieldsSchema.entries }))
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(event)
      .set({
        title: input.title,
        description: input.description ?? null,
        location: input.location ?? null,
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        coverImageId: input.coverImageId ?? null,
      })
      .where(eq(event.id, input.id))
      .returning({ id: event.id })
      .get();

    if (!record) {
      throw new ORPCError("NOT_FOUND", { message: "Event not found" });
    }

    return { id: record.id };
  });

export const deleteEvent = cmsProcedure
  .input(v.object({ id: eventIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(event)
      .where(eq(event.id, input.id))
      .returning({ id: event.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Event not found" });
    }

    return { id: input.id };
  });
