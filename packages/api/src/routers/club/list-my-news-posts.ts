import { newsPost } from "@aloysius/db/schema/news-posts";
import { desc, eq } from "drizzle-orm";

import { requireClubPermission } from "../../index";

/** The submitting account's own news queue, newest first. */
export const listMyNewsPosts = requireClubPermission("read").handler(
  async ({ context }) => {
    const rows = await context.db
      .select({
        id: newsPost.id,
        club: newsPost.club,
        title: newsPost.title,
        summary: newsPost.summary,
        category: newsPost.category,
        status: newsPost.status,
        createdAt: newsPost.createdAt,
        reviewedAt: newsPost.reviewedAt,
        reviewNote: newsPost.reviewNote,
      })
      .from(newsPost)
      .where(eq(newsPost.submittedById, context.session.user.id))
      .orderBy(desc(newsPost.createdAt))
      .all();

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    }));
  }
);
