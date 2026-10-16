import {
  ALUMNI_NOTABLE_CATEGORIES,
  alumniNotable,
  alumniNotableIdSchema,
} from "@aloysius/db/schema/alumni-notables";
import { fileIdSchema } from "@aloysius/db/schema/files";
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/**
 * The Hall of Fame on `/alumni`: any number of distinguished Aloysians per
 * category, each with a photo, name, and optional role. Replaces
 * `ALUMNI_NOTABLES`, a fixed four-row array that held exactly one name per
 * category. See `academic-heads.ts` for why `publishedAt` is set on create:
 * this is published by the College's own office, so there is nothing here
 * for a second person to check.
 */

const alumniNotableFieldsSchema = v.object({
  category: v.picklist(ALUMNI_NOTABLE_CATEGORIES),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  role: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(120)))),
  imageId: v.optional(v.nullable(fileIdSchema)),
});

/** Published notables, grouped by category then name, with photos resolved to urls. */
export const listAlumniNotables = publicProcedure.handler(
  async ({ context }) => {
    const rows = await context.db
      .select()
      .from(alumniNotable)
      .orderBy(asc(alumniNotable.category), asc(alumniNotable.name))
      .all();

    const published = rows.filter((row) => row.publishedAt !== null);
    const urls = await resolveFileUrls(
      context.db,
      published.flatMap((row) => (row.imageId ? [row.imageId] : []))
    );

    return published.map((row) => ({
      id: row.id,
      category: row.category,
      name: row.name,
      role: row.role,
      imageId: row.imageId,
      imageUrl: row.imageId ? (urls.get(row.imageId) ?? null) : null,
    }));
  }
);

export const createAlumniNotable = cmsProcedure
  .input(alumniNotableFieldsSchema)
  .handler(async ({ input, context }) => {
    const record = await context.db
      .insert(alumniNotable)
      .values({
        id: crypto.randomUUID(),
        category: input.category,
        name: input.name,
        role: input.role ?? null,
        imageId: input.imageId ?? null,
        publishedAt: new Date(),
      })
      .returning({ id: alumniNotable.id })
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateAlumniNotable = cmsProcedure
  .input(
    v.object({
      id: alumniNotableIdSchema,
      ...alumniNotableFieldsSchema.entries,
    })
  )
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(alumniNotable)
      .set({
        category: input.category,
        name: input.name,
        role: input.role ?? null,
        imageId: input.imageId ?? null,
      })
      .where(eq(alumniNotable.id, input.id))
      .returning({ id: alumniNotable.id })
      .get();

    if (!record) {
      throw new ORPCError("NOT_FOUND", { message: "Alumni notable not found" });
    }

    return { id: record.id };
  });

export const deleteAlumniNotable = cmsProcedure
  .input(v.object({ id: alumniNotableIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(alumniNotable)
      .where(eq(alumniNotable.id, input.id))
      .returning({ id: alumniNotable.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Alumni notable not found" });
    }

    return { id: input.id };
  });
