import { examType } from "@aloysius/db/schema/marking";
import { eq, asc } from "drizzle-orm";
import * as v from "valibot";

import { requireExamPermission } from "../../index";

const listExamTypesSchema = v.object({
  academicYearId: v.string(),
});

export const listExamTypes = requireExamPermission("read")
  .input(listExamTypesSchema)
  .handler(async ({ input, context }) => {
    const rows = await context.db
      .select()
      .from(examType)
      .where(eq(examType.academicYearId, input.academicYearId))
      .orderBy(asc(examType.sortOrder))
      .all();

    return rows.map((row) => ({
      id: row.id,
      academicYearId: row.academicYearId,
      name: row.name,
      category: row.category,
      maxMark: row.maxMark,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
    }));
  });
