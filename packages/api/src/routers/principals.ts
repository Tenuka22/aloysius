import { z } from "zod";
import { eq, desc, asc, like, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { principals } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";

const sortDirection = z.enum(["asc", "desc"]);

export const principalsRouter = {
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirection.default("desc"),
        search: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, search, status } = input;
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (search) {
        conditions.push(like(principals.name, `%${search}%`));
      }
      if (status) {
        conditions.push(eq(principals.status, status));
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

      const [{ total }] = await db.select({ total: count() }).from(principals).where(where).all();

      const rows = await db
        .select()
        .from(principals)
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset)
        .all();

      return {
        rows: rows.map((row) => ({
          id: row.id,
          name: row.name,
          title: row.title,
          quote: row.quote,
          portrait: row.portrait,
          sortOrder: row.sortOrder,
          status: row.status,
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
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const row = await db.select().from(principals).where(eq(principals.id, input.id)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Principal not found" });
      }

      return {
        id: row.id,
        name: row.name,
        title: row.title,
        quote: row.quote,
        portrait: row.portrait,
        sortOrder: row.sortOrder,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        userId: row.userId,
      };
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

    return {
      id: row.id,
      name: row.name,
      title: row.title,
      quote: row.quote,
      portrait: row.portrait,
      sortOrder: row.sortOrder,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      userId: row.userId,
    };
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        title: z.string().optional(),
        quote: z.string().optional(),
        portrait: z.string().optional(),
        sortOrder: z.number().optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const id = crypto.randomUUID();
      const now = new Date();

      const db = createDb();
      const record = await db
        .insert(principals)
        .values({
          id,
          name: input.name,
          title: input.title ?? "Principal",
          quote: input.quote ?? null,
          portrait: input.portrait ?? null,
          sortOrder: input.sortOrder ?? 0,
          status: input.publishNow ? "published" : "draft",
          createdAt: now,
          updatedAt: now,
          userId: context.auth.userId,
        })
        .returning()
        .get();

      return {
        id: record.id,
        name: record.name,
        title: record.title,
        quote: record.quote,
        portrait: record.portrait,
        sortOrder: record.sortOrder,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        userId: record.userId,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        title: z.string().optional(),
        quote: z.string().optional(),
        portrait: z.string().optional(),
        sortOrder: z.number().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db
        .select()
        .from(principals)
        .where(eq(principals.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Principal not found" });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = {
        updatedAt: now,
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.title !== undefined) updateData.title = input.title;
      if (input.quote !== undefined) updateData.quote = input.quote;
      if (input.portrait !== undefined) updateData.portrait = input.portrait;
      if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
      if (input.status !== undefined) {
        updateData.status = input.status;
      } else if (input.publishNow === true) {
        updateData.status = "published";
      }

      const record = await db
        .update(principals)
        .set(updateData)
        .where(eq(principals.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        name: record.name,
        title: record.title,
        quote: record.quote,
        portrait: record.portrait,
        sortOrder: record.sortOrder,
        status: record.status,
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
        .from(principals)
        .where(eq(principals.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Principal not found" });
      }

      await db.delete(principals).where(eq(principals.id, input.id)).run();

      return { success: true };
    }),
};
