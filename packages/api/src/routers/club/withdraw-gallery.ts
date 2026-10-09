import { galleryIdSchema, gallery } from "@aloysius/db/schema/club-photos";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import * as v from "valibot";

import { requireClubPermission } from "../../index";

/** Withdraw a still-pending gallery. Deletes the row, taking every one of its
 * photos with it via `onDelete: "cascade"` - nothing left for a reviewer to
 * act on. */
export const withdrawGallery = requireClubPermission("submit")
  .input(v.object({ id: galleryIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(gallery)
      .where(
        and(
          eq(gallery.id, input.id),
          eq(gallery.createdById, context.session.user.id),
          eq(gallery.status, "pending")
        )
      )
      .returning({ id: gallery.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", {
        message: "No pending gallery with that id belongs to this account",
      });
    }

    return { id: input.id };
  });
