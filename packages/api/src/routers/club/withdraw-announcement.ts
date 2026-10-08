import {
  announcement,
  announcementIdSchema,
} from "@aloysius/db/schema/announcements";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import * as v from "valibot";

import { requireClubPermission } from "../../index";

/** Withdraw a still-pending announcement. Deletes the row, same reasoning as
 * `withdrawPhoto`: nothing left for a reviewer to act on. */
export const withdrawAnnouncement = requireClubPermission("submit")
  .input(v.object({ id: announcementIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(announcement)
      .where(
        and(
          eq(announcement.id, input.id),
          eq(announcement.authorId, context.session.user.id),
          eq(announcement.status, "pending")
        )
      )
      .returning({ id: announcement.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", {
        message: "No pending announcement with that id belongs to this account",
      });
    }

    return { id: input.id };
  });
