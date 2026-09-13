import { staff } from "@aloysius/db/schema/staff";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const deleteStaff = adminProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select()
      .from(staff)
      .where(eq(staff.id, input.id))
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Staff member not found" });
    }

    await context.db.delete(staff).where(eq(staff.id, input.id)).run();

    return { success: true };
  });
