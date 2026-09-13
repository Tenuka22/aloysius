import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

import { staff, academicYear } from "./staff";

/**
 * Classes within a grade for a given academic year.
 * `gradeLevel` is integer (1-13), `medium` is enum key.
 */
export const class_ = sqliteTable(
  "class",
  {
    id: text("id").primaryKey(),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYear.id, { onDelete: "cascade" }),
    gradeLevel: integer("grade_level").notNull(),
    name: text("name").notNull(),
    medium: text("medium").default("sinhala").notNull(),
    homeroomTeacherId: text("homeroom_teacher_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    subHomeroomTeacherId: text("sub_homeroom_teacher_id").references(
      () => staff.id,
      { onDelete: "set null" }
    ),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("class_year_idx").on(table.academicYearId),
    index("class_grade_idx").on(table.gradeLevel),
    unique("class_unique").on(
      table.academicYearId,
      table.gradeLevel,
      table.name
    ),
  ]
);

/**
 * What a teacher teaches in a given year.
 * `subjectKey` maps to a constant from the subject enums.
 * `gradeLevel` is integer (1-13).
 * `classId` is nullable: null = teaches all classes of that grade.
 */
export const subjectAssignment = sqliteTable(
  "subject_assignment",
  {
    id: text("id").primaryKey(),
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYear.id, { onDelete: "cascade" }),
    subjectKey: text("subject_key").notNull(),
    gradeLevel: integer("grade_level").notNull(),
    classId: text("class_id").references(() => class_.id, {
      onDelete: "cascade",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("subject_assignment_staff_idx").on(table.staffId),
    index("subject_assignment_year_idx").on(table.academicYearId),
    index("subject_assignment_subject_idx").on(table.subjectKey),
  ]
);
