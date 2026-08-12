import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { activities } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";

export const activitiesRouter = {
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(["draft", "published", "archived"]).optional(),
        type: z.enum(["club", "sport", "other"]).optional(),
      }).optional()
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const conditions = [];
      if (input?.status) {
        conditions.push(eq(activities.status, input.status));
      }
      if (input?.type) {
        conditions.push(eq(activities.type, input.type));
      }

      const rows = await db
        .select()
        .from(activities)
        .orderBy(asc(activities.sortOrder))
        .all();

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        coverImage: row.coverImage,
        images: row.images ?? [],
        type: row.type,
        adminEmail: row.adminEmail,
        sortOrder: row.sortOrder,
        status: row.status,
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
        .from(activities)
        .where(eq(activities.id, input.id))
        .get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        coverImage: row.coverImage,
        images: row.images ?? [],
        type: row.type,
        adminEmail: row.adminEmail,
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
        description: z.string().optional(),
        coverImage: z.string().optional(),
        images: z.array(z.string()).optional(),
        type: z.enum(["club", "sport", "other"]).default("club"),
        adminEmail: z.string().email().optional(),
        sortOrder: z.number().optional(),
        status: z.enum(["draft", "published", "archived"]).default("draft"),
      })
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const now = new Date();
      const id = crypto.randomUUID();

      const record = await db
        .insert(activities)
        .values({
          id,
          name: input.name,
          description: input.description,
          coverImage: input.coverImage,
          images: input.images ?? [],
          type: input.type,
          adminEmail: input.adminEmail,
          sortOrder: input.sortOrder ?? 0,
          status: input.status,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();

      return {
        id: record.id,
        name: record.name,
        description: record.description,
        coverImage: record.coverImage,
        images: record.images ?? [],
        type: record.type,
        adminEmail: record.adminEmail,
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
        description: z.string().optional(),
        coverImage: z.string().optional(),
        images: z.array(z.string()).optional(),
        type: z.enum(["club", "sport", "other"]).optional(),
        adminEmail: z.string().email().optional().nullable(),
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
        .from(activities)
        .where(eq(activities.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
      if (input.images !== undefined) updateData.images = input.images;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.adminEmail !== undefined) updateData.adminEmail = input.adminEmail;
      if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
      if (input.status !== undefined) updateData.status = input.status;

      const record = await db
        .update(activities)
        .set(updateData)
        .where(eq(activities.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        name: record.name,
        description: record.description,
        coverImage: record.coverImage,
        images: record.images ?? [],
        type: record.type,
        adminEmail: record.adminEmail,
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
      const existing = await db
        .select()
        .from(activities)
        .where(eq(activities.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      await db.delete(activities).where(eq(activities.id, input.id)).run();

      return { success: true };
    }),
};
