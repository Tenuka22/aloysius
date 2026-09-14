import {
  subjectAssignment,
  subjectAssignmentInsertSchema,
} from "@aloysius/db/schema/academics";
import { pick } from "valibot";

import { adminProcedure } from "../../index";

export const assignSubject = adminProcedure
  .input(
    pick(subjectAssignmentInsertSchema, [
      "staffId",
      "academicYearId",
      "subjectKey",
      "gradeLevel",
      "classId",
    ])
  )
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();

    const record = await context.db
      .insert(subjectAssignment)
      .values({
        id,
        staffId: input.staffId,
        academicYearId: input.academicYearId,
        subjectKey: input.subjectKey,
        gradeLevel: input.gradeLevel,
        classId: input.classId,
      })
      .returning()
      .get();

    return {
      id: record.id,
      staffId: record.staffId,
      academicYearId: record.academicYearId,
      subjectKey: record.subjectKey,
      gradeLevel: record.gradeLevel,
      classId: record.classId,
      createdAt: record.createdAt.toISOString(),
    };
  });
