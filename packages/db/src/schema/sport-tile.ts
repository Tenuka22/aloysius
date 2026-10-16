import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import * as v from "valibot";

import { brand } from "./brand";
import type { Brand } from "./brand";
import { files } from "./files";

/**
 * The "On the Field" sports mosaic on `/students`, one row per sport.
 * Replaces `SPORT_TILES`, a fixed three-row array (Cricket, Rugby, Athletics)
 * that could hold exactly those three sports and nothing else, with its
 * per-tile photograph each pinned to its own `students-sports-*` CMS block
 * field (`imageId` here is now that field's single source of truth).
 *
 * `sortOrder` keeps the display order explicit rather than relying on
 * insertion order - the mosaic's hero tile is always whichever published row
 * sorts first, with its "feature" layout footprint derived from that
 * position rather than stored, so an editor never has to pick a layout.
 */

export type SportTileId = Brand<string, "SportTileId">;
export const sportTileIdSchema = v.pipe(
  v.string(),
  brand<string, "SportTileId">()
);

export const sportTile = sqliteTable("sport_tile", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  imageId: text("image_id").references(() => files.id, {
    onDelete: "set null",
  }),
  sortOrder: integer("sort_order").notNull().default(0),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql.raw("(cast(unixepoch('subsecond') * 1000 as integer))"))
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql.raw("(cast(unixepoch('subsecond') * 1000 as integer))"))
    .$onUpdate(() => new Date())
    .notNull(),
});

export const sportTileSelectSchema = createSelectSchema(sportTile, {
  id: () => sportTileIdSchema,
});
export const sportTileInsertSchema = createInsertSchema(sportTile, {
  id: () => sportTileIdSchema,
});

export type SportTileRow = v.InferOutput<typeof sportTileSelectSchema>;
