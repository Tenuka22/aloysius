import { qualification } from "@aloysius/db/schema/qualifications";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../../index";

/**
 * Approve or reject a qualification.
 * Admin only. Sets the reviewedBy, reviewNote, and reviewedAt fields.
 */
export const approveQualification = adminProcedure
  .input(
    z.object({
      id: z.string(),
      status: z.enum(["approved", "rejected"]),
      reviewNote: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select()
      .from(qualification)
      .where(eq(qualification.id, input.id))
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Qualification not found",
      });
    }

    const record = await context.db
      .update(qualification)
      .set({
        status: input.status,
        reviewedBy: context.session.user.id,
        reviewNote: input.reviewNote,
        reviewedAt: new Date(),
      })
      .where(eq(qualification.id, input.id))
      .returning()
      .get();

    return {
      id: record.id,
      staffId: record.staffId,
      title: record.title,
      status: record.status,
      reviewedBy: record.reviewedBy,
      reviewNote: record.reviewNote,
      reviewedAt: record.reviewedAt?.toISOString() ?? null,
    };
  });
