import { z } from "zod";
import { eq, desc, asc, like, and, or, isNotNull, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { gallery, galleryImages } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { publicProcedure } from "../index";
import { contentStatusSchema, sortDirectionSchema } from "../schemas";
import { checkSlugUnique } from "../lib/slug";
import { isOBAdmin } from "../lib/ob-admin";

export const galleryRouter = {
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirectionSchema.default("desc"),
        search: z.string().optional(),
        status: contentStatusSchema.optional(),
        eventId: z.string().optional(),
        obEventId: z.string().optional(),
        obDonationId: z.string().optional(),
        // "ob": galleries linked to any Old Boys' Association event or donation.
        scope: z.enum(["ob"]).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, search, status, eventId, obEventId, obDonationId, scope } =
        input;
      const offset = (page - 1) * pageSize;
      const isSiteAdmin = context.auth?.role === "admin";

      const conditions = [];
      if (search) {
        conditions.push(like(gallery.title, `%${search}%`));
      }
      if (status) {
        if (!isSiteAdmin && status !== "published") {
          throw new ORPCError("UNAUTHORIZED", { message: "Site admin access required." });
        }
        conditions.push(eq(gallery.status, status));
      } else if (!isSiteAdmin) {
        conditions.push(eq(gallery.status, "published"));
      }
      if (eventId) {
        conditions.push(eq(gallery.eventId, eventId));
      }
      if (obEventId) {
        conditions.push(eq(gallery.obEventId, obEventId));
      }
      if (obDonationId) {
        conditions.push(eq(gallery.obDonationId, obDonationId));
      }
      if (scope === "ob") {
        conditions.push(or(isNotNull(gallery.obEventId), isNotNull(gallery.obDonationId))!);
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

      const [countRow] = await db.select({ total: count() }).from(gallery).where(where).all();
      const total = countRow?.total ?? 0;

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
          obEventId: row.obEventId,
          obDonationId: row.obDonationId,
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
    .handler(async ({ input, context }) => {
      const db = createDb();
      const row =
        "id" in input
          ? await db.select().from(gallery).where(eq(gallery.id, input.id)).get()
          : await db.select().from(gallery).where(eq(gallery.slug, input.slug)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }

      if (row.status !== "published") {
        const isSiteAdmin = context.auth?.role === "admin";
        const userId = context.auth?.userId ?? null;
        const isAuthor = userId !== null && userId === row.userId;
        const isObScopeGallery = !row.eventId && !row.studentWorkId && !row.achievementId;
        const callerIsOBAdmin =
          userId !== null && isObScopeGallery && (await isOBAdmin(userId));
        if (!isSiteAdmin && !isAuthor && !callerIsOBAdmin) {
          throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
        }
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
        obEventId: row.obEventId,
        obDonationId: row.obDonationId,
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

  listImages: publicProcedure
    .input(
      z.object({
        galleryId: z.string(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const { galleryId, page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const [countRow] = await db
        .select({ total: count() })
        .from(galleryImages)
        .where(eq(galleryImages.galleryId, galleryId))
        .all();
      const total = countRow?.total ?? 0;

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

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .handler(async ({ input }) => {
      return checkSlugUnique(gallery, input.slug, input.excludeId);
    }),
};
