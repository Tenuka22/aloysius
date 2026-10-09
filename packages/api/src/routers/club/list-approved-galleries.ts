import {
  clubPhoto,
  clubSlugSchema,
  gallery,
} from "@aloysius/db/schema/club-photos";
import { newsPost } from "@aloysius/db/schema/news-posts";
import { achievement, event } from "@aloysius/db/schema/root-content";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import * as v from "valibot";

import { publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/**
 * The public gallery's only query. No session is required - this is the one
 * place a club's galleries are meant to be visible to a visitor - and the
 * `where` clause is the entire publish gate: a gallery reaches here if and
 * only if `status = 'approved'`, which only `reviewGallery.ts` ever sets.
 *
 * `linkedContent` carries the title of whatever the gallery was linked to -
 * the news post, event or achievement it relates to - or `null` for the
 * ordinary case. The public page falls back to a plain gallery card when it
 * is `null`.
 */
export const listApprovedGalleries = publicProcedure
  .input(v.object({ club: clubSlugSchema }))
  .handler(async ({ input, context }) => {
    const galleries = await context.db
      .select({
        id: gallery.id,
        slug: gallery.slug,
        title: gallery.title,
        description: gallery.description,
        albumUrl: gallery.albumUrl,
        coverImageId: gallery.coverImageId,
        publishedAt: gallery.publishedAt,
        linkedKind: gallery.linkedKind,
        linkedNewsTitle: newsPost.title,
        linkedEventTitle: event.title,
        linkedAchievementTitle: achievement.title,
      })
      .from(gallery)
      .leftJoin(newsPost, eq(gallery.linkedNewsId, newsPost.id))
      .leftJoin(event, eq(gallery.linkedEventId, event.id))
      .leftJoin(achievement, eq(gallery.linkedAchievementId, achievement.id))
      .where(and(eq(gallery.club, input.club), eq(gallery.status, "approved")))
      .orderBy(desc(gallery.publishedAt))
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

    return galleries.map(
      ({
        linkedKind,
        linkedNewsTitle,
        linkedEventTitle,
        linkedAchievementTitle,
        coverImageId,
        ...row
      }) => {
        const linkedTitle =
          linkedNewsTitle ?? linkedEventTitle ?? linkedAchievementTitle ?? null;

        return {
          ...row,
          publishedAt: row.publishedAt?.toISOString() ?? null,
          coverImageUrl: coverImageId ? (urls.get(coverImageId) ?? null) : null,
          linkedContent:
            linkedKind && linkedTitle
              ? { kind: linkedKind, title: linkedTitle }
              : null,
          photos: (photosByGallery.get(row.id) ?? []).map((photo) => ({
            id: photo.id,
            caption: photo.caption,
            altText: photo.altText,
            imageUrl: urls.get(photo.fileId) ?? null,
          })),
        };
      }
    );
  });
