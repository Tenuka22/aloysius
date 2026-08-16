import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { announcements } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import { audienceSchema, authorTypeSchema, contentStatusSchema } from "../../schemas";
import { generateUniqueSlug } from "../../lib/slug";

/**
 * Super-user tier for announcements. Site admin only (see admin/index.ts).
 */
export const adminAnnouncementsRouter = {
  create: adminProcedure
    .input(
      z.object({
        slug: z.string().optional(),
        title: z.string().min(1),
        content: z.string(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        audience: audienceSchema.optional(),
        addressedTo: z.string().optional(),
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
        ? await generateUniqueSlug(announcements, input.slug)
        : await generateUniqueSlug(announcements, input.title);

      const record = await db
        .insert(announcements)
        .values({
          id,
          slug,
          title: input.title,
          content: input.content,
          excerpt: input.excerpt ?? null,
          coverImage: input.coverImage ?? null,
          tags: input.tags ?? [],
          status,
          audience: input.audience ?? "all",
          addressedTo: input.addressedTo ?? null,
          publishedAt,
          authorName: input.authorName ?? null,
          authorType: input.authorType ?? null,
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
        content: record.content,
        excerpt: record.excerpt,
        coverImage: record.coverImage,
        tags: record.tags,
        status: record.status,
        audience: record.audience,
        addressedTo: record.addressedTo,
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
        slug: z.string().optional(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        audience: audienceSchema.optional(),
        addressedTo: z.string().optional(),
        publishNow: z.boolean().optional(),
        authorName: z.string().optional(),
        authorType: authorTypeSchema.optional(),
        status: contentStatusSchema.optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db
        .select()
        .from(announcements)
        .where(eq(announcements.id, input.id))
        .get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Announcement not found" });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = { updatedAt: now };

      if (input.slug !== undefined) {
        updateData.slug = await generateUniqueSlug(announcements, input.slug, input.id);
      }
      if (input.title !== undefined) {
        updateData.title = input.title;
        if (input.slug === undefined) {
          updateData.slug = await generateUniqueSlug(announcements, input.title, input.id);
        }
      }
      if (input.content !== undefined) updateData.content = input.content;
      if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.audience !== undefined) updateData.audience = input.audience;
      if (input.addressedTo !== undefined) updateData.addressedTo = input.addressedTo;
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
        .update(announcements)
        .set(updateData)
        .where(eq(announcements.id, input.id))
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
        audience: record.audience,
        addressedTo: record.addressedTo,
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
    await db.delete(announcements).where(eq(announcements.id, input.id)).run();
    return { success: true };
  }),
};
