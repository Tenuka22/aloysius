import { clubPhoto, gallery } from "@aloysius/db/schema/club-photos";
import { asc, eq, inArray } from "drizzle-orm";

import { clubReviewerProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/** The reviewer's queue: every pending gallery, oldest first, each with its
 * full photo set (so the reviewer can actually look at what they're
 * approving) — the same ordering as the photo queue this replaced. */
export const listPendingGalleries = clubReviewerProcedure.handler(
  async ({ context }) => {
    const galleries = await context.db
      .select({
        id: gallery.id,
        slug: gallery.slug,
        club: gallery.club,
        title: gallery.title,
        description: gallery.description,
        albumUrl: gallery.albumUrl,
        coverImageId: gallery.coverImageId,
        createdById: gallery.createdById,
        createdAt: gallery.createdAt,
        linkedKind: gallery.linkedKind,
        linkedNewsId: gallery.linkedNewsId,
        linkedEventId: gallery.linkedEventId,
        linkedAchievementId: gallery.linkedAchievementId,
      })
      .from(gallery)
      .where(eq(gallery.status, "pending"))
      .orderBy(asc(gallery.createdAt))
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
            .all();

    const urls = await resolveFileUrls(context.db, [
      ...photoRows.map((row) => row.fileId),
      ...galleries.flatMap((row) =>
        row.coverImageId ? [row.coverImageId] : []
      ),
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

    return galleries.map(({ coverImageId, ...row }) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      coverImageUrl: coverImageId ? (urls.get(coverImageId) ?? null) : null,
      photos: (photosByGallery.get(row.id) ?? []).map((photo) => ({
        id: photo.id,
        caption: photo.caption,
        altText: photo.altText,
        imageUrl: urls.get(photo.fileId) ?? null,
      })),
    }));
  }
);
