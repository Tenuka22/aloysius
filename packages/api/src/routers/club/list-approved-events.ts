import { clubSlugSchema } from "@aloysius/db/schema/club-photos";
import { event } from "@aloysius/db/schema/root-content";
import { and, asc, eq, gte } from "drizzle-orm";
import * as v from "valibot";

import { publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/** The public events page's only query: approved events, soonest first,
 * excluding events that have already finished. No session required. */
export const listApprovedEvents = publicProcedure
  .input(v.object({ club: clubSlugSchema }))
  .handler(async ({ input, context }) => {
    const now = new Date();
    const rows = await context.db
      .select({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        coverImageId: event.coverImageId,
      })
      .from(event)
      .where(
        and(
          eq(event.club, input.club),
          eq(event.status, "approved"),
          gte(event.startsAt, now)
        )
      )
      .orderBy(asc(event.startsAt))
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
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt?.toISOString() ?? null,
    }));
  });
