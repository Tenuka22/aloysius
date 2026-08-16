import { z } from "zod";
import { eq, desc, asc, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { examResults, examStudents } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { publicProcedure } from "../index";
import { contentStatusSchema, examTypeSchema, sortDirectionSchema } from "../schemas";

function serializeStudent(row: typeof examStudents.$inferSelect) {
  return {
    id: row.id,
    examResultId: row.examResultId,
    name: row.name,
    photo: row.photo,
    quote: row.quote,
    marks: row.marks,
    overallGrade: row.overallGrade,
    stream: row.stream,
    subjects: row.subjects ?? [],
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeResult(row: typeof examResults.$inferSelect) {
  return {
    id: row.id,
    examType: row.examType,
    examYear: row.examYear,
    resultsYear: row.resultsYear,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    userId: row.userId,
  };
}

export const examResultsRouter = {
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirectionSchema.default("desc"),
        examType: examTypeSchema.optional(),
        status: contentStatusSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, examType, status } = input;
      const offset = (page - 1) * pageSize;
      const isSiteAdmin = context.auth?.adminCalled ?? false;

      const conditions = [];
      if (examType) {
        conditions.push(eq(examResults.examType, examType));
      }
      if (status) {
        if (status !== "published" && !isSiteAdmin) {
          throw new ORPCError("UNAUTHORIZED", { message: "Site admin access required." });
        }
        conditions.push(eq(examResults.status, status));
      } else if (!isSiteAdmin) {
        conditions.push(eq(examResults.status, "published"));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumn =
        sort === "examYear"
          ? examResults.examYear
          : sort === "resultsYear"
            ? examResults.resultsYear
            : sort === "examType"
              ? examResults.examType
              : sort === "status"
                ? examResults.status
                : sort === "createdAt"
                  ? examResults.createdAt
                  : examResults.resultsYear;
      const orderFn = sortDir === "asc" ? asc : desc;

      const [countRow] = await db.select({ total: count() }).from(examResults).where(where).all();
      const total = countRow?.total ?? 0;

      const rows = await db
        .select()
        .from(examResults)
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset)
        .all();

      return {
        rows: rows.map(serializeResult),
        total,
        pageCount: Math.ceil(total / pageSize),
        page,
        pageSize,
      };
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const db = createDb();
      const row = await db.select().from(examResults).where(eq(examResults.id, input.id)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Exam result not found" });
      }

      if (row.status !== "published" && !(context.auth?.adminCalled ?? false)) {
        throw new ORPCError("NOT_FOUND", { message: "Exam result not found" });
      }

      const students = await db
        .select()
        .from(examStudents)
        .where(eq(examStudents.examResultId, row.id))
        .orderBy(asc(examStudents.sortOrder), asc(examStudents.createdAt))
        .all();

      return {
        ...serializeResult(row),
        students: students.map(serializeStudent),
      };
    }),

  /** Latest published exam results — most recent years first, for the homepage. */
  getRecent: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(6).default(3),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const rows = await db
        .select()
        .from(examResults)
        .where(eq(examResults.status, "published"))
        .orderBy(desc(examResults.resultsYear), desc(examResults.examYear))
        .limit(input.limit)
        .all();

      const results = [];
      for (const row of rows) {
        const students = await db
          .select()
          .from(examStudents)
          .where(eq(examStudents.examResultId, row.id))
          .orderBy(asc(examStudents.sortOrder), asc(examStudents.createdAt))
          .all();
        results.push({
          ...serializeResult(row),
          students: students.map(serializeStudent),
        });
      }
      return results;
    }),
};
