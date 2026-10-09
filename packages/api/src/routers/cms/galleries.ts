import {
  clubPhoto,
  gallery,
  galleryIdSchema,
  galleryLinkKindSchema,
} from "@aloysius/db/schema/club-photos";
import { fileIdSchema } from "@aloysius/db/schema/files";
import { newsPost } from "@aloysius/db/schema/news-posts";
import { achievement, event } from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import { asc, desc, eq, inArray } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

const slugify = (title: string, id: string) =>
  `${title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/(?<edgeDash>^-|-$)/gu, "")
    .slice(0, 60)}-${id.slice(0, 8)}`;

const photoSchema = v.object({
  fileId: fileIdSchema,
  caption: v.pipe(v.string(), v.minLength(1), v.maxLength(280)),
  altText: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
});

const linkFieldsSchema = v.object({
  linkedKind: v.optional(v.nullable(galleryLinkKindSchema)),
  linkedId: v.optional(v.nullable(v.pipe(v.string(), v.minLength(1)))),
});

const galleryFieldsSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2000)))),
  albumUrl: v.optional(
    v.nullable(
      v.pipe(
        v.string(),
        v.url(),
        v.regex(/^https?:\/\//u, "Must be an http or https URL")
      )
    )
  ),
  coverImageId: v.optional(v.nullable(fileIdSchema)),
  photos: v.pipe(v.array(photoSchema), v.minLength(1), v.maxLength(5)),
  ...linkFieldsSchema.entries,
});

/**
 * Every gallery, regardless of status or origin - CMS-authored and already
 * live, or club-submitted and pending/approved/rejected. This is the CMS
 * management screen's one query: pending club-submitted rows get an
 * Approve/Reject action (`club.reviewGallery`), everything else gets
 * Edit/Delete.
 */
export const listGalleries = cmsProcedure.handler(async ({ context }) => {
  const galleries = await context.db
    .select({
      id: gallery.id,
      slug: gallery.slug,
      club: gallery.club,
      title: gallery.title,
      description: gallery.description,
      albumUrl: gallery.albumUrl,
      coverImageId: gallery.coverImageId,
      status: gallery.status,
      createdById: gallery.createdById,
      createdAt: gallery.createdAt,
      reviewNote: gallery.reviewNote,
      linkedKind: gallery.linkedKind,
      linkedNewsTitle: newsPost.title,
      linkedEventTitle: event.title,
      linkedAchievementTitle: achievement.title,
      linkedNewsId: gallery.linkedNewsId,
      linkedEventId: gallery.linkedEventId,
      linkedAchievementId: gallery.linkedAchievementId,
    })
    .from(gallery)
    .leftJoin(newsPost, eq(gallery.linkedNewsId, newsPost.id))
    .leftJoin(event, eq(gallery.linkedEventId, event.id))
    .leftJoin(achievement, eq(gallery.linkedAchievementId, achievement.id))
    .orderBy(desc(gallery.createdAt))
    .all();

  const galleryIds = galleries.map((row) => row.id);
  const photoRows =
    galleryIds.length === 0
      ? []
      : await context.db
          .select({
            id: clubPhoto.id,
            galleryId: clubPhoto.galleryId,
            fileId: clubPhoto.fileId,
            caption: clubPhoto.caption,
            altText: clubPhoto.altText,
          })
          .from(clubPhoto)
          .where(inArray(clubPhoto.galleryId, galleryIds))
          .orderBy(asc(clubPhoto.submittedAt))
          .all();

  const urls = await resolveFileUrls(context.db, [
    ...photoRows.map((row) => row.fileId),
    ...galleries.flatMap((row) => (row.coverImageId ? [row.coverImageId] : [])),
  ]);

  const photosByGallery = new Map<string, typeof photoRows>();
  for (const row of photoRows) {
    const existing = photosByGallery.get(row.galleryId);
    if (existing) {
      existing.push(row);
    } else {
      photosByGallery.set(row.galleryId, [row]);
    }
  }

  return galleries.map(
    ({ linkedNewsTitle, linkedEventTitle, linkedAchievementTitle, ...row }) => {
      const linkedTitle =
        linkedNewsTitle ?? linkedEventTitle ?? linkedAchievementTitle ?? null;

      return {
        ...row,
        createdAt: row.createdAt.toISOString(),
        linkedTitle,
        coverImageUrl: row.coverImageId
          ? (urls.get(row.coverImageId) ?? null)
          : null,
        photos: (photosByGallery.get(row.id) ?? []).map((photo) => ({
          id: photo.id,
          fileId: photo.fileId,
          caption: photo.caption,
          altText: photo.altText,
          imageUrl: urls.get(photo.fileId) ?? null,
        })),
      };
    }
  );
});

