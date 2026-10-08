import { event, eventIdSchema } from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import * as v from "valibot";

import { requireClubPermission } from "../../index";

/** Withdraw a still-pending event. */
export const withdrawEvent = requireClubPermission("submit")
  .input(v.object({ id: eventIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(event)
      .where(
        and(
          eq(event.id, input.id),
          eq(event.submittedById, context.session.user.id),
          eq(event.status, "pending")
        )
      )
      .returning({ id: event.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", {
        message: "No pending event with that id belongs to this account",
      });
    }

    return { id: input.id };
  });
