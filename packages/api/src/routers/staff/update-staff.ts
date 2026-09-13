import { staff } from "@aloysius/db/schema/staff";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const updateStaff = adminProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().optional().nullable(),
      nic: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
    })
  )
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select()
      .from(staff)
      .where(eq(staff.id, input.id))
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Staff member not found" });
    }

    const { id, ...updates } = input;

    const record = await context.db
      .update(staff)
      .set(updates)
      .where(eq(staff.id, id))
      .returning()
      .get();

    return {
      id: record.id,
      name: record.name,
      email: record.email,
      nic: record.nic,
      phone: record.phone,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  });
