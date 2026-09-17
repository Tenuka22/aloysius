import {
  student,
  studentAdmission,
  studentClassAssignment,
  studentClassAssignmentInsertSchema,
} from "@aloysius/db/schema/marking";
import { count, eq } from "drizzle-orm";
import { pick } from "valibot";

import { requireAssignmentPermission } from "../../index";

/**
 * A student progressing to the next grade in a later year is just a new
 * studentClassAssignment row, not a fresh admission event. A studentAdmission
 * record is only created the very first time a student is ever assigned to
 * any class, using the admission details already recorded on the permanent
 * student row, so grade 7-11 continuation never re-registers the student.
 */
export const assignStudentToClass = requireAssignmentPermission("create")
  .input(
    pick(studentClassAssignmentInsertSchema, [
      "studentId",
      "academicYearId",
      "classId",
    ])
  )
  .handler(async ({ input, context }) => {
    const priorAssignments = await context.db
      .select({ n: count() })
      .from(studentClassAssignment)
      .where(eq(studentClassAssignment.studentId, input.studentId))
      .get();
    const isFirstAssignment = (priorAssignments?.n ?? 0) === 0;

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

    if (isFirstAssignment) {
      const studentRow = await context.db
        .select({
          admissionType: student.admissionType,
          birthCertificateNumber: student.birthCertificateNumber,
        })
        .from(student)
        .where(eq(student.id, input.studentId))
        .get();

      if (studentRow?.admissionType) {
        await context.db
          .insert(studentAdmission)
          .values({
            id: crypto.randomUUID(),
            studentId: input.studentId,
            academicYearId: input.academicYearId,
            admissionType: studentRow.admissionType,
            birthCertificateNumber: studentRow.birthCertificateNumber,
          })
          .run();
      }
    }

    return {
      id: record.id,
      studentId: record.studentId,
      academicYearId: record.academicYearId,
      classId: record.classId,
      createdAt: record.createdAt.toISOString(),
    };
  });
