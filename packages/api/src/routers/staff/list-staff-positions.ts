import { staffPosition } from "@aloysius/db/schema/staff";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const listStaffPositions = adminProcedure
  .input(
    z.object({
      academicYearId: z.string(),
      staffId: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const conditions = [eq(staffPosition.academicYearId, input.academicYearId)];

    if (input.staffId) {
      conditions.push(eq(staffPosition.staffId, input.staffId));
    }

    const rows = await context.db
      .select()
      .from(staffPosition)
      .where(and(...conditions))
      .all();

    return rows.map((row) => ({
      id: row.id,
      staffId: row.staffId,
      academicYearId: row.academicYearId,
      position: row.position,
      sectionalScope: row.sectionalScope,
      createdAt: row.createdAt.toISOString(),
    }));
  });
