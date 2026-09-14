import {
  staffPosition,
  staffPositionIdSchema,
} from "@aloysius/db/schema/staff";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as v from "valibot";

import { adminProcedure } from "../../index";

export const removePosition = adminProcedure
  .input(v.object({ id: staffPositionIdSchema }))
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
