import { staff, staffIdSchema } from "@aloysius/db/schema/staff";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as v from "valibot";

import { adminProcedure } from "../../index";
import { staffPublisher } from "./staff-publisher";

export const deleteStaff = adminProcedure
  .input(v.object({ id: staffIdSchema }))
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

    await staffPublisher.publish("staff-changed", {
      type: "deleted",
      id: input.id,
    });

    return { success: true };
  });
