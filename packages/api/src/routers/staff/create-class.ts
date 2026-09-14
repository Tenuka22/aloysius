import { class_, classInsertSchema } from "@aloysius/db/schema/academics";
import { pick } from "valibot";

import { adminProcedure } from "../../index";

export const createClass = adminProcedure
  .input(
    pick(classInsertSchema, ["academicYearId", "gradeLevel", "name", "medium"])
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
