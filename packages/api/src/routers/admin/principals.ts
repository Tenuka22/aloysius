import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { principals } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import { contentStatusSchema } from "../../schemas";
import { generateUniqueSlug } from "../../lib/slug";

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

/**
 * Super-user tier for principals. Site admin only (see admin/index.ts) —
 * principals have no self-service/club-scoped authoring concept.
 */
export const adminPrincipalsRouter = {
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        title: z.string().optional(),
        quote: z.string().optional(),
        message: z.string().optional(),
        bio: z.string().optional(),
        education: z.string().optional(),
        tenure: z.string().optional(),
        year: z.string().optional(),
        portrait: z.string().optional(),
        sortOrder: z.number().optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const id = crypto.randomUUID();
      const now = new Date();
      const slug = await generateUniqueSlug(principals, input.name);

      const db = createDb();
      const record = await db
        .insert(principals)
        .values({
          id,
          slug,
          name: input.name,
          title: input.title ?? "Principal",
          quote: input.quote ?? null,
          message: input.message ?? null,
          bio: input.bio ?? null,
          education: input.education ?? null,
          tenure: input.tenure ?? null,
          year: input.year ?? "",
          portrait: input.portrait ?? null,
          sortOrder: input.sortOrder ?? 0,
          status: input.publishNow ? "published" : "draft",
          createdAt: now,
          updatedAt: now,
          userId: context.auth.userId!,
        })
        .returning()
        .get();

      return serializePrincipal(record);
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        title: z.string().optional(),
        quote: z.string().optional(),
        message: z.string().optional(),
        bio: z.string().optional(),
        education: z.string().optional(),
        tenure: z.string().optional(),
        year: z.string().optional(),
        portrait: z.string().optional(),
        sortOrder: z.number().optional(),
        status: contentStatusSchema.optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db.select().from(principals).where(eq(principals.id, input.id)).get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Principal not found" });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = {
        updatedAt: now,
      };

      if (input.name !== undefined) {
        updateData.name = input.name;
        updateData.slug = await generateUniqueSlug(principals, input.name, input.id);
      }
      if (input.title !== undefined) updateData.title = input.title;
      if (input.quote !== undefined) updateData.quote = input.quote;
      if (input.message !== undefined) updateData.message = input.message;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.education !== undefined) updateData.education = input.education;
      if (input.tenure !== undefined) updateData.tenure = input.tenure;
      if (input.year !== undefined) updateData.year = input.year;
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

      return serializePrincipal(record);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db.select().from(principals).where(eq(principals.id, input.id)).get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Principal not found" });
      }

      await db.delete(principals).where(eq(principals.id, input.id)).run();

      return { success: true };
    }),
};
