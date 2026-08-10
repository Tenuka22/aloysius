import { z } from "zod";
import { eq, desc, asc, like, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { announcements } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";

const sortDirection = z.enum(["asc", "desc"]);

export const announcementsRouter = {
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirection.default("desc"),
        search: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        audience: z.enum(["all", "students", "parents", "staff", "alumni"]).optional(),
      })
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, search, status, audience } = input;
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (search) {
        conditions.push(like(announcements.title, `%${search}%`));
      }
      if (status) {
        conditions.push(eq(announcements.status, status));
      }
      if (audience) {
        conditions.push(eq(announcements.audience, audience));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumn =
        sort === "title"
          ? announcements.title
          : sort === "status"
            ? announcements.status
            : sort === "audience"
              ? announcements.audience
              : sort === "createdAt"
                ? announcements.createdAt
                : announcements.createdAt;
      const orderFn = sortDir === "asc" ? asc : desc;

      const [{ total }] = await db
        .select({ total: count() })
        .from(announcements)
        .where(where)
        .all();

      const rows = await db
        .select()
        .from(announcements)
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset)
        .all();

      return {
        rows: rows.map((row) => ({
          id: row.id,
          title: row.title,
          excerpt: row.excerpt,
          coverImage: row.coverImage,
          tags: row.tags,
          status: row.status,
          audience: row.audience,
          addressedTo: row.addressedTo,
          publishedAt: row.publishedAt?.toISOString() ?? null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          authorName: row.authorName,
          authorType: row.authorType,
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
      const row = await db
        .select()
        .from(announcements)
        .where(eq(announcements.id, input.id))
        .get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Announcement not found" });
      }

      return {
        id: row.id,
        title: row.title,
        content: row.content,
        excerpt: row.excerpt,
        coverImage: row.coverImage,
        tags: row.tags,
        status: row.status,
        audience: row.audience,
        addressedTo: row.addressedTo,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        authorName: row.authorName,
        authorType: row.authorType,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        audience: z.enum(["all", "students", "parents", "staff", "alumni"]).optional(),
        addressedTo: z.string().optional(),
        publishNow: z.boolean().optional(),
        authorName: z.string().optional(),
        authorType: z.enum(["student", "faculty", "club", "org"]).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const id = crypto.randomUUID();
      const now = new Date();

      const db = createDb();
      const record = await db
        .insert(announcements)
        .values({
          id,
          title: input.title,
          content: input.content,
          excerpt: input.excerpt ?? null,
          coverImage: input.coverImage ?? null,
          tags: input.tags ?? [],
          status: input.publishNow ? "published" : "draft",
          audience: input.audience ?? "all",
          addressedTo: input.addressedTo ?? null,
          publishedAt: input.publishNow ? now : null,
          authorName: input.authorName ?? null,
          authorType: input.authorType ?? null,
          userId: context.auth.userId,
        })
        .returning()
        .get();

      return {
        id: record.id,
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
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        audience: z.enum(["all", "students", "parents", "staff", "alumni"]).optional(),
        addressedTo: z.string().optional(),
        publishNow: z.boolean().optional(),
        authorName: z.string().optional(),
        authorType: z.enum(["student", "faculty", "club", "org"]).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

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
      const updateData: Record<string, unknown> = {
        updatedAt: now,
      };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.audience !== undefined) updateData.audience = input.audience;
      if (input.addressedTo !== undefined) updateData.addressedTo = input.addressedTo;
      if (input.authorName !== undefined) updateData.authorName = input.authorName;
      if (input.authorType !== undefined) updateData.authorType = input.authorType;
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
        .from(announcements)
        .where(eq(announcements.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Announcement not found" });
      }

      await db
        .delete(announcements)
        .where(eq(announcements.id, input.id))
        .run();

      return { success: true };
    }),
};
