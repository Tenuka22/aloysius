import {
  academicYear,
  academicYearInsertSchema,
} from "@aloysius/db/schema/staff";
import { pick } from "valibot";

import { adminProcedure } from "../../index";

export const createAcademicYear = adminProcedure
  .input(pick(academicYearInsertSchema, ["year"]))
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
