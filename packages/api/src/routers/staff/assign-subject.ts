import {
  gradeLevelSchema,
  subjectKeySchema,
} from "@aloysius/db/constants/schemas";
import { subjectAssignment } from "@aloysius/db/schema/academics";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const assignSubject = adminProcedure
  .input(
    z.object({
      staffId: z.string(),
      academicYearId: z.string(),
      subjectKey: subjectKeySchema,
      gradeLevel: gradeLevelSchema,
      classId: z.string().optional(),
    })
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
