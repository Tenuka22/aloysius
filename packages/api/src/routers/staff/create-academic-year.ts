import { academicYear } from "@aloysius/db/schema/staff";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const createAcademicYear = adminProcedure
  .input(z.object({ year: z.number().int().min(2000).max(2100) }))
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();

    const record = await context.db
      .insert(academicYear)
      .values({ id, year: input.year })
      .returning()
      .get();

    return {
      id: record.id,
      year: record.year,
      isCurrent: record.isCurrent,
      createdAt: record.createdAt.toISOString(),
    };
  });
