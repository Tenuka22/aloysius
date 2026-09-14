import { staff, staffInsertSchema } from "@aloysius/db/schema/staff";
import { pick } from "valibot";

import { adminProcedure } from "../../index";
import { staffPublisher } from "./staff-publisher";

export const createStaff = adminProcedure
  .input(
    pick(staffInsertSchema, [
      "name",
      "email",
      "nic",
      "phone",
      "gender",
      "birthDate",
    ])
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
        gender: input.gender,
        birthDate: input.birthDate,
      })
      .returning()
      .get();

    const result = {
      id: record.id,
      name: record.name,
      email: record.email,
      nic: record.nic,
      phone: record.phone,
      gender: record.gender,
      birthDate: record.birthDate,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };

    await staffPublisher.publish("staff-changed", {
      type: "created",
      id: record.id,
    });

    return result;
  });
