import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { bigMatches } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { generateUniqueSlug } from "../lib/slug";

export const bigMatchesRouter = {
  list: publicProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const db = createDb();
      let query = db.select().from(bigMatches).orderBy(asc(bigMatches.sortOrder));

      if (input?.status) {
        query = query.where(eq(bigMatches.status, input.status)) as typeof query;
      }

      const rows = await query.all();
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        opponent: row.opponent,
        type: row.type,
        year: row.year,
        eventId: row.eventId,
        galleryId: row.galleryId,
        sortOrder: row.sortOrder,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    }),

  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const row = await db
        .select()
        .from(bigMatches)
        .where(eq(bigMatches.slug, input.slug))
        .get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Big match not found" });
      }

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        opponent: row.opponent,
        type: row.type,
        year: row.year,
        eventId: row.eventId,
        galleryId: row.galleryId,
        sortOrder: row.sortOrder,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        opponent: z.string().min(1),
        type: z.string().default("Cricket"),
        year: z.number().optional(),
        eventId: z.string().optional(),
        galleryId: z.string().optional(),
        sortOrder: z.number().default(0),
        status: z.enum(["draft", "published", "archived"]).default("draft"),
      })
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const slug = await generateUniqueSlug(bigMatches, input.name);
      const record = await db
        .insert(bigMatches)
        .values({
          id: crypto.randomUUID(),
          slug,
          ...input,
        })
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        name: record.name,
        opponent: record.opponent,
        type: record.type,
        year: record.year,
        eventId: record.eventId,
        galleryId: record.galleryId,
        sortOrder: record.sortOrder,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        opponent: z.string().min(1).optional(),
        type: z.string().optional(),
        year: z.number().nullable().optional(),
        eventId: z.string().nullable().optional(),
        galleryId: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
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
        .from(bigMatches)
        .where(eq(bigMatches.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Big match not found" });
      }

      const { id, ...updateData } = input;
      if (updateData.name !== undefined) {
        updateData.slug = await generateUniqueSlug(bigMatches, updateData.name, id);
      }
      const record = await db
        .update(bigMatches)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(bigMatches.id, id))
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        name: record.name,
        opponent: record.opponent,
        type: record.type,
        year: record.year,
        eventId: record.eventId,
        galleryId: record.galleryId,
        sortOrder: record.sortOrder,
        status: record.status,
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
      await db.delete(bigMatches).where(eq(bigMatches.id, input.id)).run();
      return { success: true };
    }),
};
