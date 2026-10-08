import { sql } from "drizzle-orm";
import type { SQL, SQLWrapper } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/valibot";
import * as v from "valibot";

import { user } from "./auth";
import { brand } from "./brand";
import type { Brand } from "./brand";
import { CLUBS, clubSlugSchema } from "./club-photos";
import { fileIdSchema, files } from "./files";

/** `column in ('a', 'b')` for a CHECK. Values are code constants, never input. */
const sqlInList = (column: SQLWrapper, values: readonly string[]): SQL =>
  sql`${column} in (${sql.raw(values.map((value) => `'${value}'`).join(", "))})`;

export type NewsPostId = Brand<string, "NewsPostId">;
export const newsPostIdSchema = v.pipe(
  v.string(),
  brand<string, "NewsPostId">()
);

export const NEWS_POST_CATEGORIES = [
  "academic",
  "sports",
  "arts",
  "achievement",
  "general",
] as const;
export type NewsPostCategory = (typeof NEWS_POST_CATEGORIES)[number];

export const NEWS_POST_STATUSES = ["pending", "approved", "rejected"] as const;
export type NewsPostStatus = (typeof NEWS_POST_STATUSES)[number];

/**
 * A longer-form news article, as distinct from `announcement` (a short
 * banner) — title, summary, body and an optional cover image, the shape
 * `/news` actually renders. Same submit→review model as `club_photo` and
 * `announcement`: a row starts `pending`, and only `listApprovedNewsPosts`
 * (the public query) ever selects `approved`.
 */
export const newsPost = sqliteTable(
  "news_post",
  {
    id: text("id").primaryKey(),
    club: text("club").notNull(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary"),
    body: text("body").notNull(),
    category: text("category").$type<NewsPostCategory>(),
    coverImageId: text("cover_image_id").references(() => files.id, {
      onDelete: "set null",
    }),
    status: text("status").$type<NewsPostStatus>().default("pending").notNull(),
    submittedById: text("submitted_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    reviewNote: text("review_note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("news_post_club_status_idx").on(table.club, table.status),
    index("news_post_published_idx").on(table.publishedAt),
    index("news_post_submitted_by_idx").on(table.submittedById),
    check("news_post_club_check", sqlInList(table.club, CLUBS)),
    check(
      "news_post_status_check",
      sqlInList(table.status, NEWS_POST_STATUSES)
    ),
    check(
      "news_post_category_check",
      sqlInList(table.category, NEWS_POST_CATEGORIES)
    ),
    check(
      "news_post_review_fields_paired",
      sql`(${table.status} = 'pending' and ${table.reviewedById} is null and ${table.reviewedAt} is null)
          or (${table.status} <> 'pending' and ${table.reviewedById} is not null and ${table.reviewedAt} is not null)`
    ),
  ]
);

const newsPostColumnRefinements = {
  id: () => newsPostIdSchema,
  club: () => clubSlugSchema,
  slug: () => v.pipe(v.string(), v.minLength(1)),
  title: () => v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  summary: () => v.optional(v.nullable(v.pipe(v.string(), v.maxLength(400)))),
  body: () => v.pipe(v.string(), v.minLength(1), v.maxLength(10_000)),
  category: () => v.optional(v.nullable(v.picklist(NEWS_POST_CATEGORIES))),
  coverImageId: () => v.optional(v.nullable(fileIdSchema)),
  status: () => v.picklist(NEWS_POST_STATUSES),
  reviewNote: () =>
    v.optional(v.nullable(v.pipe(v.string(), v.maxLength(1000)))),
};

export const newsPostSelectSchema = createSelectSchema(
  newsPost,
  newsPostColumnRefinements
);
export const newsPostInsertSchema = createInsertSchema(
  newsPost,
  newsPostColumnRefinements
);
export const newsPostUpdateSchema = createUpdateSchema(
  newsPost,
  newsPostColumnRefinements
);

export type NewsPost = v.InferOutput<typeof newsPostSelectSchema>;
