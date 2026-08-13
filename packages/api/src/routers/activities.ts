import { z } from "zod";
import { eq, asc, and } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { activities, clubMembers } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { generateUniqueSlug, checkSlugUnique } from "../lib/slug";
import { syncClubMembershipsMetadata } from "../lib/club-access";
import { createClerkClient } from "@clerk/backend";
import { env } from "@aloysius-web/env/server";

const clerkClient = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

export const activitiesRouter = {
  list: publicProcedure
    .input(
      z
        .object({
          status: z.enum(["draft", "published", "archived"]).optional(),
          type: z.enum(["club", "sport", "other"]).optional(),
        })
        .optional(),
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

      const rows = await db.select().from(activities).orderBy(asc(activities.sortOrder)).all();

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
    .handler(async ({ input }) => {
      const db = createDb();
      const row =
        "id" in input
          ? await db.select().from(activities).where(eq(activities.id, input.id)).get()
          : await db.select().from(activities).where(eq(activities.slug, input.slug)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
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

  create: protectedProcedure
    .input(
      z.object({
        slug: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        logoUrl: z.string().optional(),
        bannerUrl: z.string().optional(),
        images: z.array(z.string()).optional(),
        type: z.enum(["club", "sport", "other"]).default("club"),
        adminEmail: z.string().email().optional(),
        sortOrder: z.number().optional(),
        status: z.enum(["draft", "published", "archived"]).default("draft"),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const now = new Date();
      const id = crypto.randomUUID();
      const slug = input.slug
        ? await generateUniqueSlug(activities, input.slug)
        : await generateUniqueSlug(activities, input.name);

      const record = await db
        .insert(activities)
        .values({
          id,
          slug,
          name: input.name,
          description: input.description,
          coverImage: input.coverImage,
          logoUrl: input.logoUrl,
          bannerUrl: input.bannerUrl,
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
        type: z.enum(["club", "sport", "other"]).optional(),
        adminEmail: z.string().email().optional().nullable(),
        sortOrder: z.number().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db.select().from(activities).where(eq(activities.id, input.id)).get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
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

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db.select().from(activities).where(eq(activities.id, input.id)).get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      await db.delete(activities).where(eq(activities.id, input.id)).run();

      return { success: true };
    }),

  syncAdminMetadata: protectedProcedure.handler(async ({ context }) => {
    if (!context.auth?.userId) {
      throw new ORPCError("UNAUTHORIZED");
    }

    const db = createDb();
    const allActivities = await db
      .select()
      .from(activities)
      .orderBy(asc(activities.sortOrder))
      .all();

    const activitiesWithAdmin = allActivities.filter((a) => a.adminEmail);

    const emailToActivityIds = new Map<string, string[]>();
    for (const activity of activitiesWithAdmin) {
      const email = activity.adminEmail!.toLowerCase();
      const existing = emailToActivityIds.get(email) ?? [];
      existing.push(activity.id);
      emailToActivityIds.set(email, existing);
    }

    const results = { updated: 0, cleared: 0, errors: 0, errorsList: [] as string[] };

    for (const [email, activityIds] of emailToActivityIds) {
      try {
        const users = await clerkClient.users.getUserList({ emailAddress: [email] });
        const user = users.data[0];

        if (!user) {
          results.errorsList.push(`No Clerk user found for ${email}`);
          results.errors++;
          continue;
        }

        const currentMetadata = (user.publicMetadata ?? {}) as Record<string, unknown>;
        const currentAdminActivities = (currentMetadata.adminActivities as string[]) ?? [];

        const sortedNew = [...activityIds].sort();
        const sortedOld = [...currentAdminActivities].sort();

        if (JSON.stringify(sortedNew) !== JSON.stringify(sortedOld)) {
          await clerkClient.users.updateUser(user.id, {
            publicMetadata: {
              ...currentMetadata,
              adminActivities: activityIds,
            },
          });
          results.updated++;
        }

        // Seed club_members rows (role=admin, approved) for this admin's clubs
        for (const activityId of activityIds) {
          const existingMember = await db
            .select()
            .from(clubMembers)
            .where(and(eq(clubMembers.activityId, activityId), eq(clubMembers.userId, user.id)))
            .get();

          if (!existingMember) {
            const now = new Date();
            await db
              .insert(clubMembers)
              .values({
                id: crypto.randomUUID(),
                activityId,
                userId: user.id,
                name: user.firstName || user.lastName
                  ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                  : null,
                role: "admin",
                status: "approved",
                decidedBy: "system",
                decidedAt: now,
                createdAt: now,
                updatedAt: now,
              })
              .run();
          }
        }
        await syncClubMembershipsMetadata(user.id);
      } catch (err) {
        results.errorsList.push(
          `Error syncing ${email}: ${err instanceof Error ? err.message : String(err)}`,
        );
        results.errors++;
      }
    }

    const allAdminEmails = new Set(emailToActivityIds.keys());

    const usersWithAdminMeta = await clerkClient.users.getUserList({
      limit: 500,
    });

    for (const user of usersWithAdminMeta.data) {
      try {
        const metadata = (user.publicMetadata ?? {}) as Record<string, unknown>;
        const adminActivities = metadata.adminActivities as string[] | undefined;

        if (adminActivities && adminActivities.length > 0) {
          const userEmail = user.emailAddresses.find((e) => e.emailAddress.toLowerCase());

          if (userEmail && !allAdminEmails.has(userEmail.emailAddress.toLowerCase())) {
            await clerkClient.users.updateUser(user.id, {
              publicMetadata: {
                ...metadata,
                adminActivities: [],
              },
            });
            results.cleared++;
          }
        }
      } catch (err) {
        results.errorsList.push(
          `Error clearing ${user.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
        results.errors++;
      }
    }

    return results;
  }),

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .handler(async ({ input }) => {
      return checkSlugUnique(activities, input.slug, input.excludeId);
    }),
};
