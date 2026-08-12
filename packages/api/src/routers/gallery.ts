import { z } from "zod";
import { eq, desc, asc, like, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { gallery, galleryImages } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { generateUniqueSlug, checkSlugUnique } from "../lib/slug";

const sortDirection = z.enum(["asc", "desc"]);

export const galleryRouter = {
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirection.default("desc"),
        search: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        eventId: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, search, status, eventId } = input;
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (search) {
        conditions.push(like(gallery.title, `%${search}%`));
      }
      if (status) {
        conditions.push(eq(gallery.status, status));
      }
      if (eventId) {
        conditions.push(eq(gallery.eventId, eventId));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumn =
        sort === "title"
          ? gallery.title
          : sort === "status"
            ? gallery.status
            : sort === "createdAt"
              ? gallery.createdAt
              : sort === "publishedAt"
                ? gallery.publishedAt
                : gallery.createdAt;
      const orderFn = sortDir === "asc" ? asc : desc;

      const [{ total }] = await db
        .select({ total: count() })
        .from(gallery)
        .where(where)
        .all();

      const rows = await db
        .select()
        .from(gallery)
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset)
        .all();

      return {
        rows: rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          eventId: row.eventId,
          studentWorkId: row.studentWorkId,
          achievementId: row.achievementId,
          coverImage: row.coverImage,
          authorName: row.authorName,
          authorType: row.authorType,
          tags: row.tags,
          status: row.status,
          publishedAt: row.publishedAt?.toISOString() ?? null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          userId: row.userId,
        })),
        total,
        pageCount: Math.ceil(total / pageSize),
        page,
        pageSize,
      };
    }),

  get: publicProcedure
    .input(z.union([z.object({ id: z.string() }), z.object({ slug: z.string() })]))
    .handler(async ({ input }) => {
      const db = createDb();
      const row = "id" in input
        ? await db.select().from(gallery).where(eq(gallery.id, input.id)).get()
        : await db.select().from(gallery).where(eq(gallery.slug, input.slug)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }

      const images = await db
        .select()
        .from(galleryImages)
        .where(eq(galleryImages.galleryId, row.id))
        .orderBy(asc(galleryImages.sortOrder))
        .all();

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        eventId: row.eventId,
        studentWorkId: row.studentWorkId,
        achievementId: row.achievementId,
        coverImage: row.coverImage,
        authorName: row.authorName,
        authorType: row.authorType,
        tags: row.tags,
        status: row.status,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        userId: row.userId,
        images: images.map((img) => ({
          id: img.id,
          galleryId: img.galleryId,
          url: img.url,
          caption: img.caption,
          sortOrder: img.sortOrder,
          createdAt: img.createdAt.toISOString(),
        })),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        slug: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        eventId: z.string().optional(),
        studentWorkId: z.string().optional(),
        achievementId: z.string().optional(),
        coverImage: z.string().optional(),
        authorName: z.string().optional(),
        authorType: z.enum(["student", "faculty", "club", "org"]).optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const id = crypto.randomUUID();
      const now = new Date();
      const slug = input.slug ? await generateUniqueSlug(gallery, input.slug) : await generateUniqueSlug(gallery, input.title);

      const db = createDb();
      const record = await db
        .insert(gallery)
        .values({
          id,
          slug,
          title: input.title,
          description: input.description ?? null,
          eventId: input.eventId || null,
          studentWorkId: input.studentWorkId || null,
          achievementId: input.achievementId || null,
          coverImage: input.coverImage || null,
          authorName: input.authorName ?? null,
          authorType: input.authorType ?? null,
          tags: input.tags ?? [],
          status: input.status ?? "draft",
          publishedAt: input.status === "published" ? now : null,
          userId: context.auth.userId,
        })
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        eventId: record.eventId,
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        slug: z.string().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        eventId: z.string().optional(),
        studentWorkId: z.string().optional(),
        achievementId: z.string().optional(),
        coverImage: z.string().optional(),
        authorName: z.string().optional(),
        authorType: z.enum(["student", "faculty", "club", "org"]).optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db
        .select()
        .from(gallery)
        .where(eq(gallery.id, input.id))
        .get();

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

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db
        .select()
        .from(gallery)
        .where(eq(gallery.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }

      await db
        .delete(gallery)
        .where(eq(gallery.id, input.id))
        .run();

      return { success: true };
    }),

  listImages: publicProcedure
    .input(
      z.object({
        galleryId: z.string(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const { galleryId, page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const [{ total }] = await db
        .select({ total: count() })
        .from(galleryImages)
        .where(eq(galleryImages.galleryId, galleryId))
        .all();

      const rows = await db
        .select()
        .from(galleryImages)
        .where(eq(galleryImages.galleryId, galleryId))
        .orderBy(asc(galleryImages.sortOrder))
        .limit(pageSize)
        .offset(offset)
        .all();

      return {
        rows: rows.map((row) => ({
          id: row.id,
          galleryId: row.galleryId,
          url: row.url,
          caption: row.caption,
          sortOrder: row.sortOrder,
          createdAt: row.createdAt.toISOString(),
        })),
        total,
        pageCount: Math.ceil(total / pageSize),
        page,
        pageSize,
      };
    }),

  addImage: protectedProcedure
    .input(
      z.object({
        galleryId: z.string(),
        url: z.string().min(1),
        caption: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

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

  removeImage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db
        .select()
        .from(galleryImages)
        .where(eq(galleryImages.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery image not found" });
      }

      await db
        .delete(galleryImages)
        .where(eq(galleryImages.id, input.id))
        .run();

      return { success: true };
    }),

  updateImage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        caption: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

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

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .handler(async ({ input }) => {
      return checkSlugUnique(gallery, input.slug, input.excludeId);
    }),
};
