import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { examResults, examStudents, universityAdmissions } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import { contentStatusSchema, examTypeSchema, streamSchema } from "../../schemas";

const studentInput = z.object({
  name: z.string().min(1, "Name is required"),
  photo: z.string().optional(),
  quote: z.string().optional(),
  marks: z.number().optional(),
  overallGrade: z.string().optional(),
  stream: streamSchema.optional(),
  subjects: z.array(z.object({ subject: z.string(), grade: z.string() })).default([]),
  sortOrder: z.number().optional(),
});

const admissionInput = z.object({
  studentName: z.string().min(1, "Student name is required"),
  university: z.string().min(1, "University is required"),
  course: z.string().min(1, "Course is required"),
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

function mapAdmission(
  admission: z.infer<typeof admissionInput>,
  examResultId: string,
  now: Date,
) {
  return {
    id: crypto.randomUUID(),
    examResultId,
    studentName: admission.studentName,
    university: admission.university,
    course: admission.course,
    sortOrder: admission.sortOrder ?? 0,
    createdAt: now,
  };
}

/**
 * Super-user tier for exam results. Site admin only (see admin/index.ts) —
 * exam results have no self-service/club-scoped authoring concept.
 */
export const adminExamResultsRouter = {
  create: adminProcedure
    .input(
      z.object({
        examType: examTypeSchema,
        examYear: z.number().int().min(1900).max(2100),
        resultsYear: z.number().int().min(1900).max(2100),
        publishNow: z.boolean().optional(),
        students: z.array(studentInput).default([]),
        universityAdmissions: z.array(admissionInput).default([]),
      }),
    )
    .handler(async ({ input, context }) => {
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
          userId: context.auth.userId!,
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

      if (input.universityAdmissions.length > 0) {
        await db
          .insert(universityAdmissions)
          .values(input.universityAdmissions.map((a) => mapAdmission(a, id, now)))
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
        universityAdmissions: input.universityAdmissions.map((a) => ({
          id: "",
          examResultId: id,
          studentName: a.studentName,
          university: a.university,
          course: a.course,
          sortOrder: a.sortOrder ?? 0,
          createdAt: now.toISOString(),
        })),
      };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        examType: examTypeSchema.optional(),
        examYear: z.number().int().min(1900).max(2100).optional(),
        resultsYear: z.number().int().min(1900).max(2100).optional(),
        status: contentStatusSchema.optional(),
        publishNow: z.boolean().optional(),
        students: z.array(studentInput).optional(),
        universityAdmissions: z.array(admissionInput).optional(),
      }),
    )
    .handler(async ({ input }) => {
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

      if (input.universityAdmissions !== undefined) {
        await db
          .delete(universityAdmissions)
          .where(eq(universityAdmissions.examResultId, input.id))
          .run();
        if (input.universityAdmissions.length > 0) {
          await db
            .insert(universityAdmissions)
            .values(input.universityAdmissions.map((a) => mapAdmission(a, input.id, now)))
            .run();
        }
      }

      const students = await db
        .select()
        .from(examStudents)
        .where(eq(examStudents.examResultId, input.id))
        .orderBy(asc(examStudents.sortOrder), asc(examStudents.createdAt))
        .all();

      const admissions = await db
        .select()
        .from(universityAdmissions)
        .where(eq(universityAdmissions.examResultId, input.id))
        .orderBy(asc(universityAdmissions.sortOrder), asc(universityAdmissions.createdAt))
        .all();

      return {
        ...serializeResult(record),
        students: students.map(serializeStudent),
        universityAdmissions: admissions.map(serializeAdmission),
      };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
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
