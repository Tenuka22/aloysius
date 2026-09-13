import { staffPosition } from "@aloysius/db/schema/staff";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const removePosition = adminProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select()
      .from(staffPosition)
      .where(eq(staffPosition.id, input.id))
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Position assignment not found",
      });
    }

    await context.db
      .delete(staffPosition)
      .where(eq(staffPosition.id, input.id))
      .run();

    return { success: true };
  });
