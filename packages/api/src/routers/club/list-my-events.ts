import { event } from "@aloysius/db/schema/root-content";
import { desc, eq } from "drizzle-orm";

import { requireClubPermission } from "../../index";

/** The submitting account's own event queue, newest first. */
export const listMyEvents = requireClubPermission("read").handler(
  async ({ context }) => {
    const rows = await context.db
      .select({
        id: event.id,
        club: event.club,
        title: event.title,
        description: event.description,
        location: event.location,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        status: event.status,
        createdAt: event.createdAt,
        reviewedAt: event.reviewedAt,
        reviewNote: event.reviewNote,
      })
      .from(event)
      .where(eq(event.submittedById, context.session.user.id))
      .orderBy(desc(event.createdAt))
      .all();

    return rows.map((row) => ({
      ...row,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    }));
  }
);
