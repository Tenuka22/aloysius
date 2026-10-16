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
 * The Hall of Fame on `/alumni`: distinguished Aloysians by category.
 *
 * Replaces `ALUMNI_NOTABLES`, a fixed four-row array (one per category) that
 * could hold exactly one name and one image per category and nothing else.
 * This table drops both limits: any number of rows per `category`, each with
 * its own optional `role` alongside `name` and `imageId`, the same three
 * fields `person` carries for academic heads.
 *
 * Not `person`: that table has no category column and is read with no
 * filtering by `listAcademicHeads`, so a row added here would also render as
 * an academic head. `category` is also a fixed four-value set, not the free
 * text a name/role pair is, which is the same shape `achievement.category`
 * already validates with a CHECK.
 */

/** `column in ('a', 'b')` for a CHECK. Values are code constants, never input. */
const sqlInList = (column: SQLWrapper, values: readonly string[]): SQL =>
  sql`${column} in (${sql.raw(values.map((value) => `'${value}'`).join(", "))})`;

/**
 * The four Hall of Fame categories, identical to the ids `ALUMNI_NOTABLES`
 * already used in `packages/ui/src/content/alumni.ts` so the public page's
 * category labels keep working unchanged.
 */
export const ALUMNI_NOTABLE_CATEGORIES = [
  "public-service",
  "academia",
  "sport",
  "arts-culture",
] as const;
export type AlumniNotableCategory = (typeof ALUMNI_NOTABLE_CATEGORIES)[number];

export type AlumniNotableId = Brand<string, "AlumniNotableId">;
export const alumniNotableIdSchema = v.pipe(
  v.string(),
  brand<string, "AlumniNotableId">()
);

export const alumniNotable = sqliteTable(
  "alumni_notable",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull().$type<AlumniNotableCategory>(),
    name: text("name").notNull(),
    role: text("role"),
    imageId: text("image_id").references(() => files.id, {
      onDelete: "set null",
    }),
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
    index("alumni_notable_category_published_idx").on(
      table.category,
      table.publishedAt
    ),
    check(
      "alumni_notable_category_check",
      sqlInList(table.category, ALUMNI_NOTABLE_CATEGORIES)
    ),
  ]
);

export const alumniNotableSelectSchema = createSelectSchema(alumniNotable, {
  id: () => alumniNotableIdSchema,
});
export const alumniNotableInsertSchema = createInsertSchema(alumniNotable, {
  id: () => alumniNotableIdSchema,
  category: () => v.picklist(ALUMNI_NOTABLE_CATEGORIES),
});

export type AlumniNotable = v.InferOutput<typeof alumniNotableSelectSchema>;
