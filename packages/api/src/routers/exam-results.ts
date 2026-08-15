import { z } from "zod";
import { eq, desc, asc, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { examResults, examStudents } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";

const sortDirection = z.enum(["asc", "desc"]);
const examTypeEnum = z.enum(["scholarship", "ol", "al"]);

const studentInput = z.object({
  name: z.string().min(1, "Name is required"),
  photo: z.string().optional(),
  quote: z.string().optional(),
  marks: z.number().optional(),
  overallGrade: z.string().optional(),
  stream: z
    .enum(["physical_science", "biological_science", "commerce", "arts", "technology"])
    .optional(),
  subjects: z.array(z.object({ subject: z.string(), grade: z.string() })).default([]),
  sortOrder: z.number().optional(),
});

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
        sortDir: sortDirection.default("desc"),
        examType: examTypeEnum.optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, examType, status } = input;
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (examType) {
        conditions.push(eq(examResults.examType, examType));
      }
      if (status) {
        conditions.push(eq(examResults.status, status));
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

  get: publicProcedure.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const db = createDb();
    const row = await db.select().from(examResults).where(eq(examResults.id, input.id)).get();

    if (!row) {
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

  create: protectedProcedure
    .input(
      z.object({
        examType: examTypeEnum,
        examYear: z.number().int().min(1900).max(2100),
        resultsYear: z.number().int().min(1900).max(2100),
        publishNow: z.boolean().optional(),
        students: z.array(studentInput).default([]),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const id = crypto.randomUUID();
      const now = new Date();

      const db = createDb();
      const record = await db
        .insert(examResults)
        .values({
          id,
          examType: input.examType,
          examYear: input.examYear,
          resultsYear: input.resultsYear,
          status: input.publishNow ? "published" : "draft",
          createdAt: now,
          updatedAt: now,
          userId: context.auth.userId,
        })
        .returning()
        .get();

      if (input.students.length > 0) {
        await db
          .insert(examStudents)
          .values(
            input.students.map((s, index) => ({
              id: crypto.randomUUID(),
              examResultId: id,
              name: s.name,
              photo: s.photo ?? null,
              quote: s.quote ?? null,
              marks: s.marks ?? null,
              overallGrade: s.overallGrade ?? null,
              stream: s.stream ?? null,
              subjects: s.subjects,
              sortOrder: s.sortOrder ?? index,
              createdAt: now,
            })),
          )
          .run();
      }

      return {
        ...serializeResult(record),
        students: input.students.map((s, index) => ({
          id: "",
          examResultId: id,
          name: s.name,
          photo: s.photo ?? null,
          quote: s.quote ?? null,
          marks: s.marks ?? null,
          overallGrade: s.overallGrade ?? null,
          stream: s.stream ?? null,
          subjects: s.subjects,
          sortOrder: s.sortOrder ?? index,
          createdAt: now.toISOString(),
        })),
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        examType: examTypeEnum.optional(),
        examYear: z.number().int().min(1900).max(2100).optional(),
        resultsYear: z.number().int().min(1900).max(2100).optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        publishNow: z.boolean().optional(),
        students: z.array(studentInput).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db
        .select()
        .from(examResults)
        .where(eq(examResults.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Exam result not found" });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = {
        updatedAt: now,
      };

      if (input.examType !== undefined) updateData.examType = input.examType;
      if (input.examYear !== undefined) updateData.examYear = input.examYear;
      if (input.resultsYear !== undefined) updateData.resultsYear = input.resultsYear;
      if (input.status !== undefined) {
        updateData.status = input.status;
      } else if (input.publishNow === true) {
        updateData.status = "published";
      }

      const record = await db
        .update(examResults)
        .set(updateData)
        .where(eq(examResults.id, input.id))
        .returning()
        .get();

      if (input.students !== undefined) {
        await db.delete(examStudents).where(eq(examStudents.examResultId, input.id)).run();
        if (input.students.length > 0) {
          await db
            .insert(examStudents)
            .values(
              input.students.map((s, index) => ({
                id: crypto.randomUUID(),
                examResultId: input.id,
                name: s.name,
                photo: s.photo ?? null,
                quote: s.quote ?? null,
                marks: s.marks ?? null,
                overallGrade: s.overallGrade ?? null,
                stream: s.stream ?? null,
                subjects: s.subjects,
                sortOrder: s.sortOrder ?? index,
                createdAt: now,
              })),
            )
            .run();
        }
      }

      const students = await db
        .select()
        .from(examStudents)
        .where(eq(examStudents.examResultId, input.id))
        .orderBy(asc(examStudents.sortOrder), asc(examStudents.createdAt))
        .all();

      return {
        ...serializeResult(record),
        students: students.map(serializeStudent),
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db
        .select()
        .from(examResults)
        .where(eq(examResults.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Exam result not found" });
      }

      await db.delete(examStudents).where(eq(examStudents.examResultId, input.id)).run();
      await db.delete(examResults).where(eq(examResults.id, input.id)).run();

      return { success: true };
    }),
};
