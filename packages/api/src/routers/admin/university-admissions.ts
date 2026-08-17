import { z } from "zod";
import { eq, asc, desc, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { universityAdmissions, examResults } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import { sortDirectionSchema } from "../../schemas";

const admissionInput = z.object({
  examResultId: z.string().min(1, "Exam result is required"),
  studentName: z.string().min(1, "Student name is required"),
  university: z.string().min(1, "University is required"),
  course: z.string().min(1, "Course is required"),
  sortOrder: z.number().optional(),
});

function serializeAdmission(row: typeof universityAdmissions.$inferSelect) {
  return {
    id: row.id,
    examResultId: row.examResultId,
    studentName: row.studentName,
    university: row.university,
    course: row.course,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Site-admin management of university admissions. Admissions belong to an
 * exam result (A/L) but are managed here as first-class rows, independent of
 * the exam-result editor.
 */
export const adminUniversityAdmissionsRouter = {
  list: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirectionSchema.default("asc"),
        examResultId: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, examResultId } = input;
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (examResultId) {
        conditions.push(eq(universityAdmissions.examResultId, examResultId));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [countRow] = await db
        .select({ total: count() })
        .from(universityAdmissions)
        .where(where)
        .all();
      const total = countRow?.total ?? 0;

      const orderFn = sortDir === "asc" ? asc : desc;
      const sortColumn =
        sort === "studentName"
          ? universityAdmissions.studentName
          : sort === "university"
            ? universityAdmissions.university
            : sort === "course"
              ? universityAdmissions.course
              : sort === "createdAt"
                ? universityAdmissions.createdAt
                : universityAdmissions.sortOrder;

      const rows = await db
        .select({
          id: universityAdmissions.id,
          examResultId: universityAdmissions.examResultId,
          studentName: universityAdmissions.studentName,
          university: universityAdmissions.university,
          course: universityAdmissions.course,
          sortOrder: universityAdmissions.sortOrder,
          createdAt: universityAdmissions.createdAt,
          examType: examResults.examType,
          examYear: examResults.examYear,
          resultsYear: examResults.resultsYear,
        })
        .from(universityAdmissions)
        .innerJoin(examResults, eq(examResults.id, universityAdmissions.examResultId))
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset)
        .all();

      return {
        rows: rows.map((r) => ({
          id: r.id,
          examResultId: r.examResultId,
          studentName: r.studentName,
          university: r.university,
          course: r.course,
          sortOrder: r.sortOrder,
          createdAt: r.createdAt.toISOString(),
          examType: r.examType,
          examYear: r.examYear,
          resultsYear: r.resultsYear,
        })),
        total,
        pageCount: Math.ceil(total / pageSize),
        page,
        pageSize,
      };
    }),

  create: adminProcedure
    .input(admissionInput)
    .handler(async ({ input }) => {
      const db = createDb();
      const now = new Date();
      const id = crypto.randomUUID();

      const existing = await db
        .select()
        .from(examResults)
        .where(eq(examResults.id, input.examResultId))
        .get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Exam result not found" });
      }

      await db
        .insert(universityAdmissions)
        .values({
          id,
          examResultId: input.examResultId,
          studentName: input.studentName,
          university: input.university,
          course: input.course,
          sortOrder: input.sortOrder ?? 0,
          createdAt: now,
        })
        .run();

      return {
        id,
        examResultId: input.examResultId,
        studentName: input.studentName,
        university: input.university,
        course: input.course,
        sortOrder: input.sortOrder ?? 0,
        createdAt: now.toISOString(),
      };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        examResultId: z.string().min(1, "Exam result is required"),
        studentName: z.string().min(1, "Student name is required"),
        university: z.string().min(1, "University is required"),
        course: z.string().min(1, "Course is required"),
        sortOrder: z.number().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db
        .select()
        .from(universityAdmissions)
        .where(eq(universityAdmissions.id, input.id))
        .get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Admission not found" });
      }

      const exam = await db
        .select()
        .from(examResults)
        .where(eq(examResults.id, input.examResultId))
        .get();
      if (!exam) {
        throw new ORPCError("NOT_FOUND", { message: "Exam result not found" });
      }

      await db
        .update(universityAdmissions)
        .set({
          examResultId: input.examResultId,
          studentName: input.studentName,
          university: input.university,
          course: input.course,
          sortOrder: input.sortOrder ?? existing.sortOrder,
        })
        .where(eq(universityAdmissions.id, input.id))
        .run();

      const updated = await db
        .select()
        .from(universityAdmissions)
        .where(eq(universityAdmissions.id, input.id))
        .get();

      return updated ? serializeAdmission(updated) : undefined;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db
        .select()
        .from(universityAdmissions)
        .where(eq(universityAdmissions.id, input.id))
        .get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Admission not found" });
      }
      await db.delete(universityAdmissions).where(eq(universityAdmissions.id, input.id)).run();
      return { success: true };
    }),
};
