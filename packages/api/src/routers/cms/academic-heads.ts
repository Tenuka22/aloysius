import { fileIdSchema } from "@aloysius/db/schema/files";
import { person, personIdSchema } from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/**
 * The academic heads shown on `/about`: who leads each part of the College.
 *
 * Backed by the `person` table, which has sat in the schema since the first
 * migration carrying exactly these columns - `name`, `role`, `bio`, `imageId`,
 * `publishedAt` - with no caller anywhere in the application. Rather than add a
 * near-identical table, this is what that table was evidently waiting for.
 *
 * One list, published in the order it is stored. There is no `status` and no
 * review queue, for the same reason announcements and news posts have none: a
 * head of department is appointed by the College and published by the College's
 * own office. `publishedAt` is set on create and is what the public list filters
 * on, so a row written directly can be held back by clearing it.
 */

const personFieldsSchema = v.object({
  slug: v.pipe(
    v.string(),
    v.minLength(1),
    v.maxLength(80),
    v.regex(/^[a-z0-9-]+$/u, "Lowercase letters, numbers and dashes only")
  ),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  role: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(120)))),
  bio: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2000)))),
  imageId: v.optional(v.nullable(fileIdSchema)),
});

/** Published people, in order, with their photographs resolved to urls. */
export const listAcademicHeads = publicProcedure.handler(
  async ({ context }) => {
    const rows = await context.db
      .select()
      .from(person)
      .orderBy(asc(person.createdAt))
      .all();

    const published = rows.filter((row) => row.publishedAt !== null);
    const urls = await resolveFileUrls(
      context.db,
      published.flatMap((row) => (row.imageId ? [row.imageId] : []))
    );

    return published.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      role: row.role,
      bio: row.bio,
      imageId: row.imageId,
      imageUrl: row.imageId ? (urls.get(row.imageId) ?? null) : null,
    }));
  }
);

export const createAcademicHead = cmsProcedure
  .input(personFieldsSchema)
  .handler(async ({ input, context }) => {
    const record = await context.db
      .insert(person)
      .values({
        id: crypto.randomUUID(),
        slug: input.slug,
        name: input.name,
        role: input.role ?? null,
        bio: input.bio ?? null,
        imageId: input.imageId ?? null,
        /*
         * Live immediately. Every other CMS-direct content type stands the
         * author in as their own reviewer and sets `publishedAt` to now; there
         * is nothing here for a second person to check.
         */
        publishedAt: new Date(),
      })
      .returning({ id: person.id })
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateAcademicHead = cmsProcedure
  .input(v.object({ id: personIdSchema, ...personFieldsSchema.entries }))
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(person)
      .set({
        slug: input.slug,
        name: input.name,
        role: input.role ?? null,
        bio: input.bio ?? null,
        imageId: input.imageId ?? null,
      })
      .where(eq(person.id, input.id))
      .returning({ id: person.id })
      .get();

    if (!record) {
      throw new ORPCError("NOT_FOUND", { message: "Person not found" });
    }

    return { id: record.id };
  });

export const deleteAcademicHead = cmsProcedure
  .input(v.object({ id: personIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(person)
      .where(eq(person.id, input.id))
      .returning({ id: person.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Person not found" });
    }

    return { id: input.id };
  });
