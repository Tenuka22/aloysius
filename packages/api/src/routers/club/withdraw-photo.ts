import { clubPhoto, clubPhotoIdSchema } from "@aloysius/db/schema/club-photos";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import * as v from "valibot";

import { requireClubPermission } from "../../index";

/**
 * Withdraw a still-pending submission. Deletes the row rather than adding a
 * fourth status: a withdrawn submission has nothing left for a reviewer to
 * act on, and `listMyPhotos` has no use for a row it would only ever filter
 * back out. Only the submitter may withdraw, and only before a reviewer has
 * decided — once `status` leaves `pending` the decision (and its
 * `reviewNote`) is the record worth keeping.
 */
export const withdrawPhoto = requireClubPermission("submit")
  .input(v.object({ id: clubPhotoIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(clubPhoto)
      .where(
        and(
          eq(clubPhoto.id, input.id),
          eq(clubPhoto.submittedById, context.session.user.id),
          eq(clubPhoto.status, "pending")
        )
      )
      .returning({ id: clubPhoto.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", {
        message: "No pending submission with that id belongs to this account",
      });
    }

    return { id: input.id };
  });
