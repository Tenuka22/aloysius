import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

import { files } from "./files";

/** Permanent staff record (not year-dependent). */
export const staff = sqliteTable(
  "staff",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").unique(),
    nic: text("nic").unique(),
    phone: text("phone"),
    portraitFileId: text("portrait_file_id").references(() => files.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("staff_email_idx").on(table.email),
    index("staff_nic_idx").on(table.nic),
  ]
);

/** Academic year entity. */
export const academicYear = sqliteTable("academic_year", {
  id: text("id").primaryKey(),
  year: integer("year").notNull().unique(),
  isCurrent: integer("is_current", { mode: "boolean" })
    .default(false)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

/**
 * Staff role assignment for a given academic year.
 * `position` stores the enum key (e.g., "principal", "sectionalHead").
 * `sectionalScope` stores the enum key for sectional heads (e.g., "grade8_9").
 */
export const staffPosition = sqliteTable(
  "staff_position",
  {
    id: text("id").primaryKey(),
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYear.id, { onDelete: "cascade" }),
    position: text("position").notNull(),
    sectionalScope: text("sectional_scope"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("staff_position_staff_idx").on(table.staffId),
    index("staff_position_year_idx").on(table.academicYearId),
    unique("staff_position_unique").on(
      table.staffId,
      table.academicYearId,
      table.position,
      table.sectionalScope
    ),
  ]
);
