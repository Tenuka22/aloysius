import {
  gradeScale,
  gradeScaleInsertSchema,
} from "@aloysius/db/schema/marking";
import { pick } from "valibot";

import { requireExamPermission } from "../../index";

export const createGradeScale = requireExamPermission("create")
  .input(
    pick(gradeScaleInsertSchema, [
      "academicYearId",
      "subjectKey",
      "grade",
      "minMark",
      "maxMark",
    ])
  )
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();

    const record = await context.db
      .insert(gradeScale)
      .values({
        id,
        academicYearId: input.academicYearId,
        subjectKey: input.subjectKey,
        grade: input.grade,
        minMark: input.minMark,
        maxMark: input.maxMark,
      })
      .returning()
      .get();

    return {
      id: record.id,
      academicYearId: record.academicYearId,
      subjectKey: record.subjectKey,
      grade: record.grade,
      minMark: record.minMark,
      maxMark: record.maxMark,
      createdAt: record.createdAt.toISOString(),
    };
  });