/**
 * CMS staff creating a gallery directly - no club, no review queue. The
 * author stands in as their own reviewer so `gallery_review_fields_paired`
 * still holds, and the gallery is live (`status: 'approved'`) the instant
 * it is created.
 */
export const createGallery = cmsProcedure
  .input(galleryFieldsSchema)
  .handler(async ({ input, context }) => {
    if (input.linkedKind && !input.linkedId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "linkedId is required when linkedKind is set",
      });
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const record = await context.db
      .insert(gallery)
      .values({
        id,
        club: null,
        slug: slugify(input.title, id),
        title: input.title,
        description: input.description ?? null,
        albumUrl: input.albumUrl ?? null,
        coverImageId: input.coverImageId ?? null,
        createdById: context.session.user.id,
        status: "approved",
        reviewedById: context.session.user.id,
        reviewedAt: now,
        publishedAt: now,
        linkedKind: input.linkedKind ?? null,
        linkedNewsId: input.linkedKind === "news" ? input.linkedId : null,
        linkedEventId: input.linkedKind === "event" ? input.linkedId : null,
        linkedAchievementId:
          input.linkedKind === "achievement" ? input.linkedId : null,
      })
      .returning()
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    await context.db.insert(clubPhoto).values(
      input.photos.map((photo) => ({
        id: crypto.randomUUID(),
        galleryId: record.id,
        fileId: photo.fileId,
        caption: photo.caption,
        altText: photo.altText,
        submittedById: context.session.user.id,
      }))
    );

    return { id: record.id };
  });

/**
 * Replace a gallery's fields and its entire photo set. Editing is a full
 * resubmission rather than a patch - the edit dialog is always pre-filled
 * with the current state, so there is nothing a partial update would save
 * that a full one doesn't already have.
 */
export const updateGallery = cmsProcedure
  .input(v.object({ id: galleryIdSchema, ...galleryFieldsSchema.entries }))
  .handler(async ({ input, context }) => {
    if (input.linkedKind && !input.linkedId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "linkedId is required when linkedKind is set",
      });
    }

    const existing = await context.db
      .select({ id: gallery.id })
      .from(gallery)
      .where(eq(gallery.id, input.id))
      .limit(1)
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
    }

    await context.db
      .update(gallery)
      .set({
        title: input.title,
        description: input.description ?? null,
        albumUrl: input.albumUrl ?? null,
        coverImageId: input.coverImageId ?? null,
        linkedKind: input.linkedKind ?? null,
        linkedNewsId: input.linkedKind === "news" ? input.linkedId : null,
        linkedEventId: input.linkedKind === "event" ? input.linkedId : null,
        linkedAchievementId:
          input.linkedKind === "achievement" ? input.linkedId : null,
      })
      .where(eq(gallery.id, input.id))
      .run();

    await context.db
      .delete(clubPhoto)
      .where(eq(clubPhoto.galleryId, input.id))
      .run();

    await context.db.insert(clubPhoto).values(
      input.photos.map((photo) => ({
        id: crypto.randomUUID(),
        galleryId: input.id,
        fileId: photo.fileId,
        caption: photo.caption,
        altText: photo.altText,
        submittedById: context.session.user.id,
      }))
    );

    return { id: input.id };
  });

export const deleteGallery = cmsProcedure
  .input(v.object({ id: galleryIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(gallery)
      .where(eq(gallery.id, input.id))
      .returning({ id: gallery.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
    }

    return { id: input.id };
  });
