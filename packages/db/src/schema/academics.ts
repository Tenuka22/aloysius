import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import * as v from "valibot";

import { GRADE_LEVELS } from "../constants/grades";
import {
  AL_COMMON_SUBJECTS,
  AL_STREAMS,
  AL_SUBJECTS,
  BASKET_SUBJECTS,
  JUNIOR_SECONDARY_SUBJECTS,
  MOTHER_TONGUE_OPTIONS,
  OL_COMPULSORY_SUBJECTS,
  PRIMARY_SUBJECTS,
} from "../constants/subjects";
import { brand } from "./brand";
import type { Brand } from "./brand";
import {
  academicYearIdSchema,
  staff,
  academicYear,
  staffIdSchema,
} from "./staff";

export type ClassId = Brand<string, "ClassId">;
export const classIdSchema = v.pipe(v.string(), brand<string, "ClassId">());

export type SubjectAssignmentId = Brand<string, "SubjectAssignmentId">;
export const subjectAssignmentIdSchema = v.pipe(
  v.string(),
  brand<string, "SubjectAssignmentId">()
);

const SUBJECT_KEYS = [
  ...new Set([
    ...PRIMARY_SUBJECTS,
    ...JUNIOR_SECONDARY_SUBJECTS,
    ...OL_COMPULSORY_SUBJECTS,
    ...Object.values(BASKET_SUBJECTS).flat(),
    ...AL_STREAMS,
    ...Object.values(AL_SUBJECTS).flat(),
    ...AL_COMMON_SUBJECTS,
  ]),
] as [string, ...string[]];

const gradeLevelSchema = v.picklist(GRADE_LEVELS);
const subjectKeySchema = v.picklist(SUBJECT_KEYS);
const mediumSchema = v.picklist([...MOTHER_TONGUE_OPTIONS, "english"]);

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

export { gradeLevelSchema, subjectKeySchema, mediumSchema };

const classColumnRefinements = {
  id: () => classIdSchema,
  academicYearId: () => academicYearIdSchema,
  gradeLevel: () => gradeLevelSchema,
  name: () => v.pipe(v.string(), v.minLength(1)),
  medium: () => v.optional(mediumSchema, "sinhala"),
  homeroomTeacherId: () => v.optional(v.nullable(staffIdSchema)),
  subHomeroomTeacherId: () => v.optional(v.nullable(staffIdSchema)),
};

export const classSelectSchema = createSelectSchema(
  class_,
  classColumnRefinements
);
export const classInsertSchema = createInsertSchema(
  class_,
  classColumnRefinements
);

const subjectAssignmentColumnRefinements = {
  id: () => subjectAssignmentIdSchema,
  staffId: () => staffIdSchema,
  academicYearId: () => academicYearIdSchema,
  subjectKey: () => subjectKeySchema,
  gradeLevel: () => gradeLevelSchema,
  classId: () => v.optional(v.nullable(classIdSchema)),
};

export const subjectAssignmentSelectSchema = createSelectSchema(
  subjectAssignment,
  subjectAssignmentColumnRefinements
);
export const subjectAssignmentInsertSchema = createInsertSchema(
  subjectAssignment,
  subjectAssignmentColumnRefinements
);
