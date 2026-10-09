import { clubPhoto, gallery } from "@aloysius/db/schema/club-photos";
import { asc, count, eq, inArray, desc } from "drizzle-orm";

import { requireClubPermission } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/** The caller's own galleries, all statuses, newest first - their only
 * feedback channel on what they have submitted and where it stands. */
export const listMyGalleries = requireClubPermission("read").handler(
  async ({ context }) => {
    const rows = await context.db
      .select({
        id: gallery.id,
        slug: gallery.slug,
        title: gallery.title,
        description: gallery.description,
        coverImageId: gallery.coverImageId,
        status: gallery.status,
        reviewNote: gallery.reviewNote,
        createdAt: gallery.createdAt,
        photoCount: count(clubPhoto.id),
      })
      .from(gallery)
      .leftJoin(clubPhoto, eq(clubPhoto.galleryId, gallery.id))
      .where(eq(gallery.createdById, context.session.user.id))
      .groupBy(gallery.id)
      .orderBy(desc(gallery.createdAt))
      .all();

    const galleryIds = rows.map((row) => row.id);
    const photoRows =
      galleryIds.length === 0
        ? []
        : await context.db
            .select({
              galleryId: clubPhoto.galleryId,
              fileId: clubPhoto.fileId,
            })
            .from(clubPhoto)
            .where(inArray(clubPhoto.galleryId, galleryIds))
            .orderBy(asc(clubPhoto.submittedAt))
            .all();

    const coverFileIdByGallery = new Map<string, string>();
    for (const row of photoRows) {
      if (!coverFileIdByGallery.has(row.galleryId)) {
        coverFileIdByGallery.set(row.galleryId, row.fileId);
      }
    }

    const urls = await resolveFileUrls(context.db, [
      ...rows.flatMap((row) => (row.coverImageId ? [row.coverImageId] : [])),
      ...coverFileIdByGallery.values(),
    ]);

    return rows.map(({ coverImageId, ...row }) => {
      const coverFileId =
        coverImageId ?? coverFileIdByGallery.get(row.id) ?? null;
      return {
        ...row,
        createdAt: row.createdAt.toISOString(),
        coverUrl: coverFileId ? (urls.get(coverFileId) ?? null) : null,
      };
    });
  }
);
