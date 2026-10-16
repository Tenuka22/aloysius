import { fileIdSchema } from "@aloysius/db/schema/files";
import { sportTile, sportTileIdSchema } from "@aloysius/db/schema/sport-tile";
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/**
 * The "On the Field" sports mosaic on `/students`: any number of sports,
 * each with its own photograph. Replaces `SPORT_TILES`, a fixed three-row
 * array that could hold exactly Cricket, Rugby and Athletics. Published
 * like `alumni-branches.ts`, with no review queue - this is the College's
 * own office publishing its own sports list.
 *
 * `span` is not a column: the mosaic's hero ("feature") tile is always
 * whichever published row sorts first, every other tile a smaller
 * ("third") cell, derived positionally by the public page rather than
 * chosen per row - see `apps/web/src/routes/students.tsx`.
 */

const sportTileFieldsSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
  imageId: v.optional(v.nullable(fileIdSchema)),
  sortOrder: v.optional(v.number(), 0),
});

/** Published sport tiles, ordered for display, photographs resolved to urls. */
export const listSportTiles = publicProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select()
    .from(sportTile)
    .orderBy(asc(sportTile.sortOrder), asc(sportTile.name))
    .all();

  const published = rows.filter((row) => row.publishedAt !== null);
  const urls = await resolveFileUrls(
    context.db,
    published.flatMap((row) => (row.imageId ? [row.imageId] : []))
  );

  return published.map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    imageUrl: row.imageId ? (urls.get(row.imageId) ?? null) : null,
  }));
});

export const createSportTile = cmsProcedure
  .input(sportTileFieldsSchema)
  .handler(async ({ input, context }) => {
    const record = await context.db
      .insert(sportTile)
      .values({
        id: crypto.randomUUID(),
        name: input.name,
        imageId: input.imageId ?? null,
        sortOrder: input.sortOrder ?? 0,
        publishedAt: new Date(),
      })
      .returning({ id: sportTile.id })
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateSportTile = cmsProcedure
  .input(
    v.object({
      id: sportTileIdSchema,
      ...sportTileFieldsSchema.entries,
    })
  )
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(sportTile)
      .set({
        name: input.name,
        imageId: input.imageId ?? null,
        sortOrder: input.sortOrder ?? 0,
      })
      .where(eq(sportTile.id, input.id))
      .returning({ id: sportTile.id })
      .get();

    if (!record) {
      throw new ORPCError("NOT_FOUND", { message: "Sport tile not found" });
    }

    return { id: record.id };
  });

export const deleteSportTile = cmsProcedure
  .input(v.object({ id: sportTileIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(sportTile)
      .where(eq(sportTile.id, input.id))
      .returning({ id: sportTile.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Sport tile not found" });
    }

    return { id: input.id };
  });
