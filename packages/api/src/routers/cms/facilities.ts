import {
  facility,
  facilityIdSchema,
  facilityInsertSchema,
} from "@aloysius/db/schema/facility";
import { fileIdSchema } from "@aloysius/db/schema/files";
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/**
 * The facilities showcase on `/academics`. See `schema/facility.ts` for why
 * this table replaced the shipped `FACILITIES` array wholesale rather than
 * keeping only its photographs CMS-editable.
 */

const facilityFieldsSchema = v.object({
  ...v.pick(facilityInsertSchema, ["name", "tag", "description"]).entries,
  imageId: v.optional(v.nullable(fileIdSchema)),
  sortOrder: v.optional(v.number(), 0),
});

/**
 * Published facilities, in display order, with photographs resolved to urls.
 * There is no draft state here, the same as `achievement` and `person`: a
 * row is live the moment the College's own office publishes it.
 */
export const listFacilities = publicProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select()
    .from(facility)
    .orderBy(asc(facility.sortOrder), asc(facility.createdAt))
    .all();

  const published = rows.filter((row) => row.publishedAt !== null);
  const urls = await resolveFileUrls(
    context.db,
    published.flatMap((row) => (row.imageId ? [row.imageId] : []))
  );

  return published.map((row) => ({
    id: row.id,
    name: row.name,
    tag: row.tag,
    description: row.description,
    sortOrder: row.sortOrder,
    imageId: row.imageId,
    imageUrl: row.imageId ? (urls.get(row.imageId) ?? null) : null,
  }));
});

export const createFacility = cmsProcedure
  .input(facilityFieldsSchema)
  .handler(async ({ input, context }) => {
    const record = await context.db
      .insert(facility)
      .values({
        id: crypto.randomUUID(),
        name: input.name,
        tag: input.tag,
        description: input.description ?? null,
        imageId: input.imageId ?? null,
        sortOrder: input.sortOrder ?? 0,
        publishedAt: new Date(),
      })
      .returning({ id: facility.id })
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateFacility = cmsProcedure
  .input(v.object({ id: facilityIdSchema, ...facilityFieldsSchema.entries }))
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(facility)
      .set({
        name: input.name,
        tag: input.tag,
        description: input.description ?? null,
        imageId: input.imageId ?? null,
        sortOrder: input.sortOrder ?? 0,
      })
      .where(eq(facility.id, input.id))
      .returning({ id: facility.id })
      .get();

    if (!record) {
      throw new ORPCError("NOT_FOUND", { message: "Facility not found" });
    }

    return { id: record.id };
  });

export const deleteFacility = cmsProcedure
  .input(v.object({ id: facilityIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(facility)
      .where(eq(facility.id, input.id))
      .returning({ id: facility.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Facility not found" });
    }

    return { id: input.id };
  });
