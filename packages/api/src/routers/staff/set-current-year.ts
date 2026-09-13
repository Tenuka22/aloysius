import { academicYear } from "@aloysius/db/schema/staff";
import { ORPCError } from "@orpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const setCurrentYear = adminProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select()
      .from(academicYear)
      .where(eq(academicYear.id, input.id))
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Academic year not found" });
    }

    // Unset all current flags
    await context.db
      .update(academicYear)
      .set({ isCurrent: false })
      .where(sql`1 = 1`)
      .run();

    // Set the selected year as current
    const record = await context.db
      .update(academicYear)
      .set({ isCurrent: true })
      .where(eq(academicYear.id, input.id))
      .returning()
      .get();

    return {
      id: record.id,
      year: record.year,
      isCurrent: record.isCurrent,
    };
  });
