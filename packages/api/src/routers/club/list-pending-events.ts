import { event } from "@aloysius/db/schema/root-content";
import { asc, eq } from "drizzle-orm";

import { clubReviewerProcedure } from "../../index";

/** The reviewer's event queue, oldest first. */
export const listPendingEvents = clubReviewerProcedure.handler(
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
        submittedById: event.submittedById,
        createdAt: event.createdAt,
      })
      .from(event)
      .where(eq(event.status, "pending"))
      .orderBy(asc(event.createdAt))
      .all();

    return rows.map((row) => ({
      ...row,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }
);
