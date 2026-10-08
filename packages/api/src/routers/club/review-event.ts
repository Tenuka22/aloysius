import { event, eventIdSchema } from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as v from "valibot";

import { clubReviewerProcedure } from "../../index";

/** Approve or reject a submitted event. One `set()` call, same reasoning as
 * `reviewAnnouncement`/`reviewPhoto`: the paired-fields CHECK can never be
 * tripped by a partial update. Approving stamps `publishedAt`. */
export const reviewEvent = clubReviewerProcedure
  .input(
    v.object({
      id: eventIdSchema,
      status: v.picklist(["approved", "rejected"]),
      reviewNote: v.optional(v.pipe(v.string(), v.maxLength(1000))),
    })
  )
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select({ id: event.id, status: event.status })
      .from(event)
      .where(eq(event.id, input.id))
      .limit(1)
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Event not found" });
    }
    if (existing.status !== "pending") {
      throw new ORPCError("CONFLICT", {
        message: `This event was already ${existing.status}`,
      });
    }

    const now = new Date();
    const record = await context.db
      .update(event)
      .set({
        status: input.status,
        reviewedById: context.session.user.id,
        reviewedAt: now,
        reviewNote: input.reviewNote ?? null,
        publishedAt: input.status === "approved" ? now : null,
      })
      .where(eq(event.id, input.id))
      .returning()
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return {
      id: record.id,
      status: record.status,
      reviewedAt: record.reviewedAt?.toISOString() ?? null,
      reviewNote: record.reviewNote,
    };
  });
