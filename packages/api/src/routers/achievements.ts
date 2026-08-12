import { z } from "zod";
import { eq, desc, asc, like, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { achievements } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { generateUniqueSlug, checkSlugUnique } from "../lib/slug";

const sortDirection = z.enum(["asc", "desc"]);

export const achievementsRouter = {
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirection.default("desc"),
        search: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        category: z.enum(["academic", "sports", "arts", "clubs", "community", "other"]).optional(),
        year: z.number().optional(),
      })
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, search, status, category, year } = input;
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (search) {
        conditions.push(like(achievements.title, `%${search}%`));
      }
      if (status) {
        conditions.push(eq(achievements.status, status));
      }
      if (category) {
        conditions.push(eq(achievements.category, category));
      }
      if (year) {
        conditions.push(eq(achievements.year, year));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumn =
        sort === "title"
          ? achievements.title
          : sort === "category"
            ? achievements.category
            : sort === "year"
              ? achievements.year
              : sort === "status"
                ? achievements.status
                : sort === "createdAt"
                  ? achievements.createdAt
                  : achievements.createdAt;
      const orderFn = sortDir === "asc" ? asc : desc;

      const [{ total }] = await db
        .select({ total: count() })
        .from(achievements)
        .where(where)
        .all();

      const rows = await db
        .select()
        .from(achievements)
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
          category: row.category,
          recipientNames: row.recipientNames,
          recipientType: row.recipientType,
          year: row.year,
          coverImage: row.coverImage,
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
        ? await db.select().from(achievements).where(eq(achievements.id, input.id)).get()
        : await db.select().from(achievements).where(eq(achievements.slug, input.slug)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Achievement not found" });
      }

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        category: row.category,
        recipientNames: row.recipientNames,
        recipientType: row.recipientType,
        year: row.year,
        coverImage: row.coverImage,
        tags: row.tags,
        status: row.status,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        userId: row.userId,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        slug: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["academic", "sports", "arts", "clubs", "community", "other"]).optional(),
        recipientNames: z.array(z.string()).optional(),
        recipientType: z.enum(["student", "faculty", "club", "org"]).optional(),
        year: z.number().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        publishNow: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const id = crypto.randomUUID();
      const now = new Date();
      const slug = input.slug ? await generateUniqueSlug(achievements, input.slug) : await generateUniqueSlug(achievements, input.title);

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
          userId: context.auth.userId,
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        slug: z.string().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.enum(["academic", "sports", "arts", "clubs", "community", "other"]).optional(),
        recipientNames: z.array(z.string()).optional(),
        recipientType: z.enum(["student", "faculty", "club", "org"]).optional(),
        year: z.number().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        publishNow: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

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

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db
        .select()
        .from(achievements)
        .where(eq(achievements.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Achievement not found" });
      }

      await db
        .delete(achievements)
        .where(eq(achievements.id, input.id))
        .run();

      return { success: true };
    }),

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .handler(async ({ input }) => {
      return checkSlugUnique(achievements, input.slug, input.excludeId);
    }),
};
