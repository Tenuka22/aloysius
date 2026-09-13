import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { files } from "./files";
import { staff } from "./staff";

/**
 * Staff qualifications/certifications uploaded by staff, requiring admin approval.
 * Staff can upload documents; admin must approve before they become verified.
 */
export const qualification = sqliteTable(
  "qualification",
  {
    id: text("id").primaryKey(),
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    fileId: text("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    status: text("status").default("pending").notNull(),
    reviewedBy: text("reviewed_by").references(() => staff.id, {
      onDelete: "set null",
    }),
    reviewNote: text("review_note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("qualification_staff_idx").on(table.staffId),
    index("qualification_status_idx").on(table.status),
  ]
);
