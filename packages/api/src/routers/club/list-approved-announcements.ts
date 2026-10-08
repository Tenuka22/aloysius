import { announcement } from "@aloysius/db/schema/announcements";
import { clubSlugSchema } from "@aloysius/db/schema/club-photos";
import { and, desc, eq } from "drizzle-orm";
import * as v from "valibot";

import { publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/** The public notices page's only query. No session required. */
export const listApprovedAnnouncements = publicProcedure
  .input(v.object({ club: clubSlugSchema }))
  .handler(async ({ input, context }) => {
    const rows = await context.db
      .select({
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        isPinned: announcement.isPinned,
        imageId: announcement.imageId,
        publishedAt: announcement.publishedAt,
      })
      .from(announcement)
      .where(
        and(
          eq(announcement.club, input.club),
          eq(announcement.status, "approved")
        )
      )
      .orderBy(desc(announcement.publishedAt))
      .all();

    const urls = await resolveFileUrls(
      context.db,
      rows.flatMap((row) => (row.imageId ? [row.imageId] : []))
    );

    return rows.map((row) => ({
      ...row,
      imageUrl: row.imageId ? (urls.get(row.imageId) ?? null) : null,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    }));
  });
