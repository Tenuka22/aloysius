import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { news } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import { authorTypeSchema, contentStatusSchema } from "../../schemas";
import { generateUniqueSlug } from "../../lib/slug";

/**
 * Super-user tier for news. Site admin only (see admin/index.ts). Handles
 * both general (no activityId) news and admin-authored overrides of
 * club-submitted news — always approved/published immediately, no review
 * workflow (that's the public `news` router's job for club self-service).
 */
export const adminNewsRouter = {
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().optional(),
        content: z.string(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        publishNow: z.boolean().optional(),
        authorName: z.string().optional(),
        authorType: authorTypeSchema.optional(),
        activityId: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const status: "draft" | "published" = input.publishNow ? "published" : "draft";
      const publishedAt = status === "published" ? new Date() : null;

      const id = crypto.randomUUID();
      const slug = input.slug
        ? await generateUniqueSlug(news, input.slug)
        : await generateUniqueSlug(news, input.title);

      const record = await db
        .insert(news)
        .values({
          id,
          slug,
          title: input.title,
          content: input.content,
          excerpt: input.excerpt ?? null,
          coverImage: input.coverImage ?? null,
          tags: input.tags ?? [],
          status,
          publishedAt,
          userId: context.auth.userId!,
          authorName: input.authorName ?? null,
          authorType: input.authorType ?? null,
          activityId: input.activityId ?? null,
          reviewStatus: "approved",
        })
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        content: record.content,
        excerpt: record.excerpt,
        coverImage: record.coverImage,
        tags: record.tags,
        status: record.status,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        authorName: record.authorName,
        authorType: record.authorType,
        activityId: record.activityId,
        reviewStatus: record.reviewStatus,
      };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        slug: z.string().optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        publishNow: z.boolean().optional(),
        authorName: z.string().optional(),
        authorType: authorTypeSchema.optional(),
        status: contentStatusSchema.optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db.select().from(news).where(eq(news.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "News not found" });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = { updatedAt: now };

      if (input.slug !== undefined) {
        updateData.slug = await generateUniqueSlug(news, input.slug, input.id);
      } else if (input.title !== undefined) {
        updateData.title = input.title;
        updateData.slug = await generateUniqueSlug(news, input.title, input.id);
      }
      if (input.content !== undefined) updateData.content = input.content;
      if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.authorName !== undefined) updateData.authorName = input.authorName;
      if (input.authorType !== undefined) updateData.authorType = input.authorType;
      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === "published" && existing.status !== "published") {
          updateData.publishedAt = now;
        }
      }
      if (input.publishNow === true && !existing.publishedAt) {
        updateData.publishedAt = now;
        updateData.status = "published";
      }

      const record = await db
        .update(news)
        .set(updateData)
        .where(eq(news.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        content: record.content,
        excerpt: record.excerpt,
        coverImage: record.coverImage,
        tags: record.tags,
        status: record.status,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        authorName: record.authorName,
        authorType: record.authorType,
        activityId: record.activityId,
        reviewStatus: record.reviewStatus,
      };
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const db = createDb();
    await db.delete(news).where(eq(news.id, input.id)).run();
    return { success: true };
  }),
};
