import { gradeLevelSchema, mediumSchema } from "@aloysius/db/constants/schemas";
import { class_ } from "@aloysius/db/schema/academics";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const createClass = adminProcedure
  .input(
    z.object({
      academicYearId: z.string(),
      gradeLevel: gradeLevelSchema,
      name: z.string().min(1),
      medium: mediumSchema.default("sinhala"),
    })
  )
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();

    const record = await context.db
      .insert(class_)
      .values({
        id,
        academicYearId: input.academicYearId,
        gradeLevel: input.gradeLevel,
        name: input.name,
        medium: input.medium,
      })
      .returning()
      .get();

    return {
      id: record.id,
      academicYearId: record.academicYearId,
      gradeLevel: record.gradeLevel,
      name: record.name,
      medium: record.medium,
      homeroomTeacherId: record.homeroomTeacherId,
      subHomeroomTeacherId: record.subHomeroomTeacherId,
      createdAt: record.createdAt.toISOString(),
    };
  });
