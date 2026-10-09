import { galleryIdSchema, gallery } from "@aloysius/db/schema/club-photos";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as v from "valibot";

import { clubReviewerProcedure } from "../../index";

/**
 * Approve or reject a submitted gallery - one decision for the whole batch
 * of photos, not one per photo. One `set()` call writes `status`,
 * `reviewedById` and `reviewedAt` together so `gallery_review_fields_paired`
 * can never be tripped by a partial update. Approving is the entire publish
 * step: `status = 'approved'` is what `listApprovedGalleries` selects on.
 */
export const reviewGallery = clubReviewerProcedure
  .input(
    v.object({
      id: galleryIdSchema,
      status: v.picklist(["approved", "rejected"]),
      reviewNote: v.optional(v.pipe(v.string(), v.maxLength(1000))),
    })
  )
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select({ id: gallery.id, status: gallery.status })
      .from(gallery)
      .where(eq(gallery.id, input.id))
      .limit(1)
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
    }
    if (existing.status !== "pending") {
      throw new ORPCError("CONFLICT", {
        message: `This gallery was already ${existing.status}`,
      });
    }

    const now = new Date();
    const record = await context.db
      .update(gallery)
      .set({
        status: input.status,
        reviewedById: context.session.user.id,
        reviewedAt: now,
        reviewNote: input.reviewNote ?? null,
        publishedAt: input.status === "approved" ? now : null,
      })
      .where(eq(gallery.id, input.id))
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
