import {
  subjectMark,
  subjectMarkInsertSchema,
} from "@aloysius/db/schema/marking";
import { pick } from "valibot";

import { requireMarkPermission } from "../../index";

export const enterSubjectMark = requireMarkPermission("create")
  .input(
    pick(subjectMarkInsertSchema, [
      "studentClassAssignmentId",
      "examTypeId",
      "subjectKey",
      "mark",
      "grade",
    ])
  )
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();

    const record = await context.db
      .insert(subjectMark)
      .values({
        id,
        studentClassAssignmentId: input.studentClassAssignmentId,
        examTypeId: input.examTypeId,
        subjectKey: input.subjectKey,
        mark: input.mark,
        grade: input.grade,
        enteredByStaffId: context.session.user.id,
      })
      .returning()
      .get();

    return {
      id: record.id,
      studentClassAssignmentId: record.studentClassAssignmentId,
      examTypeId: record.examTypeId,
      subjectKey: record.subjectKey,
      mark: record.mark,
      grade: record.grade,
      enteredByStaffId: record.enteredByStaffId,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  });
