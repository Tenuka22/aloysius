import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { achievements } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import {
  achievementCategorySchema,
  authorTypeSchema,
  contentStatusSchema,
} from "../../schemas";
import { generateUniqueSlug } from "../../lib/slug";

/**
 * Super-user tier for achievements. Site admin only (see admin/index.ts) —
 * achievements have no self-service/club-scoped authoring concept.
 */
export const adminAchievementsRouter = {
  create: adminProcedure
    .input(
      z.object({
        slug: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: achievementCategorySchema.optional(),
        recipientNames: z.array(z.string()).optional(),
        recipientType: authorTypeSchema.optional(),
        year: z.number().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const id = crypto.randomUUID();
      const now = new Date();
      const slug = input.slug
        ? await generateUniqueSlug(achievements, input.slug)
        : await generateUniqueSlug(achievements, input.title);

      const db = createDb();
      const record = await db
        .insert(achievements)
        .values({
          id,
          slug,
          title: input.title,
          description: input.description ?? null,
          category: input.category ?? "other",
          recipientNames: input.recipientNames ?? [],
          recipientType: input.recipientType ?? "student",
          year: input.year ?? null,
          coverImage: input.coverImage ?? null,
          tags: input.tags ?? [],
          status: input.publishNow ? "published" : "draft",
          publishedAt: input.publishNow ? now : null,
          userId: context.auth.userId!,
        })
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        category: record.category,
        recipientNames: record.recipientNames,
        recipientType: record.recipientType,
        year: record.year,
        coverImage: record.coverImage,
        tags: record.tags,
        status: record.status,
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
        category: achievementCategorySchema.optional(),
        recipientNames: z.array(z.string()).optional(),
        recipientType: authorTypeSchema.optional(),
        year: z.number().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: contentStatusSchema.optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db
        .select()
        .from(achievements)
        .where(eq(achievements.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Achievement not found" });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = {
        updatedAt: now,
      };

      if (input.slug !== undefined) {
        updateData.slug = await generateUniqueSlug(achievements, input.slug, input.id);
      }
      if (input.title !== undefined) {
        updateData.title = input.title;
        if (input.slug === undefined) {
          updateData.slug = await generateUniqueSlug(achievements, input.title, input.id);
        }
      }
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.recipientNames !== undefined) updateData.recipientNames = input.recipientNames;
      if (input.recipientType !== undefined) updateData.recipientType = input.recipientType;
      if (input.year !== undefined) updateData.year = input.year;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
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
        .update(achievements)
        .set(updateData)
        .where(eq(achievements.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        category: record.category,
        recipientNames: record.recipientNames,
        recipientType: record.recipientType,
        year: record.year,
        coverImage: record.coverImage,
        tags: record.tags,
        status: record.status,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        userId: record.userId,
      };
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const db = createDb();
    await db.delete(achievements).where(eq(achievements.id, input.id)).run();
    return { success: true };
  }),
};
