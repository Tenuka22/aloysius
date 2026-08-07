import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { announcements } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";

export const announcementsRouter = {
  list: publicProcedure.handler(async () => {
    const db = createDb();
    const rows = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt))
      .all();

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
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
        publishedAt: row.publishedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string(),
        excerpt: z.string().optional(),
        publishNow: z.boolean().optional(),
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
          publishedAt: input.publishNow ? now : null,
          userId: context.auth.userId,
        })
        .returning()
        .get();

      return {
        id: record.id,
        title: record.title,
        content: record.content,
        excerpt: record.excerpt,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
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
      if (input.publishNow === true && !existing.publishedAt) {
        updateData.publishedAt = now;
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
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
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
