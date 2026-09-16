import { student, studentSelectSchema } from "@aloysius/db/schema/marking";
import { eq } from "drizzle-orm";
import { pick } from "valibot";

import { requireStudentPermission } from "../../index";

export const deleteStudent = requireStudentPermission("delete")
  .input(pick(studentSelectSchema, ["id"]))
  .handler(async ({ input, context }) => {
    const record = await context.db
      .delete(student)
      .where(eq(student.id, input.id))
      .returning()
      .get();

    return { deleted: !!record };
  });
