import { gradeLevelSchema } from "@aloysius/db/constants/schemas";
import { class_ } from "@aloysius/db/schema/academics";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const listClasses = adminProcedure
  .input(
    z.object({
      academicYearId: z.string(),
      gradeLevel: gradeLevelSchema.optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const conditions = [eq(class_.academicYearId, input.academicYearId)];

    if (input.gradeLevel !== undefined) {
      conditions.push(eq(class_.gradeLevel, input.gradeLevel));
    }

    const rows = await context.db
      .select()
      .from(class_)
      .where(and(...conditions))
      .all();

    return rows.map((row) => ({
      id: row.id,
      academicYearId: row.academicYearId,
      gradeLevel: row.gradeLevel,
      name: row.name,
      medium: row.medium,
      homeroomTeacherId: row.homeroomTeacherId,
      subHomeroomTeacherId: row.subHomeroomTeacherId,
      createdAt: row.createdAt.toISOString(),
    }));
  });
