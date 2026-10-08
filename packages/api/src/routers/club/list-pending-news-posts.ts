import { newsPost } from "@aloysius/db/schema/news-posts";
import { asc, eq } from "drizzle-orm";

import { clubReviewerProcedure } from "../../index";

/** The reviewer's news queue, oldest first. */
export const listPendingNewsPosts = clubReviewerProcedure.handler(
  async ({ context }) => {
    const rows = await context.db
      .select({
        id: newsPost.id,
        club: newsPost.club,
        title: newsPost.title,
        summary: newsPost.summary,
        body: newsPost.body,
        category: newsPost.category,
        coverImageId: newsPost.coverImageId,
        submittedById: newsPost.submittedById,
        createdAt: newsPost.createdAt,
      })
      .from(newsPost)
      .where(eq(newsPost.status, "pending"))
      .orderBy(asc(newsPost.createdAt))
      .all();

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }));
  }
);
