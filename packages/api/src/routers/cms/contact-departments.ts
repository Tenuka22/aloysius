import {
  contactDepartment,
  contactDepartmentIdSchema,
} from "@aloysius/db/schema/contact-department";
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";

/**
 * The "Reach the right office" directory on `/contact`, and the department
 * emails `contact-form.tsx`'s `resolveRecipient` routes enquiries to.
 * Replaces `CONTACT_DEPARTMENTS`, a fixed six-row array in
 * `packages/ui/src/content/contact.ts`. See `contact-department.ts` for why
 * `id` is the department's own slug rather than a generated key.
 */

const contactDepartmentIdInputSchema = v.pipe(
  v.string(),
  v.regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u,
    "Lowercase words separated by single hyphens."
  )
);

const contactDepartmentWritableFieldsSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(500)))),
  telephone: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(40)))),
  email: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200)))),
  sortOrder: v.optional(v.nullable(v.number())),
});

/** Published departments, in display order, for the public directory and the form. */
export const listContactDepartments = publicProcedure.handler(
  async ({ context }) => {
    const rows = await context.db
      .select()
      .from(contactDepartment)
      .orderBy(asc(contactDepartment.sortOrder), asc(contactDepartment.name))
      .all();

    return rows.filter((row) => row.publishedAt !== null);
  }
);

export const createContactDepartment = cmsProcedure
  .input(
    v.object({
      id: contactDepartmentIdInputSchema,
      ...contactDepartmentWritableFieldsSchema.entries,
    })
  )
  .handler(async ({ input, context }) => {
    const clash = await context.db
      .select({ id: contactDepartment.id })
      .from(contactDepartment)
      .where(eq(contactDepartment.id, input.id))
      .limit(1)
      .get();

    if (clash) {
      throw new ORPCError("CONFLICT", {
        message: `A department with the id "${input.id}" already exists`,
      });
    }

    await context.db
      .insert(contactDepartment)
      .values({
        id: input.id,
        name: input.name,
        description: input.description ?? null,
        telephone: input.telephone ?? null,
        email: input.email ?? null,
        sortOrder: input.sortOrder ?? null,
        publishedAt: new Date(),
      })
      .run();

    return { id: input.id };
  });

export const updateContactDepartment = cmsProcedure
  .input(
    v.object({
      id: contactDepartmentIdSchema,
      ...contactDepartmentWritableFieldsSchema.entries,
    })
  )
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select({ id: contactDepartment.id })
      .from(contactDepartment)
      .where(eq(contactDepartment.id, input.id))
      .limit(1)
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND");
    }

    await context.db
      .update(contactDepartment)
      .set({
        name: input.name,
        description: input.description ?? null,
        telephone: input.telephone ?? null,
        email: input.email ?? null,
        sortOrder: input.sortOrder ?? null,
      })
      .where(eq(contactDepartment.id, input.id))
      .run();

    return { id: input.id };
  });

export const deleteContactDepartment = cmsProcedure
  .input(v.object({ id: contactDepartmentIdSchema }))
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select({ id: contactDepartment.id })
      .from(contactDepartment)
      .where(eq(contactDepartment.id, input.id))
      .limit(1)
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND");
    }

    await context.db
      .delete(contactDepartment)
      .where(eq(contactDepartment.id, input.id))
      .run();

    return { id: input.id };
  });
