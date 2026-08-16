import { z } from "zod";
import { eq, desc, asc, like, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { principals } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { publicProcedure } from "../index";
import { contentStatusSchema, sortDirectionSchema } from "../schemas";
import { checkSlugUnique } from "../lib/slug";

function serializePrincipal(row: typeof principals.$inferSelect) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    title: row.title,
    quote: row.quote,
    message: row.message,
    bio: row.bio,
    education: row.education,
    tenure: row.tenure,
    year: row.year,
    portrait: row.portrait,
    sortOrder: row.sortOrder,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    userId: row.userId,
  };
}

export const principalsRouter = {
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirectionSchema.default("desc"),
        search: z.string().optional(),
        status: contentStatusSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, search, status } = input;
      const offset = (page - 1) * pageSize;
      const isSiteAdmin = context.auth?.adminCalled ?? false;

      const conditions = [];
      if (search) {
        conditions.push(like(principals.name, `%${search}%`));
      }
      if (status) {
        if (status !== "published" && !isSiteAdmin) {
          throw new ORPCError("UNAUTHORIZED", { message: "Site admin access required." });
        }
        conditions.push(eq(principals.status, status));
      } else if (!isSiteAdmin) {
        conditions.push(eq(principals.status, "published"));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumn =
        sort === "name"
          ? principals.name
          : sort === "sortOrder"
            ? principals.sortOrder
            : sort === "status"
              ? principals.status
              : sort === "createdAt"
                ? principals.createdAt
                : principals.sortOrder;
      const orderFn = sortDir === "asc" ? asc : desc;

      const [countRow] = await db.select({ total: count() }).from(principals).where(where).all();
      const total = countRow?.total ?? 0;

      const rows = await db
        .select()
        .from(principals)
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset)
        .all();

      return {
        rows: rows.map(serializePrincipal),
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
          ? await db.select().from(principals).where(eq(principals.id, input.id)).get()
          : await db.select().from(principals).where(eq(principals.slug, input.slug)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Principal not found" });
      }

      if (row.status !== "published" && !(context.auth?.adminCalled ?? false)) {
        throw new ORPCError("NOT_FOUND", { message: "Principal not found" });
      }

      return serializePrincipal(row);
    }),

  getCurrent: publicProcedure.handler(async () => {
    const db = createDb();
    const row = await db
      .select()
      .from(principals)
      .where(eq(principals.status, "published"))
      .orderBy(asc(principals.sortOrder), desc(principals.createdAt))
      .limit(1)
      .get();

    if (!row) {
      return null;
    }

    return serializePrincipal(row);
  }),

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .handler(async ({ input }) => {
      return checkSlugUnique(principals, input.slug, input.excludeId);
    }),
};
