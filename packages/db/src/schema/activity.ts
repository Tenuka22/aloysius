import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Security-sensitive actions performed by administrators and club admins. */
export const adminActivity = sqliteTable(
  "admin_activity",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").notNull(),
    actorUsername: text("actor_username"),
    actorRole: text("actor_role"),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    metadata: text("metadata"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql.raw("(cast(unixepoch('subsecond') * 1000 as integer))"))
      .notNull(),
  },
  (table) => [index("admin_activity_created_idx").on(table.createdAt)]
);

export type AdminActivity = typeof adminActivity.$inferSelect;
