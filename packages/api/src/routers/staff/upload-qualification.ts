import { qualification } from "@aloysius/db/schema/qualifications";
import { staff } from "@aloysius/db/schema/staff";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../index";

/**
 * Upload a qualification/certification.
 * Staff can upload for themselves; admin can upload for any staff member.
 * New uploads start with status "pending" requiring admin approval.
 */
export const uploadQualification = protectedProcedure
  .input(
    z.object({
      staffId: z.string().optional(),
      title: z.string().min(1),
      fileId: z.string().min(1),
    })
  )
  .handler(async ({ input, context }) => {
    const isAdmin = context.session.user.role === "admin";

    // Determine target staff ID
    const targetStaffId = input.staffId;
    if (!targetStaffId) {
      if (!isAdmin) {
        throw new ORPCError("FORBIDDEN", {
          message: "staffId is required for non-admin users",
        });
      }
      throw new ORPCError("BAD_REQUEST", {
        message: "staffId is required",
      });
    }

    // Non-admin users can only upload for themselves
    if (!isAdmin) {
      const staffRecord = await context.db
        .select()
        .from(staff)
        .where(eq(staff.email, context.session.user.email))
        .get();

      if (!staffRecord || staffRecord.id !== targetStaffId) {
        throw new ORPCError("FORBIDDEN", {
          message: "You can only upload qualifications for yourself",
        });
      }
    }

    const id = crypto.randomUUID();

    const record = await context.db
      .insert(qualification)
      .values({
        id,
        staffId: targetStaffId,
        title: input.title,
        fileId: input.fileId,
        status: "pending",
      })
      .returning()
      .get();

    return {
      id: record.id,
      staffId: record.staffId,
      title: record.title,
      fileId: record.fileId,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
    };
  });
