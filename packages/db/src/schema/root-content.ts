import { sql } from "drizzle-orm";
import type { SQL, SQLWrapper } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import * as v from "valibot";

import { user } from "./auth";
import { brand } from "./brand";
import type { Brand } from "./brand";
import { CLUBS, clubSlugSchema } from "./club-photos";
import { files } from "./files";

export type PersonId = Brand<string, "PersonId">;
export const personIdSchema = v.pipe(v.string(), brand<string, "PersonId">());
export type EventId = Brand<string, "EventId">;
export const eventIdSchema = v.pipe(v.string(), brand<string, "EventId">());
export type AchievementId = Brand<string, "AchievementId">;
export const achievementIdSchema = v.pipe(
  v.string(),
  brand<string, "AchievementId">()
);

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql.raw("(cast(unixepoch('subsecond') * 1000 as integer))"))
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql.raw("(cast(unixepoch('subsecond') * 1000 as integer))"))
    .$onUpdate(() => new Date())
    .notNull(),
};

export const person = sqliteTable(
  "person",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    role: text("role"),
    bio: text("bio"),
    imageId: text("image_id").references(() => files.id, {
      onDelete: "set null",
    }),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (table) => [index("person_published_idx").on(table.publishedAt)]
);

/** `column in ('a', 'b')` for a CHECK. Values are code constants, never input. */
const sqlInList = (column: SQLWrapper, values: readonly string[]): SQL =>
  sql`${column} in (${sql.raw(values.map((value) => `'${value}'`).join(", "))})`;

export const EVENT_STATUSES = ["pending", "approved", "rejected"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const event = sqliteTable(
  "event",
  {
    id: text("id").primaryKey(),
    /** Which club submitted this event. Same model as `club_photo`/`announcement`. */
    club: text("club").notNull(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),
    coverImageId: text("cover_image_id").references(() => files.id, {
      onDelete: "set null",
    }),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    submittedById: text("submitted_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** `pending` until a CMS reviewer (admin|cms) decides; only `approved`
     * rows are selected by the public events query. */
    status: text("status").$type<EventStatus>().default("pending").notNull(),
    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    reviewNote: text("review_note"),
    ...timestamps,
  },
  (table) => [
    index("event_published_starts_idx").on(table.publishedAt, table.startsAt),
    index("event_club_status_idx").on(table.club, table.status),
    check("event_club_check", sqlInList(table.club, CLUBS)),
    check("event_status_check", sqlInList(table.status, EVENT_STATUSES)),
    check(
      "event_review_fields_paired",
      sql`(${table.status} = 'pending' and ${table.reviewedById} is null and ${table.reviewedAt} is null)
          or (${table.status} <> 'pending' and ${table.reviewedById} is not null and ${table.reviewedAt} is not null)`
    ),
  ]
);

export const achievement = sqliteTable(
  "achievement",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    detail: text("detail").notNull(),
    imageId: text("image_id").references(() => files.id, {
      onDelete: "set null",
    }),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("achievement_category_title_uq").on(
      table.category,
      table.title
    ),
    index("achievement_published_idx").on(table.publishedAt),
  ]
);

export const personSelectSchema = createSelectSchema(person, {
  id: () => personIdSchema,
});
export const personInsertSchema = createInsertSchema(person, {
  id: () => personIdSchema,
  slug: () => v.pipe(v.string(), v.minLength(1)),
  name: () => v.pipe(v.string(), v.minLength(1)),
});
export const eventSelectSchema = createSelectSchema(event, {
  id: () => eventIdSchema,
  club: () => clubSlugSchema,
  status: () => v.picklist(EVENT_STATUSES),
  reviewNote: () =>
    v.optional(v.nullable(v.pipe(v.string(), v.maxLength(1000)))),
});
export const eventInsertSchema = createInsertSchema(event, {
  id: () => eventIdSchema,
  club: () => clubSlugSchema,
  slug: () => v.pipe(v.string(), v.minLength(1)),
  title: () => v.pipe(v.string(), v.minLength(1)),
  startsAt: () => v.date(),
  endsAt: () => v.date(),
});
export const achievementSelectSchema = createSelectSchema(achievement, {
  id: () => achievementIdSchema,
});
export const achievementInsertSchema = createInsertSchema(achievement, {
  id: () => achievementIdSchema,
  category: () => v.pipe(v.string(), v.minLength(1)),
  title: () => v.pipe(v.string(), v.minLength(1)),
  detail: () => v.pipe(v.string(), v.minLength(1)),
});

export type Person = v.InferOutput<typeof personSelectSchema>;
export type Event = v.InferOutput<typeof eventSelectSchema>;
export type Achievement = v.InferOutput<typeof achievementSelectSchema>;
