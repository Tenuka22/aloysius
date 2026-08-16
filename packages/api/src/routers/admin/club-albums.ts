import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { clubAlbums } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import { reviewActionSchema } from "../../schemas";
import { createNotification } from "../../lib/notifications";

/** Super-user tier for club album moderation. Site admin only (see admin/index.ts). */
export const adminClubAlbumsRouter = {
  /** Approve or reject an album. */
  review: adminProcedure
    .input(
      z.object({
        id: z.string(),
        action: reviewActionSchema,
        reason: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const reviewerId = context.auth.userId!;
      const db = createDb();
      const existing = await db.select().from(clubAlbums).where(eq(clubAlbums.id, input.id)).get();
      if (!existing) throw new ORPCError("NOT_FOUND", { message: "Album not found" });

      const now = new Date();
      await db
        .update(clubAlbums)
        .set({
          reviewStatus: input.action === "approve" ? "approved" : "rejected",
          status: input.action === "approve" ? "published" : "draft",
          reviewedBy: reviewerId,
          reviewedAt: now,
          rejectionReason: input.action === "reject" ? (input.reason ?? null) : null,
          updatedAt: now,
        })
        .where(eq(clubAlbums.id, input.id))
        .run();

      await createNotification({
        userId: existing.userId,
        type: input.action === "approve" ? "content_approved" : "content_rejected",
        title:
          input.action === "approve"
            ? `Photo album approved: ${existing.title}`
            : `Photo album rejected: ${existing.title}`,
        body:
          input.action === "reject"
            ? input.reason
              ? `Reason: ${input.reason}`
              : undefined
            : "Your album is now live on the club page.",
        link: `/clubs/${existing.activityId}`,
      });

      return { success: true };
    }),

  /** Toggle featured-on-homepage; only approved albums can be featured. */
  setFeatured: adminProcedure
    .input(z.object({ id: z.string(), featured: z.boolean() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db.select().from(clubAlbums).where(eq(clubAlbums.id, input.id)).get();
      if (!existing) throw new ORPCError("NOT_FOUND", { message: "Album not found" });

      if (input.featured && existing.reviewStatus !== "approved") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Only approved albums can be featured on the homepage.",
        });
      }

      await db
        .update(clubAlbums)
        .set({ featuredOnHome: input.featured, updatedAt: new Date() })
        .where(eq(clubAlbums.id, input.id))
        .run();

      return { success: true };
    }),
};
