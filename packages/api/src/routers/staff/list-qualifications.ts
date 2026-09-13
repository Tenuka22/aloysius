import { qualification } from "@aloysius/db/schema/qualifications";
import { staff } from "@aloysius/db/schema/staff";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../index";

/**
 * List qualifications.
 * Admin can see all qualifications, optionally filtered by staffId and status.
 * Regular staff can only see their own qualifications.
 */
export const listQualifications = protectedProcedure
  .input(
    z.object({
      staffId: z.string().optional(),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const isAdmin = context.session.user.role === "admin";
    const conditions = [];

    if (isAdmin && input.staffId) {
      conditions.push(eq(qualification.staffId, input.staffId));
    } else if (!isAdmin) {
      // Non-admin: only own qualifications
      const staffRecord = await context.db
        .select()
        .from(staff)
        .where(eq(staff.email, context.session.user.email))
        .get();

      if (staffRecord) {
        conditions.push(eq(qualification.staffId, staffRecord.id));
      }
    }

    if (input.status) {
      conditions.push(eq(qualification.status, input.status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await context.db
      .select({
        id: qualification.id,
        staffId: qualification.staffId,
        title: qualification.title,
        fileId: qualification.fileId,
        status: qualification.status,
        reviewedBy: qualification.reviewedBy,
        reviewNote: qualification.reviewNote,
        createdAt: qualification.createdAt,
        reviewedAt: qualification.reviewedAt,
        staffName: staff.name,
      })
      .from(qualification)
      .leftJoin(staff, eq(qualification.staffId, staff.id))
      .where(where)
      .orderBy(desc(qualification.createdAt))
      .all();

    return rows.map((row) => ({
      id: row.id,
      staffId: row.staffId,
      staffName: row.staffName,
      title: row.title,
      fileId: row.fileId,
      status: row.status,
      reviewedBy: row.reviewedBy,
      reviewNote: row.reviewNote,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    }));
  });
