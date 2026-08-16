import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { bigMatches } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import { contentStatusSchema } from "../../schemas";
import { generateUniqueSlug } from "../../lib/slug";

export const adminBigMatchesRouter = {
  create: adminProcedure
    .input(
      z.object({
        slug: z.string().optional(),
        name: z.string().min(1),
        opponent: z.string().min(1),
        coverImage: z.string().optional(),
        type: z.string().default("Cricket"),
        year: z.number().optional(),
        eventId: z.string().optional(),
        galleryId: z.string().optional(),
        sortOrder: z.number().default(0),
        status: contentStatusSchema.default("draft"),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const slug = input.slug
        ? await generateUniqueSlug(bigMatches, input.slug)
        : await generateUniqueSlug(bigMatches, input.name);
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
        coverImage: record.coverImage,
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

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        slug: z.string().optional(),
        name: z.string().min(1).optional(),
        opponent: z.string().min(1).optional(),
        coverImage: z.string().nullable().optional(),
        type: z.string().optional(),
        year: z.number().nullable().optional(),
        eventId: z.string().nullable().optional(),
        galleryId: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
        status: contentStatusSchema.optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db.select().from(bigMatches).where(eq(bigMatches.id, input.id)).get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Big match not found" });
      }

      const { id, ...updateData } = input;
      if (updateData.slug !== undefined) {
        updateData.slug = await generateUniqueSlug(bigMatches, updateData.slug, id);
      }
      if (updateData.name !== undefined) {
        if (updateData.slug === undefined) {
          updateData.slug = await generateUniqueSlug(bigMatches, updateData.name, id);
        }
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
        coverImage: record.coverImage,
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

  delete: adminProcedure.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const db = createDb();
    await db.delete(bigMatches).where(eq(bigMatches.id, input.id)).run();
    return { success: true };
  }),
};
