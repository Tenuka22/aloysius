import { z } from "zod";
import { eq, desc, asc, and, count, or, like } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { pages } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";

const sortDirection = z.enum(["asc", "desc"]);

export const pagesRouter = {
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirection.default("desc"),
        search: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      })
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, search, status } = input;
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (search) {
        conditions.push(
          or(
            like(pages.title, `%${search}%`),
            like(pages.slug, `%${search}%`)
          )
        );
      }
      if (status) {
        conditions.push(eq(pages.status, status));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumn =
        sort === "title"
          ? pages.title
          : sort === "slug"
            ? pages.slug
            : sort === "status"
              ? pages.status
              : sort === "publishedAt"
                ? pages.publishedAt
                : sort === "createdAt"
                  ? pages.createdAt
                  : pages.createdAt;
      const orderFn = sortDir === "asc" ? asc : desc;

      const [result] = await db
        .select({ total: count() })
        .from(pages)
        .where(where)
        .all();
      const total = result?.total ?? 0;

      const rows = await db
        .select()
        .from(pages)
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
          content: row.content,
          excerpt: row.excerpt,
          coverImage: row.coverImage,
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
    .input(z.object({ id: z.string().optional(), slug: z.string().optional() }))
    .handler(async ({ input }) => {
      const db = createDb();

      if (!input.id && !input.slug) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Either id or slug must be provided",
        });
      }

      const row = await db
        .select()
        .from(pages)
        .where(
          input.id
            ? eq(pages.id, input.id)
            : eq(pages.slug, input.slug!)
        )
        .get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Page not found" });
      }

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        content: row.content,
        excerpt: row.excerpt,
        coverImage: row.coverImage,
        status: row.status,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        userId: row.userId,
      };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const row = await db
        .select()
        .from(pages)
        .where(eq(pages.slug, input.slug))
        .get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Page not found" });
      }

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        content: row.content,
        excerpt: row.excerpt,
        coverImage: row.coverImage,
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
        slug: z.string().min(1),
        title: z.string().min(1),
        content: z.string(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const now = new Date();

      const existing = await db
        .select()
        .from(pages)
        .where(eq(pages.slug, input.slug))
        .get();

      if (existing) {
        throw new ORPCError("CONFLICT", {
          message: "A page with this slug already exists",
        });
      }

      const record = await db
        .insert(pages)
        .values({
          id: crypto.randomUUID(),
          slug: input.slug,
          title: input.title,
          content: input.content,
          excerpt: input.excerpt ?? null,
          coverImage: input.coverImage ?? null,
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
        content: record.content,
        excerpt: record.excerpt,
        coverImage: record.coverImage,
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
        slug: z.string().min(1).optional(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
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
        .from(pages)
        .where(eq(pages.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Page not found" });
      }

      if (input.slug && input.slug !== existing.slug) {
        const slugTaken = await db
          .select()
          .from(pages)
          .where(eq(pages.slug, input.slug))
          .get();

        if (slugTaken) {
          throw new ORPCError("CONFLICT", {
            message: "A page with this slug already exists",
          });
        }
      }

      const now = new Date();
      const updateData: Record<string, unknown> = {
        updatedAt: now,
      };

      if (input.slug !== undefined) updateData.slug = input.slug;
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === "published" && !existing.publishedAt) {
          updateData.publishedAt = now;
        }
      }

      const record = await db
        .update(pages)
        .set(updateData)
        .where(eq(pages.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        content: record.content,
        excerpt: record.excerpt,
        coverImage: record.coverImage,
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
        .from(pages)
        .where(eq(pages.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Page not found" });
      }

      await db.delete(pages).where(eq(pages.id, input.id)).run();

      return { success: true };
    }),
};
