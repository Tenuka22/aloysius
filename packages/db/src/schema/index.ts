import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(),
  key: text("key").notNull(),
  userId: text("user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// --- News table (general updates about the school/area) ---

export const news = sqliteTable("news", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  status: text("status", { enum: ["draft", "published", "archived"] })
    .notNull()
    .default("draft"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  userId: text("user_id").notNull(),
});

// --- Announcements table (targeted communications to specific groups/people) ---

export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  status: text("status", { enum: ["draft", "published", "archived"] })
    .notNull()
    .default("draft"),
  audience: text("audience", { enum: ["all", "students", "parents", "staff", "alumni"] })
    .notNull()
    .default("all"),
  addressedTo: text("addressed_to"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  userId: text("user_id").notNull(),
});
