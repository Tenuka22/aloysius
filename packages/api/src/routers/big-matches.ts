import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { bigMatches } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { publicProcedure } from "../index";
import { contentStatusSchema } from "../schemas";
import { checkSlugUnique } from "../lib/slug";

export const bigMatchesRouter = {
  list: publicProcedure
    .input(z.object({ status: contentStatusSchema.optional() }).optional())
    .handler(async ({ input, context }) => {
      const db = createDb();
      const isSiteAdmin = context.auth?.role === "admin";
      let query = db.select().from(bigMatches).orderBy(asc(bigMatches.sortOrder));

      if (input?.status) {
        if (input.status !== "published" && !isSiteAdmin) {
          throw new ORPCError("UNAUTHORIZED", { message: "Site admin access required." });
        }
        query = query.where(eq(bigMatches.status, input.status)) as typeof query;
      } else if (!isSiteAdmin) {
        query = query.where(eq(bigMatches.status, "published")) as typeof query;
      }

      const rows = await query.all();
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        opponent: row.opponent,
        coverImage: row.coverImage,
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
    .input(z.union([z.object({ id: z.string() }), z.object({ slug: z.string() })]))
    .handler(async ({ input, context }) => {
      const db = createDb();
      const row =
        "id" in input
          ? await db.select().from(bigMatches).where(eq(bigMatches.id, input.id)).get()
          : await db.select().from(bigMatches).where(eq(bigMatches.slug, input.slug)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Big match not found" });
      }

      if (row.status !== "published" && !(context.auth?.role === "admin")) {
        throw new ORPCError("NOT_FOUND", { message: "Big match not found" });
      }
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        opponent: row.opponent,
        coverImage: row.coverImage,
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

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .handler(async ({ input }) => {
      return checkSlugUnique(bigMatches, input.slug, input.excludeId);
    }),
};
