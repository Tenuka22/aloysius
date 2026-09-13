import { staff } from "@aloysius/db/schema/staff";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const createStaff = adminProcedure
  .input(
    z.object({
      name: z.string().min(1),
      email: z.string().optional(),
      nic: z.string().optional(),
      phone: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();

    const record = await context.db
      .insert(staff)
      .values({
        id,
        name: input.name,
        email: input.email,
        nic: input.nic,
        phone: input.phone,
      })
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
