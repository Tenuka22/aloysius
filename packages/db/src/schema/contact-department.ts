import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import * as v from "valibot";

import { brand } from "./brand";
import type { Brand } from "./brand";

/**
 * The "Reach the right office" directory on `/contact`. Replaces
 * `CONTACT_DEPARTMENTS`, a fixed six-row array in
 * `packages/ui/src/content/contact.ts`.
 *
 * `id` is not a generated key: it is the department's own slug, and
 * `packages/ui/src/content/contact.ts`'s `CONTACT_TOPICS` hardcodes
 * `departmentId` values (`admissions`, `academic`, `oba`, `media`) that
 * `contact-form.tsx`'s `resolveRecipient` joins against this table to decide
 * where an enquiry is sent. Seeding keeps the six existing ids
 * (`principal`, `admissions`, `academic`, `sports`, `oba`, `media`) so that
 * routing does not silently break on first deploy.
 */

export type ContactDepartmentId = Brand<string, "ContactDepartmentId">;
export const contactDepartmentIdSchema = v.pipe(
  v.string(),
  brand<string, "ContactDepartmentId">()
);

export const contactDepartment = sqliteTable("contact_department", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  telephone: text("telephone"),
  email: text("email"),
  sortOrder: integer("sort_order"),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql.raw("(cast(unixepoch('subsecond') * 1000 as integer))"))
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql.raw("(cast(unixepoch('subsecond') * 1000 as integer))"))
    .$onUpdate(() => new Date())
    .notNull(),
});

export const contactDepartmentSelectSchema = createSelectSchema(
  contactDepartment,
  { id: () => contactDepartmentIdSchema }
);
export const contactDepartmentInsertSchema = createInsertSchema(
  contactDepartment,
  { id: () => contactDepartmentIdSchema }
);

export type ContactDepartmentRow = v.InferOutput<
  typeof contactDepartmentSelectSchema
>;
