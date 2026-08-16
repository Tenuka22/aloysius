import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { gallery, galleryImages } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import { authorTypeSchema, contentStatusSchema } from "../../schemas";
import { generateUniqueSlug } from "../../lib/slug";

export const adminGalleryRouter = {
  create: adminProcedure
    .input(
      z.object({
        slug: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        eventId: z.string().optional(),
        obEventId: z.string().optional(),
        obDonationId: z.string().optional(),
        studentWorkId: z.string().optional(),
        achievementId: z.string().optional(),
        coverImage: z.string().optional(),
        authorName: z.string().optional(),
        authorType: authorTypeSchema.optional(),
        tags: z.array(z.string()).optional(),
        status: contentStatusSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const id = crypto.randomUUID();
      const now = new Date();
      const slug = input.slug
        ? await generateUniqueSlug(gallery, input.slug)
        : await generateUniqueSlug(gallery, input.title);

      const db = createDb();
      const record = await db
        .insert(gallery)
        .values({
          id,
          slug,
          title: input.title,
          description: input.description ?? null,
          eventId: input.eventId || null,
          obEventId: input.obEventId || null,
          obDonationId: input.obDonationId || null,
          studentWorkId: input.studentWorkId || null,
          achievementId: input.achievementId || null,
          coverImage: input.coverImage || null,
          authorName: input.authorName ?? null,
          authorType: input.authorType ?? null,
          tags: input.tags ?? [],
          status: input.status ?? "draft",
          publishedAt: input.status === "published" ? now : null,
          userId: context.auth.userId!,
        })
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        eventId: record.eventId,
        obEventId: record.obEventId,
        obDonationId: record.obDonationId,
        studentWorkId: record.studentWorkId,
        achievementId: record.achievementId,
        coverImage: record.coverImage,
        authorName: record.authorName,
        authorType: record.authorType,
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
        eventId: z.string().optional(),
        obEventId: z.string().optional(),
        obDonationId: z.string().optional(),
        studentWorkId: z.string().optional(),
        achievementId: z.string().optional(),
        coverImage: z.string().optional(),
        authorName: z.string().optional(),
        authorType: authorTypeSchema.optional(),
        tags: z.array(z.string()).optional(),
        status: contentStatusSchema.optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db.select().from(gallery).where(eq(gallery.id, input.id)).get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = {
        updatedAt: now,
      };

      if (input.slug !== undefined) {
        updateData.slug = await generateUniqueSlug(gallery, input.slug, input.id);
      }
      if (input.title !== undefined) {
        updateData.title = input.title;
        if (input.slug === undefined) {
          updateData.slug = await generateUniqueSlug(gallery, input.title, input.id);
        }
      }
      if (input.description !== undefined) updateData.description = input.description || null;
      if (input.eventId !== undefined) updateData.eventId = input.eventId || null;
      if (input.obEventId !== undefined) updateData.obEventId = input.obEventId || null;
      if (input.obDonationId !== undefined) updateData.obDonationId = input.obDonationId || null;
      if (input.studentWorkId !== undefined) updateData.studentWorkId = input.studentWorkId || null;
      if (input.achievementId !== undefined) updateData.achievementId = input.achievementId || null;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage || null;
      if (input.authorName !== undefined) updateData.authorName = input.authorName || null;
      if (input.authorType !== undefined) updateData.authorType = input.authorType || null;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === "published" && !existing.publishedAt) {
          updateData.publishedAt = now;
        }
      }

      const record = await db
        .update(gallery)
        .set(updateData)
        .where(eq(gallery.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        eventId: record.eventId,
        obEventId: record.obEventId,
        obDonationId: record.obDonationId,
        studentWorkId: record.studentWorkId,
        achievementId: record.achievementId,
        coverImage: record.coverImage,
        authorName: record.authorName,
        authorType: record.authorType,
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
    const existing = await db.select().from(gallery).where(eq(gallery.id, input.id)).get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
    }

    await db.delete(gallery).where(eq(gallery.id, input.id)).run();

    return { success: true };
  }),

  addImage: adminProcedure
    .input(
      z.object({
        galleryId: z.string(),
        url: z.string().min(1),
        caption: z.string().optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const existingGallery = await db
        .select()
        .from(gallery)
        .where(eq(gallery.id, input.galleryId))
        .get();

      if (!existingGallery) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }

      const id = crypto.randomUUID();
      const record = await db
        .insert(galleryImages)
        .values({
          id,
          galleryId: input.galleryId,
          url: input.url,
          caption: input.caption ?? null,
          sortOrder: input.sortOrder ?? 0,
        })
        .returning()
        .get();

      return {
        id: record.id,
        galleryId: record.galleryId,
        url: record.url,
        caption: record.caption,
        sortOrder: record.sortOrder,
        createdAt: record.createdAt.toISOString(),
      };
    }),

  removeImage: adminProcedure.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const db = createDb();
    const existing = await db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.id, input.id))
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Gallery image not found" });
    }

    await db.delete(galleryImages).where(eq(galleryImages.id, input.id)).run();

    return { success: true };
  }),

  updateImage: adminProcedure
    .input(
      z.object({
        id: z.string(),
        caption: z.string().optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db
        .select()
        .from(galleryImages)
        .where(eq(galleryImages.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery image not found" });
      }

      const updateData: Record<string, unknown> = {};
      if (input.caption !== undefined) updateData.caption = input.caption;
      if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

      const record = await db
        .update(galleryImages)
        .set(updateData)
        .where(eq(galleryImages.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        galleryId: record.galleryId,
        url: record.url,
        caption: record.caption,
        sortOrder: record.sortOrder,
        createdAt: record.createdAt.toISOString(),
      };
    }),
};
