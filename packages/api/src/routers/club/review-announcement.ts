import {
  announcement,
  announcementIdSchema,
} from "@aloysius/db/schema/announcements";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as v from "valibot";

import { clubReviewerProcedure } from "../../index";

/** Approve or reject a submitted announcement. One `set()` call, same reason
 * `reviewPhoto` gives: the paired-fields CHECK can never be tripped by a
 * partial update. Approving also stamps `publishedAt`, which is otherwise an
 * unused column on this table (see `root-content.ts`'s publish-signal
 * columns) — here it is finally what sets it. */
export const reviewAnnouncement = clubReviewerProcedure
  .input(
    v.object({
      id: announcementIdSchema,
      status: v.picklist(["approved", "rejected"]),
      reviewNote: v.optional(v.pipe(v.string(), v.maxLength(1000))),
    })
  )
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select({ id: announcement.id, status: announcement.status })
      .from(announcement)
      .where(eq(announcement.id, input.id))
      .limit(1)
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Announcement not found" });
    }
    if (existing.status !== "pending") {
      throw new ORPCError("CONFLICT", {
        message: `This announcement was already ${existing.status}`,
      });
    }

    const now = new Date();
    const record = await context.db
      .update(announcement)
      .set({
        status: input.status,
        reviewedById: context.session.user.id,
        reviewedAt: now,
        reviewNote: input.reviewNote ?? null,
        publishedAt: input.status === "approved" ? now : null,
      })
      .where(eq(announcement.id, input.id))
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
