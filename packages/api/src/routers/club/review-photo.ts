import { clubPhoto, clubPhotoIdSchema } from "@aloysius/db/schema/club-photos";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as v from "valibot";

import { clubReviewerProcedure } from "../../index";

/**
 * Approve or reject a submitted photo. One `set()` call writes `status`,
 * `reviewedById` and `reviewedAt` together so the
 * `club_photo_review_fields_paired` CHECK can never be tripped by a
 * partial update — the same reasoning `approve-disposal.ts` gives for
 * writing its status/actor/timestamp triple in a single statement.
 *
 * Approving is the entire publish step: `status = 'approved'` is what
 * `listApprovedPhotos` (the public gallery's only query) selects on, so
 * there is no separate "publish" action to forget to run.
 */
export const reviewPhoto = clubReviewerProcedure
  .input(
    v.object({
      id: clubPhotoIdSchema,
      status: v.picklist(["approved", "rejected"]),
      reviewNote: v.optional(v.pipe(v.string(), v.maxLength(1000))),
    })
  )
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select({ id: clubPhoto.id, status: clubPhoto.status })
      .from(clubPhoto)
      .where(eq(clubPhoto.id, input.id))
      .limit(1)
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Submission not found" });
    }
    if (existing.status !== "pending") {
      throw new ORPCError("CONFLICT", {
        message: `This submission was already ${existing.status}`,
      });
    }

    const record = await context.db
      .update(clubPhoto)
      .set({
        status: input.status,
        reviewedById: context.session.user.id,
        reviewedAt: new Date(),
        reviewNote: input.reviewNote ?? null,
      })
      .where(eq(clubPhoto.id, input.id))
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
