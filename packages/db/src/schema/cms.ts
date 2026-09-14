import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import * as v from "valibot";

import { user } from "./auth";
import { brand } from "./brand";
import type { Brand } from "./brand";

export type ContentVersionId = Brand<string, "ContentVersionId">;
export const contentVersionIdSchema = v.pipe(
  v.string(),
  brand<string, "ContentVersionId">()
);

export type ContentBlockId = Brand<string, "ContentBlockId">;
export const contentBlockIdSchema = v.pipe(
  v.string(),
  brand<string, "ContentBlockId">()
);

/** Action taken on a content block. */
export const CONTENT_ACTIONS = [
  "created",
  "draft",
  "edit",
  "publish",
  "hide",
  "show",
  "delete",
] as const;
export type ContentAction = (typeof CONTENT_ACTIONS)[number];

/**
 * CMS content version tracking.
 *
 * Each row records a single change to a content block (e.g. homepage hero,
 * notice strip). The `snapshot` field holds the full block state at that point
 * in time, so any version can be restored.
 *
 * This gives us:
 * - Draft/publish workflow (draft = latest unpublished, publish = snapshot)
 * - Blame tracking (authorId → who made the change)
 * - Audit trail (action + timestamp for every change)
 * - Restore capability (snapshot contains full block state)
 */
export const contentVersion = sqliteTable(
  "content_version",
  {
    id: text("id").primaryKey(),

    /** Which page this content belongs to (e.g. "homepage", "about"). */
    page: text("page").notNull(),

    /** Block identifier within the page (e.g. "hero", "notice", "heritage"). */
    blockId: text("block_id").notNull(),

    /** The action that created this version. */
    action: text("action").$type<ContentAction>().notNull(),

    /**
     * Full snapshot of the block's fields at this point in time.
     * JSON-encoded Record<string, string> matching the BlockField[] shape.
     */
    snapshot: text("snapshot").notNull(),

    /** Whether this version is the currently published one. */
    published: integer("published", { mode: "boolean" })
      .default(false)
      .notNull(),

    /** User who performed this action. */
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("content_version_page_idx").on(table.page),
    index("content_version_block_idx").on(table.blockId),
    index("content_version_page_block_idx").on(table.page, table.blockId),
    index("content_version_published_idx").on(table.published),
    index("content_version_author_idx").on(table.authorId),
  ]
);

export const contentVersionSelectSchema = createSelectSchema(contentVersion, {
  id: () => contentVersionIdSchema,
  action: () => v.picklist(CONTENT_ACTIONS),
});
export const contentVersionInsertSchema = createInsertSchema(contentVersion, {
  id: () => contentVersionIdSchema,
  page: () => v.pipe(v.string(), v.minLength(1)),
  blockId: () => v.pipe(v.string(), v.minLength(1)),
  snapshot: () => v.pipe(v.string(), v.minLength(2)),
});
