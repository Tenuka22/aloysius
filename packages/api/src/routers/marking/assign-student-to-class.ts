import {
  studentClassAssignment,
  studentClassAssignmentInsertSchema,
} from "@aloysius/db/schema/marking";
import { pick } from "valibot";

import { requireAssignmentPermission } from "../../index";

export const assignStudentToClass = requireAssignmentPermission("create")
  .input(
    pick(studentClassAssignmentInsertSchema, [
      "studentId",
      "academicYearId",
      "classId",
    ])
  )
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();

    const record = await context.db
      .insert(studentClassAssignment)
      .values({
        id,
        studentId: input.studentId,
        academicYearId: input.academicYearId,
        classId: input.classId,
      })
      .returning()
      .get();

    return {
      id: record.id,
      studentId: record.studentId,
      academicYearId: record.academicYearId,
      classId: record.classId,
      createdAt: record.createdAt.toISOString(),
    };
  });
