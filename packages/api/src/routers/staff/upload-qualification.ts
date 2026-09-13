import { qualificationInputSchema } from "@aloysius/db/constants/schemas";
import { teacherQualification } from "@aloysius/db/schema/qualifications";
import { staff } from "@aloysius/db/schema/staff";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../index";

/**
 * Record a qualification and its supporting document.
 * Staff can upload for themselves; admin can upload for any staff member.
 * New uploads start with documentStatus "pending" requiring admin approval.
 */
export const uploadQualification = protectedProcedure
  .input(
    qualificationInputSchema.extend({
      staffId: z.string().optional(),
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
      .insert(teacherQualification)
      .values({
        id,
        staffId: targetStaffId,
        qualification: input.qualification,
        yearObtained: input.yearObtained,
        institution: input.institution,
        subjectSpecialization: input.subjectSpecialization,
        specializationCategory: input.specializationCategory,
        documentFileId: input.documentFileId,
        documentStatus: "pending",
      })
      .returning()
      .get();

    return {
      id: record.id,
      staffId: record.staffId,
      qualification: record.qualification,
      yearObtained: record.yearObtained,
      institution: record.institution,
      subjectSpecialization: record.subjectSpecialization,
      specializationCategory: record.specializationCategory,
      documentFileId: record.documentFileId,
      documentStatus: record.documentStatus,
      createdAt: record.createdAt.toISOString(),
    };
  });
