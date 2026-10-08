import { announcement } from "@aloysius/db/schema/announcements";
import { desc, eq } from "drizzle-orm";

import { requireClubPermission } from "../../index";

/** The submitting account's own queue, newest first. */
export const listMyAnnouncements = requireClubPermission("read").handler(
  async ({ context }) => {
    const rows = await context.db
      .select({
        id: announcement.id,
        club: announcement.club,
        title: announcement.title,
        body: announcement.body,
        status: announcement.status,
        createdAt: announcement.createdAt,
        reviewedAt: announcement.reviewedAt,
        reviewNote: announcement.reviewNote,
      })
      .from(announcement)
      .where(eq(announcement.authorId, context.session.user.id))
      .orderBy(desc(announcement.createdAt))
      .all();

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    }));
  }
);
