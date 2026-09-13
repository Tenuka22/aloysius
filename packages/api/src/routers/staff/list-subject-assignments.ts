import {
  gradeLevelSchema,
  subjectKeySchema,
} from "@aloysius/db/constants/schemas";
import { subjectAssignment } from "@aloysius/db/schema/academics";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const listSubjectAssignments = adminProcedure
  .input(
    z.object({
      academicYearId: z.string(),
      staffId: z.string().optional(),
      gradeLevel: gradeLevelSchema.optional(),
      subjectKey: subjectKeySchema.optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const conditions = [
      eq(subjectAssignment.academicYearId, input.academicYearId),
    ];

    if (input.staffId) {
      conditions.push(eq(subjectAssignment.staffId, input.staffId));
    }
    if (input.gradeLevel !== undefined) {
      conditions.push(eq(subjectAssignment.gradeLevel, input.gradeLevel));
    }
    if (input.subjectKey) {
      conditions.push(eq(subjectAssignment.subjectKey, input.subjectKey));
    }

    const rows = await context.db
      .select()
      .from(subjectAssignment)
      .where(and(...conditions))
      .all();

    return rows.map((row) => ({
      id: row.id,
      staffId: row.staffId,
      academicYearId: row.academicYearId,
      subjectKey: row.subjectKey,
      gradeLevel: row.gradeLevel,
      classId: row.classId,
      createdAt: row.createdAt.toISOString(),
    }));
  });
