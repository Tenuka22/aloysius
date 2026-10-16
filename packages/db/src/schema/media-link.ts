import { sql } from "drizzle-orm";
import type { SQL, SQLWrapper } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import * as v from "valibot";

import { brand } from "./brand";
import type { Brand } from "./brand";
import { files } from "./files";

/**
 * The "Magazines & Reports" and "In the Press" tabs on `/media`.
 *
 * Replaces `MEDIA_PUBLICATIONS` and `MEDIA_PRESS`, two fixed-empty
 * `MediaLink[]` constants in `packages/ui/src/content/media.ts` - the page
 * shipped with no way to ever add a row. One table backs both tabs, the same
 * way `alumni-notable` backs four Hall of Fame categories with one `category`
 * column: `kind` is the only thing that differs between a magazine and a
 * press clipping.
 *
 * `href` points at a PDF, a page, or an article - sometimes hosted by the
 * College, sometimes an outlet's own site. `fileId` covers the first case: a
 * PDF uploaded through the CMS. `href` stays required so a plain external
 * link (an outlet's article, a page already hosted elsewhere) never needs a
 * fake upload to satisfy the column - the public read prefers the resolved
 * file URL when `fileId` is set and falls back to `href` otherwise.
 */

/** `column in ('a', 'b')` for a CHECK. Values are code constants, never input. */
const sqlInList = (column: SQLWrapper, values: readonly string[]): SQL =>
  sql`${column} in (${sql.raw(values.map((value) => `'${value}'`).join(", "))})`;

export const MEDIA_LINK_KINDS = ["publication", "press"] as const;
export type MediaLinkKind = (typeof MEDIA_LINK_KINDS)[number];

export type MediaLinkId = Brand<string, "MediaLinkId">;
export const mediaLinkIdSchema = v.pipe(
  v.string(),
  brand<string, "MediaLinkId">()
);

export const mediaLink = sqliteTable(
  "media_link",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull().$type<MediaLinkKind>(),
    title: text("title").notNull(),
    /** e.g. "Annual magazine - 2025" or the outlet and date for press. */
    meta: text("meta"),
    /** A plain URL; the fallback when `fileId` is unset. */
    href: text("href"),
    fileId: text("file_id").references(() => files.id, {
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
  },
  (table) => [
    index("media_link_kind_published_idx").on(table.kind, table.publishedAt),
    check("media_link_kind_check", sqlInList(table.kind, MEDIA_LINK_KINDS)),
  ]
);

export const mediaLinkSelectSchema = createSelectSchema(mediaLink, {
  id: () => mediaLinkIdSchema,
});
export const mediaLinkInsertSchema = createInsertSchema(mediaLink, {
  id: () => mediaLinkIdSchema,
  kind: () => v.picklist(MEDIA_LINK_KINDS),
});

export type MediaLink = v.InferOutput<typeof mediaLinkSelectSchema>;
