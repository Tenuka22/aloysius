import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

import { files } from "./files";
import { staff } from "./staff";

/**
 * Teacher qualification records.
 * Stores multiple qualifications per teacher in ordered manner.
 */
export const teacherQualification = sqliteTable(
  "teacher_qualification",
  {
    id: text("id").primaryKey(),
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    // Qualification type from enum
    qualification: text("qualification").notNull(),
    // Year the qualification was obtained
    yearObtained: integer("year_obtained"),
    // Institution name (optional)
    institution: text("institution"),
    // Subject specialization if applicable (e.g., "Mathematics")
    subjectSpecialization: text("subject_specialization"),
    // Category of the specialization
    specializationCategory: text("specialization_category"),
    // Document file ID (nullable - some may not have uploaded docs)
    documentFileId: text("document_file_id").references(() => files.id, {
      onDelete: "set null",
    }),
    // Approval status for the document
    documentStatus: text("document_status").default("pending").notNull(),
    // Admin who reviewed
    reviewedBy: text("reviewed_by").references(() => staff.id, {
      onDelete: "set null",
    }),
    // Admin review note
    reviewNote: text("review_note"),
    // When reviewed
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("teacher_qualification_staff_idx").on(table.staffId),
    index("teacher_qualification_doc_status_idx").on(table.documentStatus),
    unique("teacher_qualification_unique").on(
      table.staffId,
      table.qualification,
      table.yearObtained,
      table.institution
    ),
  ]
);

/**
 * Employment verification documents.
 * Tracks documents submitted for employment verification.
 */
export const employmentVerification = sqliteTable(
  "employment_verification",
  {
    id: text("id").primaryKey(),
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    // Document type (e.g., "appointmentLetter", "nationalIdentityCard")
    documentType: text("document_type").notNull(),
    // File ID of uploaded document
    fileId: text("file_id").references(() => files.id, {
      onDelete: "set null",
    }),
    // Current approval status
    status: text("status").default("pending").notNull(),
    // Admin who reviewed
    reviewedBy: text("reviewed_by").references(() => staff.id, {
      onDelete: "set null",
    }),
    // Admin review note
    reviewNote: text("review_note"),
    // When reviewed
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("employment_verification_staff_idx").on(table.staffId),
    index("employment_verification_status_idx").on(table.status),
    index("employment_verification_type_idx").on(table.documentType),
  ]
);

/**
 * Password rotation history.
 * Tracks password changes for audit purposes.
 */
export const passwordRotationHistory = sqliteTable(
  "password_rotation_history",
  {
    id: text("id").primaryKey(),
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    // Who changed the password
    changedBy: text("changed_by").references(() => staff.id, {
      onDelete: "set null",
    }),
    // Whether changed by admin or self ("admin" | "self")
    changeMethod: text("change_method").notNull(),
    // When the change occurred
    changedAt: integer("changed_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("password_rotation_staff_idx").on(table.staffId),
    index("password_rotation_changed_by_idx").on(table.changedBy),
  ]
);
