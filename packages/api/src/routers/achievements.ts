import { z } from "zod";
import { eq, desc, asc, like, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { achievements } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { publicProcedure } from "../index";
import {
  achievementCategorySchema,
  contentStatusSchema,
  sortDirectionSchema,
} from "../schemas";
import { checkSlugUnique } from "../lib/slug";

export const achievementsRouter = {
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirectionSchema.default("desc"),
        search: z.string().optional(),
        status: contentStatusSchema.optional(),
        category: achievementCategorySchema.optional(),
        year: z.number().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, search, status, category, year } = input;
      const offset = (page - 1) * pageSize;
      const isSiteAdmin = context.auth?.adminCalled ?? false;

      const conditions = [];
      if (search) {
        conditions.push(like(achievements.title, `%${search}%`));
      }
      if (status) {
        if (status !== "published" && !isSiteAdmin) {
          throw new ORPCError("UNAUTHORIZED", { message: "Site admin access required." });
        }
        conditions.push(eq(achievements.status, status));
      } else if (!isSiteAdmin) {
        conditions.push(eq(achievements.status, "published"));
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

      const [countRow] = await db.select({ total: count() }).from(achievements).where(where).all();
      const total = countRow?.total ?? 0;

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
    .handler(async ({ input, context }) => {
      const db = createDb();
      const row =
        "id" in input
          ? await db.select().from(achievements).where(eq(achievements.id, input.id)).get()
          : await db.select().from(achievements).where(eq(achievements.slug, input.slug)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Achievement not found" });
      }

      if (row.status !== "published" && !(context.auth?.adminCalled ?? false)) {
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

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .handler(async ({ input }) => {
      return checkSlugUnique(achievements, input.slug, input.excludeId);
    }),
};
