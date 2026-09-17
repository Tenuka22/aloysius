import { academicYear } from "@aloysius/db/schema/staff";
import { desc } from "drizzle-orm";

import { adminProcedure } from "../../index";

export const listAcademicYears = adminProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select()
    .from(academicYear)
    .orderBy(desc(academicYear.year))
    .all();

  return rows.map((row) => ({
    id: row.id,
    year: row.year,
    startDate: row.startDate,
    endDate: row.endDate,
    structureVersionKey: row.structureVersionKey,
    isCurrent: row.isCurrent,
    createdAt: row.createdAt.toISOString(),
  }));
});
