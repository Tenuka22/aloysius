import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { activities, account, user } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import { activityTypeSchema, contentStatusSchema } from "../../schemas";
import { generateUniqueSlug } from "../../lib/slug";
import {
  ACTIVITY_ADMIN_EMAIL_DOMAIN,
  activityAdminEmail,
  activityAdminRole,
  createAuth,
  generateRandomPassword,
  hashPassword,
} from "@aloysius-web/auth";

/**
 * Super-user tier for activities (clubs/sports). Site admin only (see
 * admin/index.ts). `update` here is unrestricted (any field, any activity) —
 * the public `activities.update` remains for club-admin self-service editing
 * of their own club's branding, with structural fields (type/adminEmail/
 * sortOrder/status) still gated to site admin there too.
 */
export const adminActivitiesRouter = {
  create: adminProcedure
    .input(
      z.object({
        slug: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        logoUrl: z.string().optional(),
        bannerUrl: z.string().optional(),
        images: z.array(z.string()).optional(),
        type: activityTypeSchema.default("club"),
        adminEmail: z.string().email().optional(),
        capabilities: z.array(z.string()).optional(),
        sortOrder: z.number().optional(),
        status: contentStatusSchema.default("draft"),
      }),
    )
    .handler(async ({ input }) => {
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
          capabilities: input.capabilities ?? [],
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
        capabilities: record.capabilities ?? [],
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
        description: z.string().optional(),
        coverImage: z.string().optional(),
        logoUrl: z.string().optional().nullable(),
        bannerUrl: z.string().optional().nullable(),
        images: z.array(z.string()).optional(),
        type: activityTypeSchema.optional(),
        adminEmail: z.string().email().optional().nullable(),
        capabilities: z.array(z.string()).optional(),
        sortOrder: z.number().optional(),
        status: contentStatusSchema.optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db.select().from(activities).where(eq(activities.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };

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
      if (input.capabilities !== undefined) updateData.capabilities = input.capabilities;
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
        capabilities: record.capabilities ?? [],
        sortOrder: record.sortOrder,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const db = createDb();
    const existing = await db.select().from(activities).where(eq(activities.id, input.id)).get();
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
    }
    await db.delete(activities).where(eq(activities.id, input.id)).run();
    return { success: true };
  }),

  /**
   * Reports the auto-generated login email for the activity's admin and
   * whether a password has been generated yet. The password itself is never
   * returned — only rotated.
   */
  getCredentials: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db
        .select()
        .from(activities)
        .where(eq(activities.id, input.id))
        .get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }
      return {
        email: activityAdminEmail(existing.slug),
        hasPassword: !!existing.adminPasswordHash,
      };
    }),

  /**
   * Generates a fresh random password for the activity admin login, stores its
   * scrypt hash on the activity row, and keeps the underlying Better Auth
   * credential account in sync so the old password stops working immediately.
   */
  rotateCredentials: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db
        .select()
        .from(activities)
        .where(eq(activities.id, input.id))
        .get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      const email = activityAdminEmail(existing.slug);
      const role = activityAdminRole(existing.slug);
      const password = generateRandomPassword();
      const hash = await hashPassword(password);

      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .get();

      if (!existingUser) {
        await createAuth().api.createUser({
          body: { email, password, name: existing.name, role } as never,
        });
      } else {
        await db.update(user).set({ role }).where(eq(user.id, existingUser.id)).run();
        const existingAccount = await db
          .select()
          .from(account)
          .where(
            and(eq(account.userId, existingUser.id), eq(account.providerId, "credential")),
          )
          .get();
        if (existingAccount) {
          await db
            .update(account)
            .set({ password: hash })
            .where(eq(account.id, existingAccount.id))
            .run();
        } else {
          await db
            .insert(account)
            .values({
              id: crypto.randomUUID(),
              accountId: existingUser.id,
              providerId: "credential",
              userId: existingUser.id,
              password: hash,
            })
            .run();
        }
      }

      await db
        .update(activities)
        .set({ adminPasswordHash: hash })
        .where(eq(activities.id, input.id))
        .run();

      return {
        email,
        password,
        domain: ACTIVITY_ADMIN_EMAIL_DOMAIN,
      };
    }),
};
