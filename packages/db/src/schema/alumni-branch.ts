import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import * as v from "valibot";

import { brand } from "./brand";
import type { Brand } from "./brand";

/**
 * The branch directory on `/alumni`: where to find the Association, one row
 * per branch. Replaces `ALUMNI_BRANCH_CARDS`, a fixed three-row array (Galle,
 * Colombo, Overseas) that could hold a `contact` and `href` per row but never
 * had either set - see `AlumniBranch` in `packages/ui/src/content/alumni.ts`.
 * `sortOrder` keeps that same Galle, Colombo, overseas ordering explicit
 * instead of relying on insertion order.
 */

export type AlumniBranchId = Brand<string, "AlumniBranchId">;
export const alumniBranchIdSchema = v.pipe(
  v.string(),
  brand<string, "AlumniBranchId">()
);

export const alumniBranch = sqliteTable("alumni_branch", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  /** Phone, email or address shown under the branch name. */
  contact: text("contact"),
  /** Adds a "Branch Details" link when set. */
  href: text("href"),
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

export const alumniBranchSelectSchema = createSelectSchema(alumniBranch, {
  id: () => alumniBranchIdSchema,
});
export const alumniBranchInsertSchema = createInsertSchema(alumniBranch, {
  id: () => alumniBranchIdSchema,
});

export type AlumniBranchRow = v.InferOutput<typeof alumniBranchSelectSchema>;
