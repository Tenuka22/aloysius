import { class_ } from "@aloysius/db/schema/academics";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const assignClassTeacher = adminProcedure
  .input(
    z.object({
      classId: z.string(),
      homeroomTeacherId: z.string().optional().nullable(),
      subHomeroomTeacherId: z.string().optional().nullable(),
    })
  )
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select()
      .from(class_)
      .where(eq(class_.id, input.classId))
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Class not found" });
    }

    const record = await context.db
      .update(class_)
      .set({
        homeroomTeacherId: input.homeroomTeacherId,
        subHomeroomTeacherId: input.subHomeroomTeacherId,
      })
      .where(eq(class_.id, input.classId))
      .returning()
      .get();

    return {
      id: record.id,
      academicYearId: record.academicYearId,
      gradeLevel: record.gradeLevel,
      name: record.name,
      medium: record.medium,
      homeroomTeacherId: record.homeroomTeacherId,
      subHomeroomTeacherId: record.subHomeroomTeacherId,
      createdAt: record.createdAt.toISOString(),
    };
  });
