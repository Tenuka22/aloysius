import { announcement } from "@aloysius/db/schema/announcements";
import { asc, eq } from "drizzle-orm";

import { clubReviewerProcedure } from "../../index";

/** The reviewer's queue, oldest first. */
export const listPendingAnnouncements = clubReviewerProcedure.handler(
  async ({ context }) => {
    const rows = await context.db
      .select({
        id: announcement.id,
        club: announcement.club,
        title: announcement.title,
        body: announcement.body,
        authorId: announcement.authorId,
        createdAt: announcement.createdAt,
      })
      .from(announcement)
      .where(eq(announcement.status, "pending"))
      .orderBy(asc(announcement.createdAt))
      .all();

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }));
  }
);
