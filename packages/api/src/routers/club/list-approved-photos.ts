import { clubPhoto, clubSlugSchema } from "@aloysius/db/schema/club-photos";
import { newsPost } from "@aloysius/db/schema/news-posts";
import { achievement, event } from "@aloysius/db/schema/root-content";
import { and, desc, eq } from "drizzle-orm";
import * as v from "valibot";

import { publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/**
 * The public gallery's only query. No session is required — this is the one
 * place a club photo is meant to be visible to a visitor — and the `where`
 * clause is the entire publish gate: a row reaches here if and only if
 * `status = 'approved'`, which only `reviewPhoto.ts` ever sets.
 *
 * The photo's storage key (and therefore its URL) is resolved here rather
 * than left as a bare `fileId`: `files.resolveUrls` is scoped to the
 * caller's own uploads and would refuse an anonymous visitor outright, so
 * the public gallery has no other way to turn an id into something an
 * `<img>` can load.
 *
 * `linkedContent` carries the title of whatever `setPhotoLink` attached —
 * the news post, event or achievement this photo relates to — or `null` for
 * the ordinary case of a photo that relates to nothing in particular. The
 * public page falls back to a plain gallery card when it is `null`.
 */
export const listApprovedPhotos = publicProcedure
  .input(v.object({ club: clubSlugSchema }))
  .handler(async ({ input, context }) => {
    const rows = await context.db
      .select({
        id: clubPhoto.id,
        fileId: clubPhoto.fileId,
        caption: clubPhoto.caption,
        altText: clubPhoto.altText,
        albumUrl: clubPhoto.albumUrl,
        submittedAt: clubPhoto.submittedAt,
        linkedKind: clubPhoto.linkedKind,
        linkedNewsTitle: newsPost.title,
        linkedEventTitle: event.title,
        linkedAchievementTitle: achievement.title,
      })
      .from(clubPhoto)
      .leftJoin(newsPost, eq(clubPhoto.linkedNewsId, newsPost.id))
      .leftJoin(event, eq(clubPhoto.linkedEventId, event.id))
      .leftJoin(achievement, eq(clubPhoto.linkedAchievementId, achievement.id))
      .where(
        and(eq(clubPhoto.club, input.club), eq(clubPhoto.status, "approved"))
      )
      .orderBy(desc(clubPhoto.submittedAt))
      .all();

    const urls = await resolveFileUrls(
      context.db,
      rows.map((row) => row.fileId)
    );

    return rows.map(
      ({
        linkedKind,
        linkedNewsTitle,
        linkedEventTitle,
        linkedAchievementTitle,
        ...row
      }) => {
        const linkedTitle =
          linkedNewsTitle ?? linkedEventTitle ?? linkedAchievementTitle ?? null;

        return {
          ...row,
          imageUrl: urls.get(row.fileId) ?? null,
          submittedAt: row.submittedAt.toISOString(),
          linkedContent:
            linkedKind && linkedTitle
              ? { kind: linkedKind, title: linkedTitle }
              : null,
        };
      }
    );
  });
