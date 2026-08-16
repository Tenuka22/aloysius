import { z } from "zod";
import { eq, asc, and } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { activities } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { activityTypeSchema, contentStatusSchema } from "../schemas";
import { generateUniqueSlug, checkSlugUnique } from "../lib/slug";
import { resolveClubAccess } from "../lib/club-access";

export const activitiesRouter = {
  list: publicProcedure
    .input(
      z
        .object({
          status: contentStatusSchema.optional(),
          type: activityTypeSchema.optional(),
        })
        .optional(),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const conditions = [];
      if (input?.status) {
        if (input.status !== "published" && !isSiteAdmin) {
          throw new ORPCError("UNAUTHORIZED", { message: "Site admin access required." });
        }
        conditions.push(eq(activities.status, input.status));
      } else if (!isSiteAdmin) {
        conditions.push(eq(activities.status, "published"));
      }
      if (input?.type) {
        conditions.push(eq(activities.type, input.type));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db
        .select()
        .from(activities)
        .where(where)
        .orderBy(asc(activities.sortOrder))
        .all();

      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        coverImage: row.coverImage,
        logoUrl: row.logoUrl,
        bannerUrl: row.bannerUrl,
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
    .input(z.union([z.object({ id: z.string() }), z.object({ slug: z.string() })]))
    .handler(async ({ input, context }) => {
      const db = createDb();
      const row =
        "id" in input
          ? await db.select().from(activities).where(eq(activities.id, input.id)).get()
          : await db.select().from(activities).where(eq(activities.slug, input.slug)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      if (row.status !== "published") {
        const isSiteAdmin = context.auth?.adminCalled ?? false;
        const userId = context.auth?.userId ?? null;
        let canView = isSiteAdmin;
        if (!canView && userId) {
          const { membership, isClubAdmin } = await resolveClubAccess(db, row.id, userId, isSiteAdmin);
          canView = isClubAdmin || membership?.status === "approved";
        }
        if (!canView) {
          throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
        }
      }

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        coverImage: row.coverImage,
        logoUrl: row.logoUrl,
        bannerUrl: row.bannerUrl,
        images: row.images ?? [],
        type: row.type,
        adminEmail: row.adminEmail,
        sortOrder: row.sortOrder,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }),


  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        slug: z.string().optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        logoUrl: z.string().optional().nullable(),
        bannerUrl: z.string().optional().nullable(),
        images: z.array(z.string()).optional(),
        type: activityTypeSchema.optional(),
        adminEmail: z.string().email().optional().nullable(),
        sortOrder: z.number().optional(),
        status: contentStatusSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const db = createDb();
      const existing = await db.select().from(activities).where(eq(activities.id, input.id)).get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      let callerIsClubAdmin = isSiteAdmin;
      if (!callerIsClubAdmin) {
        const { isClubAdmin } = await resolveClubAccess(db, input.id, context.auth.userId, isSiteAdmin);
        callerIsClubAdmin = isClubAdmin;
      }
      if (!callerIsClubAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "Club admin or site admin access required." });
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.slug !== undefined) {
        updateData.slug = await generateUniqueSlug(activities, input.slug, input.id);
      }
      if (input.name !== undefined) {
        updateData.name = input.name;
        if (input.slug === undefined) {
          updateData.slug = await generateUniqueSlug(activities, input.name, input.id);
        }
      }
      if (input.description !== undefined) updateData.description = input.description;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
      if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
      if (input.bannerUrl !== undefined) updateData.bannerUrl = input.bannerUrl;
      if (input.images !== undefined) updateData.images = input.images;

      // Structural/curation and access-control fields: site admin only to change.
      if (input.type !== undefined && input.type !== existing.type) {
        if (!isSiteAdmin) {
          throw new ORPCError("FORBIDDEN", { message: "Only site admin can change activity type." });
        }
        updateData.type = input.type;
      }
      if (input.adminEmail !== undefined && input.adminEmail !== existing.adminEmail) {
        if (!isSiteAdmin) {
          throw new ORPCError("FORBIDDEN", {
            message: "Only site admin can change the club admin email.",
          });
        }
        updateData.adminEmail = input.adminEmail;
      }
      if (input.sortOrder !== undefined && input.sortOrder !== existing.sortOrder) {
        if (!isSiteAdmin) {
          throw new ORPCError("FORBIDDEN", { message: "Only site admin can change sort order." });
        }
        updateData.sortOrder = input.sortOrder;
      }

      if (input.status !== undefined) {
        if (!isSiteAdmin && input.status !== existing.status) {
          throw new ORPCError("FORBIDDEN", { message: "Only site admin can change activity status." });
        }
        updateData.status = input.status;
      }

      const record = await db
        .update(activities)
        .set(updateData)
        .where(eq(activities.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        name: record.name,
        description: record.description,
        coverImage: record.coverImage,
        logoUrl: record.logoUrl,
        bannerUrl: record.bannerUrl,
        images: record.images ?? [],
        type: record.type,
        adminEmail: record.adminEmail,
        sortOrder: record.sortOrder,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),


  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .handler(async ({ input }) => {
      return checkSlugUnique(activities, input.slug, input.excludeId);
    }),
};
