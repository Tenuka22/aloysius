import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { studentWorks } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import {
  authorTypeSchema,
  contentStatusSchema,
  studentWorkCategorySchema,
} from "../../schemas";
import { generateUniqueSlug } from "../../lib/slug";

/**
 * Super-user tier for student works. Site admin only (see admin/index.ts).
 */
export const adminStudentWorksRouter = {
  create: adminProcedure
    .input(
      z.object({
        slug: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: studentWorkCategorySchema.default("other"),
        studentNames: z.array(z.string()).optional(),
        studentGrade: z.string().optional(),
        authorType: authorTypeSchema.default("student"),
        coverImage: z.string().optional(),
        contentUrl: z.string().optional(),
        tags: z.array(z.string()).optional(),
        publishNow: z.boolean().optional(),
        activityId: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const status: "draft" | "published" = input.publishNow ? "published" : "draft";
      const publishedAt = status === "published" ? new Date() : null;

      const id = crypto.randomUUID();
      const slug = input.slug
        ? await generateUniqueSlug(studentWorks, input.slug)
        : await generateUniqueSlug(studentWorks, input.title);

      const record = await db
        .insert(studentWorks)
        .values({
          id,
          slug,
          title: input.title,
          description: input.description ?? null,
          category: input.category,
          studentNames: input.studentNames ?? [],
          studentGrade: input.studentGrade ?? null,
          authorType: input.authorType,
          coverImage: input.coverImage ?? null,
          contentUrl: input.contentUrl ?? null,
          tags: input.tags ?? [],
          status,
          publishedAt,
          userId: context.auth.userId!,
          activityId: input.activityId ?? null,
          reviewStatus: "approved",
        })
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        category: record.category,
        studentNames: record.studentNames,
        studentGrade: record.studentGrade,
        authorType: record.authorType,
        coverImage: record.coverImage,
        contentUrl: record.contentUrl,
        tags: record.tags,
        status: record.status,
        activityId: record.activityId,
        reviewStatus: record.reviewStatus,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        userId: record.userId,
      };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        slug: z.string().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        category: studentWorkCategorySchema.optional(),
        studentNames: z.array(z.string()).optional(),
        studentGrade: z.string().optional(),
        authorType: authorTypeSchema.optional(),
        coverImage: z.string().optional(),
        contentUrl: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: contentStatusSchema.optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db
        .select()
        .from(studentWorks)
        .where(eq(studentWorks.id, input.id))
        .get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Student work not found" });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = { updatedAt: now };

      if (input.slug !== undefined) {
        updateData.slug = await generateUniqueSlug(studentWorks, input.slug, input.id);
      }
      if (input.title !== undefined) {
        updateData.title = input.title;
        if (input.slug === undefined) {
          updateData.slug = await generateUniqueSlug(studentWorks, input.title, input.id);
        }
      }
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.studentNames !== undefined) updateData.studentNames = input.studentNames;
      if (input.studentGrade !== undefined) updateData.studentGrade = input.studentGrade;
      if (input.authorType !== undefined) updateData.authorType = input.authorType;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
      if (input.contentUrl !== undefined) updateData.contentUrl = input.contentUrl;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === "published" && !existing.publishedAt) {
          updateData.publishedAt = now;
        }
      } else if (input.publishNow === true && !existing.publishedAt) {
        updateData.publishedAt = now;
        updateData.status = "published";
      }

      const record = await db
        .update(studentWorks)
        .set(updateData)
        .where(eq(studentWorks.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        category: record.category,
        studentNames: record.studentNames,
        studentGrade: record.studentGrade,
        authorType: record.authorType,
        coverImage: record.coverImage,
        contentUrl: record.contentUrl,
        tags: record.tags,
        status: record.status,
        activityId: record.activityId,
        reviewStatus: record.reviewStatus,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        userId: record.userId,
      };
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const db = createDb();
    await db.delete(studentWorks).where(eq(studentWorks.id, input.id)).run();
    return { success: true };
  }),
};
