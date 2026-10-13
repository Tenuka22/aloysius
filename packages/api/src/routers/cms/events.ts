import { clubPhoto, gallery } from "@aloysius/db/schema/club-photos";
import { club } from "@aloysius/db/schema/clubs";
import { fileIdSchema } from "@aloysius/db/schema/files";
import { event, eventIdSchema } from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
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
 *
 * `clubName` is joined from the club table rather than derived on the client.
 * It was missing until now, and the events page filled the gap by stamping
 * "Photography Club" onto every entry - which was simply false, because events
 * carry `club: null` unless someone attributes them.
 *
 * `galleries` joins the approved galleries linked to each event through
 * `gallery.linkedEventId`. A CMS reviewer setting a gallery's "Related content"
 * to an event had no way to see that it had done anything, because this query
 * never returned the link - the control was write-only. Only `approved`
 * galleries are joined, the same gate `listApprovedGalleries` applies, so
 * linking a pending gallery to an event does not publish it.
 */
export const listEvents = publicProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select({
      id: event.id,
      club: event.club,
      clubName: club.name,
      title: event.title,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      coverImageId: event.coverImageId,
    })
    .from(event)
    .leftJoin(club, eq(event.club, club.slug))
    .orderBy(asc(event.startsAt))
    .all();

  const eventIds = rows.map((row) => row.id);

  const linkedGalleries =
    eventIds.length === 0
      ? []
      : await context.db
          .select({
            id: gallery.id,
            slug: gallery.slug,
            title: gallery.title,
            albumUrl: gallery.albumUrl,
            coverImageId: gallery.coverImageId,
            eventId: gallery.linkedEventId,
          })
          .from(gallery)
          .where(
            and(
              inArray(gallery.linkedEventId, eventIds),
              eq(gallery.status, "approved")
            )
          )
          .orderBy(desc(gallery.publishedAt))
          .all();

  /*
   * A gallery's cover, or failing that its first photograph - the fallback the
   * schema's own comment promises wherever a gallery is shown. `asc` on
   * `submittedAt` plus first-wins below means "first" means first, not last.
   */
  const galleryPhotos =
    linkedGalleries.length === 0
      ? []
      : await context.db
          .select({
            galleryId: clubPhoto.galleryId,
            fileId: clubPhoto.fileId,
          })
          .from(clubPhoto)
          .where(
            inArray(
              clubPhoto.galleryId,
              linkedGalleries.map((row) => row.id)
            )
          )
          .orderBy(asc(clubPhoto.submittedAt))
          .all();

  const firstPhotoByGallery = new Map<string, string>();
  for (const photo of galleryPhotos) {
    if (!firstPhotoByGallery.has(photo.galleryId)) {
      firstPhotoByGallery.set(photo.galleryId, photo.fileId);
    }
  }

  const galleryCoverId = (linked: (typeof linkedGalleries)[number]) =>
    linked.coverImageId ?? firstPhotoByGallery.get(linked.id) ?? null;

  const urls = await resolveFileUrls(context.db, [
    ...rows.flatMap((row) => (row.coverImageId ? [row.coverImageId] : [])),
    ...linkedGalleries.flatMap((linked) => {
      const fileId = galleryCoverId(linked);
      return fileId ? [fileId] : [];
    }),
  ]);

  const galleriesByEvent = new Map<string, typeof linkedGalleries>();
  for (const linked of linkedGalleries) {
    if (!linked.eventId) {
      continue;
    }
    const existing = galleriesByEvent.get(linked.eventId);
    if (existing) {
      existing.push(linked);
    } else {
      galleriesByEvent.set(linked.eventId, [linked]);
    }
  }

  return rows.map((row) => ({
    ...row,
    coverImageUrl: row.coverImageId
      ? (urls.get(row.coverImageId) ?? null)
      : null,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    galleries: (galleriesByEvent.get(row.id) ?? []).map((linked) => {
      const fileId = galleryCoverId(linked);
      return {
        id: linked.id,
        slug: linked.slug,
        title: linked.title,
        albumUrl: linked.albumUrl,
        coverImageUrl: fileId ? (urls.get(fileId) ?? null) : null,
      };
    }),
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
