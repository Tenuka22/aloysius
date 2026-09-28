import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import * as v from "valibot";

import { brand } from "./brand";
import type { Brand } from "./brand";
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

export const event = sqliteTable(
  "event",
  {
    id: text("id").primaryKey(),
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
    ...timestamps,
  },
  (table) => [
    index("event_published_starts_idx").on(table.publishedAt, table.startsAt),
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
});
export const eventInsertSchema = createInsertSchema(event, {
  id: () => eventIdSchema,
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
