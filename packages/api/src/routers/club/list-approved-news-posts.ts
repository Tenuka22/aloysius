import { clubSlugSchema } from "@aloysius/db/schema/club-photos";
import { newsPost } from "@aloysius/db/schema/news-posts";
import { and, desc, eq } from "drizzle-orm";
import * as v from "valibot";

import { publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/** The public news page's only query. No session required. */
export const listApprovedNewsPosts = publicProcedure
  .input(v.object({ club: clubSlugSchema }))
  .handler(async ({ input, context }) => {
    const rows = await context.db
      .select({
        id: newsPost.id,
        title: newsPost.title,
        summary: newsPost.summary,
        category: newsPost.category,
        coverImageId: newsPost.coverImageId,
        publishedAt: newsPost.publishedAt,
      })
      .from(newsPost)
      .where(
        and(eq(newsPost.club, input.club), eq(newsPost.status, "approved"))
      )
      .orderBy(desc(newsPost.publishedAt))
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
      publishedAt: row.publishedAt?.toISOString() ?? null,
    }));
  });
