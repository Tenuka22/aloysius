import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { bigMatches } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";

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
      return rows;
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const row = await db
        .select()
        .from(bigMatches)
        .where(eq(bigMatches.id, input.id))
        .get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Big match not found" });
      }

      return row;
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
      const record = await db
        .insert(bigMatches)
        .values({
          id: crypto.randomUUID(),
          ...input,
        })
        .returning()
        .get();

      return record;
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
      const record = await db
        .update(bigMatches)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(bigMatches.id, id))
        .returning()
        .get();

      return record;
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
