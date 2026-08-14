import { z } from "zod";
import { eq, desc, asc, like, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { obMembers, obEvents, obDonations } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { createClerkClient } from "@clerk/backend";
import { env } from "@aloysius-web/env/server";
import { protectedProcedure, publicProcedure } from "../index";
import { generateUniqueSlug } from "../lib/slug";

const clerkClient = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

async function syncOBAdminMetadata(userId: string): Promise<void> {
  try {
    const db = createDb();
    const rows = await db.select().from(obMembers).where(eq(obMembers.userId, userId)).all();
    const memberships = Object.fromEntries(
      rows.map((r) => [r.id, { role: r.role, status: r.status }]),
    );
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = (user.publicMetadata ?? {}) as Record<string, unknown>;
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        obMemberships: memberships,
      },
    });
  } catch (err) {
    console.error(`[ob] failed to sync metadata for ${userId}:`, err);
  }
}

/**
 * Check if a user is an OB admin (approved OB member) or a site admin.
 * Used to gate create/update/delete operations on events and donations.
 */
async function requireOBAdminOrSiteAdmin(userId: string, auth?: { adminCalled?: boolean }) {
  if (auth?.adminCalled) return true;
  const db = createDb();
  const row = await db.select().from(obMembers).where(eq(obMembers.userId, userId)).get();
  if (row && row.status === "approved") return true;
  throw new ORPCError("FORBIDDEN", { message: "OB admin or site admin access required." });
}

// --- OB Members Router ---

export const obMembersRouter = {
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.string().optional(),
        status: z.enum(["pending", "approved", "rejected", "revoked"]).optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const conditions = [];
      if (input.search) {
        conditions.push(like(obMembers.name, `%${input.search}%`));
      }
      if (input.role) {
        conditions.push(eq(obMembers.role, input.role));
      }
      if (input.status) {
        conditions.push(eq(obMembers.status, input.status));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(obMembers).where(where).orderBy(asc(obMembers.sortOrder)).all();
      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        name: row.name,
        role: row.role,
        email: row.email,
        photo: row.photo,
        bio: row.bio,
        sortOrder: row.sortOrder,
        status: row.status,
        decidedBy: row.decidedBy,
        decidedAt: row.decidedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const row = await db.select().from(obMembers).where(eq(obMembers.id, input.id)).get();
      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "OB member not found" });
      }
      return {
        id: row.id,
        userId: row.userId,
        name: row.name,
        role: row.role,
        email: row.email,
        photo: row.photo,
        bio: row.bio,
        sortOrder: row.sortOrder,
        status: row.status,
        decidedBy: row.decidedBy,
        decidedAt: row.decidedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        email: z.string().email().optional().nullable(),
        photo: z.string().optional().nullable(),
        bio: z.string().optional().nullable(),
        sortOrder: z.number().default(0),
        status: z.enum(["pending", "approved", "rejected", "revoked"]).default("approved"),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      await requireOBAdminOrSiteAdmin(context.auth.userId, context.auth);
      const db = createDb();
      const id = crypto.randomUUID();
      const now = new Date();
      const record = await db
        .insert(obMembers)
        .values({
          id,
          userId: context.auth.userId,
          name: input.name,
          role: input.role,
          email: input.email,
          photo: input.photo,
          bio: input.bio,
          sortOrder: input.sortOrder,
          status: input.status,
          decidedBy: input.status === "approved" ? context.auth.userId : null,
          decidedAt: input.status === "approved" ? now : null,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();
      if (record.status === "approved") {
        await syncOBAdminMetadata(context.auth.userId);
      }
      return {
        id: record.id,
        userId: record.userId,
        name: record.name,
        role: record.role,
        email: record.email,
        photo: record.photo,
        bio: record.bio,
        sortOrder: record.sortOrder,
        status: record.status,
        decidedBy: record.decidedBy,
        decidedAt: record.decidedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        role: z.string().min(1).optional(),
        email: z.string().email().optional().nullable(),
        photo: z.string().optional().nullable(),
        bio: z.string().optional().nullable(),
        sortOrder: z.number().optional(),
        status: z.enum(["pending", "approved", "rejected", "revoked"]).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      await requireOBAdminOrSiteAdmin(context.auth.userId, context.auth);
      const db = createDb();
      const existing = await db.select().from(obMembers).where(eq(obMembers.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "OB member not found" });
      }
      const { id, ...updateData } = input;
      const now = new Date();
      const setData: Record<string, unknown> = { updatedAt: now };
      if (updateData.name !== undefined) setData.name = updateData.name;
      if (updateData.role !== undefined) setData.role = updateData.role;
      if (updateData.email !== undefined) setData.email = updateData.email;
      if (updateData.photo !== undefined) setData.photo = updateData.photo;
      if (updateData.bio !== undefined) setData.bio = updateData.bio;
      if (updateData.sortOrder !== undefined) setData.sortOrder = updateData.sortOrder;
      if (updateData.status !== undefined) {
        setData.status = updateData.status;
        setData.decidedBy = context.auth.userId;
        setData.decidedAt = now;
      }
      const record = await db.update(obMembers).set(setData).where(eq(obMembers.id, id)).returning().get();
      if (record.userId && (existing.status !== "approved" && record.status === "approved")) {
        await syncOBAdminMetadata(record.userId);
      }
      return {
        id: record.id,
        userId: record.userId,
        name: record.name,
        role: record.role,
        email: record.email,
        photo: record.photo,
        bio: record.bio,
        sortOrder: record.sortOrder,
        status: record.status,
        decidedBy: record.decidedBy,
        decidedAt: record.decidedAt?.toISOString() ?? null,
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
      await requireOBAdminOrSiteAdmin(context.auth.userId, context.auth);
      const db = createDb();
      const existing = await db.select().from(obMembers).where(eq(obMembers.id, input.id)).get();
      if (!existing) throw new ORPCError("NOT_FOUND", { message: "OB member not found" });
      await db.delete(obMembers).where(eq(obMembers.id, input.id)).run();
      if (existing.userId) {
        await syncOBAdminMetadata(existing.userId);
      }
      return { success: true };
    }),

  /** Current user's OB membership (or null). */
  myMembership: protectedProcedure.handler(async ({ context }) => {
    const userId = context.auth?.userId;
    if (!userId) return null;
    const db = createDb();
    const row = await db.select().from(obMembers).where(eq(obMembers.userId, userId)).get();
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      role: row.role,
      email: row.email,
      photo: row.photo,
      bio: row.bio,
      sortOrder: row.sortOrder,
      status: row.status,
      decidedBy: row.decidedBy,
      decidedAt: row.decidedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }),

  /** Request OB membership (creates pending record). */
  requestMembership: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        email: z.string().email().optional().nullable(),
        bio: z.string().optional().nullable(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const db = createDb();
      const existing = await db.select().from(obMembers).where(eq(obMembers.userId, context.auth.userId)).get();
      if (existing) {
        if (existing.status === "approved") {
          return {
            id: existing.id,
            userId: existing.userId,
            name: existing.name,
            role: existing.role,
            email: existing.email,
            photo: existing.photo,
            bio: existing.bio,
            sortOrder: existing.sortOrder,
            status: existing.status,
            decidedBy: existing.decidedBy,
            decidedAt: existing.decidedAt?.toISOString() ?? null,
            createdAt: existing.createdAt.toISOString(),
            updatedAt: existing.updatedAt.toISOString(),
          };
        }
        const now = new Date();
        const updated = await db
          .update(obMembers)
          .set({ status: "pending", decidedBy: null, decidedAt: null, updatedAt: now })
          .where(eq(obMembers.id, existing.id))
          .returning()
          .get();
        return {
          id: updated.id,
          userId: updated.userId,
          name: updated.name,
          role: updated.role,
          email: updated.email,
          photo: updated.photo,
          bio: updated.bio,
          sortOrder: updated.sortOrder,
          status: updated.status,
          decidedBy: updated.decidedBy,
          decidedAt: updated.decidedAt?.toISOString() ?? null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      }
      const id = crypto.randomUUID();
      const now = new Date();
      const record = await db
        .insert(obMembers)
        .values({
          id,
          userId: context.auth.userId,
          name: input.name,
          role: input.role,
          email: input.email,
          bio: input.bio,
          sortOrder: 0,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();
      return {
        id: record.id,
        userId: record.userId,
        name: record.name,
        role: record.role,
        email: record.email,
        photo: record.photo,
        bio: record.bio,
        sortOrder: record.sortOrder,
        status: record.status,
        decidedBy: record.decidedBy,
        decidedAt: record.decidedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),

  /** Approve a pending OB membership. OB admin or site admin only. */
  approveMember: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const db = createDb();
      const membership = await db.select().from(obMembers).where(eq(obMembers.id, input.id)).get();
      if (!membership) {
        throw new ORPCError("NOT_FOUND", { message: "Membership not found" });
      }
      const now = new Date();
      const updated = await db
        .update(obMembers)
        .set({ status: "approved", decidedBy: context.auth.userId, decidedAt: now, updatedAt: now })
        .where(eq(obMembers.id, input.id))
        .returning()
        .get();
      if (updated.userId) {
        await syncOBAdminMetadata(updated.userId);
      }
      return {
        id: updated.id,
        userId: updated.userId,
        name: updated.name,
        role: updated.role,
        email: updated.email,
        photo: updated.photo,
        bio: updated.bio,
        sortOrder: updated.sortOrder,
        status: updated.status,
        decidedBy: updated.decidedBy,
        decidedAt: updated.decidedAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }),

  /** Reject a pending OB membership. OB admin or site admin only. */
  rejectMember: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const db = createDb();
      const membership = await db.select().from(obMembers).where(eq(obMembers.id, input.id)).get();
      if (!membership) {
        throw new ORPCError("NOT_FOUND", { message: "Membership not found" });
      }
      const now = new Date();
      const updated = await db
        .update(obMembers)
        .set({ status: "rejected", decidedBy: context.auth.userId, decidedAt: now, updatedAt: now })
        .where(eq(obMembers.id, input.id))
        .returning()
        .get();
      if (updated.userId) {
        await syncOBAdminMetadata(updated.userId);
      }
      return {
        id: updated.id,
        userId: updated.userId,
        name: updated.name,
        role: updated.role,
        email: updated.email,
        photo: updated.photo,
        bio: updated.bio,
        sortOrder: updated.sortOrder,
        status: updated.status,
        decidedBy: updated.decidedBy,
        decidedAt: updated.decidedAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }),

  /** Revoke an approved OB membership. OB admin or site admin only. */
  revokeMember: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const db = createDb();
      const membership = await db.select().from(obMembers).where(eq(obMembers.id, input.id)).get();
      if (!membership) {
        throw new ORPCError("NOT_FOUND", { message: "Membership not found" });
      }
      const now = new Date();
      const updated = await db
        .update(obMembers)
        .set({ status: "revoked", decidedBy: context.auth.userId, decidedAt: now, updatedAt: now })
        .where(eq(obMembers.id, input.id))
        .returning()
        .get();
      if (updated.userId) {
        await syncOBAdminMetadata(updated.userId);
      }
      return {
        id: updated.id,
        userId: updated.userId,
        name: updated.name,
        role: updated.role,
        email: updated.email,
        photo: updated.photo,
        bio: updated.bio,
        sortOrder: updated.sortOrder,
        status: updated.status,
        decidedBy: updated.decidedBy,
        decidedAt: updated.decidedAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }),

  /** Bulk re-sync all OB member metadata. Site admin or OB admin only. */
  syncOBMetadata: protectedProcedure.handler(async ({ context }) => {
    if (!context.auth?.userId) {
      throw new ORPCError("UNAUTHORIZED");
    }
    const db = createDb();
    const isSiteAdmin = context.auth?.adminCalled ?? false;
    if (!isSiteAdmin) {
      const my = await db.select().from(obMembers).where(eq(obMembers.userId, context.auth.userId)).get();
      if (!my || my.status !== "approved") {
        throw new ORPCError("UNAUTHORIZED", { message: "OB admin access required." });
      }
    }
    const rows = await db.select().from(obMembers).all();
    const userIds = [...new Set(rows.map((r) => r.userId).filter((id): id is string => !!id))];
    let synced = 0;
    let errors = 0;
    const errorsList: string[] = [];
    for (const userId of userIds) {
      try {
        await syncOBAdminMetadata(userId);
        synced++;
      } catch (err) {
        errors++;
        errorsList.push(`Error syncing ${userId}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return { synced, errors, errorsList };
  }),
};

// --- OB Events Router ---

export const obEventsRouter = {
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(["draft", "published", "archived"]).optional(),
        search: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const conditions = [];
      if (input.status) {
        conditions.push(eq(obEvents.status, input.status));
      }
      if (input.search) {
        conditions.push(like(obEvents.title, `%${input.search}%`));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(obEvents).where(where).orderBy(desc(obEvents.eventDate)).all();
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        coverImage: row.coverImage,
        location: row.location,
        eventDate: row.eventDate?.toISOString() ?? null,
        endDate: row.endDate?.toISOString() ?? null,
        isAllDay: row.isAllDay,
        status: row.status,
        publishedAt: row.publishedAt?.toISOString() ?? null,
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
          ? await db.select().from(obEvents).where(eq(obEvents.id, input.id)).get()
          : await db.select().from(obEvents).where(eq(obEvents.slug, input.slug)).get();
      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "OB event not found" });
      }
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        coverImage: row.coverImage,
        location: row.location,
        eventDate: row.eventDate?.toISOString() ?? null,
        endDate: row.endDate?.toISOString() ?? null,
        isAllDay: row.isAllDay,
        status: row.status,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        slug: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        coverImage: z.string().optional().nullable(),
        location: z.string().optional().nullable(),
        eventDate: z.string().optional(),
        endDate: z.string().optional(),
        isAllDay: z.boolean().optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      await requireOBAdminOrSiteAdmin(context.auth.userId, context.auth);
      const db = createDb();
      const slug = input.slug
        ? await generateUniqueSlug(obEvents, input.slug)
        : await generateUniqueSlug(obEvents, input.title);
      const status = input.publishNow ? "published" : "draft";
      const publishedAt = input.publishNow ? new Date() : null;
      const record = await db
        .insert(obEvents)
        .values({
          id: crypto.randomUUID(),
          slug,
          title: input.title,
          description: input.description ?? null,
          coverImage: input.coverImage ?? null,
          location: input.location ?? null,
          eventDate: input.eventDate ? new Date(input.eventDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          isAllDay: input.isAllDay ?? false,
          status,
          publishedAt,
          userId: context.auth.userId,
        })
        .returning()
        .get();
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        coverImage: record.coverImage,
        location: record.location,
        eventDate: record.eventDate?.toISOString() ?? null,
        endDate: record.endDate?.toISOString() ?? null,
        isAllDay: record.isAllDay,
        status: record.status,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        slug: z.string().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        coverImage: z.string().optional().nullable(),
        location: z.string().optional().nullable(),
        eventDate: z.string().optional(),
        endDate: z.string().optional(),
        isAllDay: z.boolean().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      await requireOBAdminOrSiteAdmin(context.auth.userId, context.auth);
      const db = createDb();
      const existing = await db.select().from(obEvents).where(eq(obEvents.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "OB event not found" });
      }
      const { id, ...updateData } = input;
      const now = new Date();
      const setData: Record<string, unknown> = { updatedAt: now };
      if (updateData.slug !== undefined) {
        setData.slug = await generateUniqueSlug(obEvents, updateData.slug, id);
      }
      if (updateData.title !== undefined) {
        setData.title = updateData.title;
        if (updateData.slug === undefined) {
          setData.slug = await generateUniqueSlug(obEvents, updateData.title, id);
        }
      }
      if (updateData.description !== undefined) setData.description = updateData.description;
      if (updateData.coverImage !== undefined) setData.coverImage = updateData.coverImage;
      if (updateData.location !== undefined) setData.location = updateData.location;
      if (updateData.eventDate !== undefined) setData.eventDate = updateData.eventDate ? new Date(updateData.eventDate) : null;
      if (updateData.endDate !== undefined) setData.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
      if (updateData.isAllDay !== undefined) setData.isAllDay = updateData.isAllDay;
      if (updateData.status !== undefined) {
        setData.status = updateData.status;
        if (updateData.status === "published" && existing.status !== "published") {
          setData.publishedAt = now;
        }
      }
      if (updateData.publishNow) {
        setData.status = "published";
        setData.publishedAt = now;
      }
      const record = await db.update(obEvents).set(setData).where(eq(obEvents.id, id)).returning().get();
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        coverImage: record.coverImage,
        location: record.location,
        eventDate: record.eventDate?.toISOString() ?? null,
        endDate: record.endDate?.toISOString() ?? null,
        isAllDay: record.isAllDay,
        status: record.status,
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
      await requireOBAdminOrSiteAdmin(context.auth.userId, context.auth);
      const db = createDb();
      await db.delete(obEvents).where(eq(obEvents.id, input.id)).run();
      return { success: true };
    }),
};

// --- OB Donations Router ---

export const obDonationsRouter = {
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
        search: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const conditions = [];
      if (input.status) {
        conditions.push(eq(obDonations.status, input.status));
      }
      if (input.search) {
        conditions.push(like(obDonations.donorName, `%${input.search}%`));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(obDonations).where(where).orderBy(desc(obDonations.donatedAt)).all();
      return rows.map((row) => ({
        id: row.id,
        donorName: row.donorName,
        donorEmail: row.donorEmail,
        amount: row.amount,
        currency: row.currency,
        purpose: row.purpose,
        message: row.message,
        image: row.image,
        isAnonymous: row.isAnonymous,
        status: row.status,
        donatedAt: row.donatedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const row = await db.select().from(obDonations).where(eq(obDonations.id, input.id)).get();
      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Donation not found" });
      }
      return {
        id: row.id,
        donorName: row.donorName,
        donorEmail: row.donorEmail,
        amount: row.amount,
        currency: row.currency,
        purpose: row.purpose,
        message: row.message,
        image: row.image,
        isAnonymous: row.isAnonymous,
        status: row.status,
        donatedAt: row.donatedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        donorName: z.string().min(1),
        donorEmail: z.string().email().optional().nullable(),
        amount: z.number().optional(),
        currency: z.string().default("LKR"),
        purpose: z.string().optional().nullable(),
        message: z.string().optional().nullable(),
        image: z.string().optional().nullable(),
        isAnonymous: z.boolean().default(false),
        status: z.enum(["pending", "confirmed", "cancelled"]).default("pending"),
        donatedAt: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      await requireOBAdminOrSiteAdmin(context.auth.userId, context.auth);
      const db = createDb();
      const record = await db
        .insert(obDonations)
        .values({
          id: crypto.randomUUID(),
          donorName: input.donorName,
          donorEmail: input.donorEmail,
          amount: input.amount,
          currency: input.currency,
          purpose: input.purpose,
          message: input.message,
          image: input.image,
          isAnonymous: input.isAnonymous,
          status: input.status,
          donatedAt: input.donatedAt ? new Date(input.donatedAt) : new Date(),
          userId: context.auth.userId,
        })
        .returning()
        .get();
      return {
        id: record.id,
        donorName: record.donorName,
        donorEmail: record.donorEmail,
        amount: record.amount,
        currency: record.currency,
        purpose: record.purpose,
        message: record.message,
        image: record.image,
        isAnonymous: record.isAnonymous,
        status: record.status,
        donatedAt: record.donatedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        donorName: z.string().min(1).optional(),
        donorEmail: z.string().email().optional().nullable(),
        amount: z.number().optional(),
        currency: z.string().optional(),
        purpose: z.string().optional().nullable(),
        message: z.string().optional().nullable(),
        image: z.string().optional().nullable(),
        isAnonymous: z.boolean().optional(),
        status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
        donatedAt: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      await requireOBAdminOrSiteAdmin(context.auth.userId, context.auth);
      const db = createDb();
      const existing = await db.select().from(obDonations).where(eq(obDonations.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Donation not found" });
      }
      const { id, ...updateData } = input;
      const setData: Record<string, unknown> = { updatedAt: new Date() };
      if (updateData.donorName !== undefined) setData.donorName = updateData.donorName;
      if (updateData.donorEmail !== undefined) setData.donorEmail = updateData.donorEmail;
      if (updateData.amount !== undefined) setData.amount = updateData.amount;
      if (updateData.currency !== undefined) setData.currency = updateData.currency;
      if (updateData.purpose !== undefined) setData.purpose = updateData.purpose;
      if (updateData.message !== undefined) setData.message = updateData.message;
      if (updateData.image !== undefined) setData.image = updateData.image;
      if (updateData.isAnonymous !== undefined) setData.isAnonymous = updateData.isAnonymous;
      if (updateData.status !== undefined) setData.status = updateData.status;
      if (updateData.donatedAt !== undefined) {
        setData.donatedAt = updateData.donatedAt ? new Date(updateData.donatedAt) : null;
      }
      const record = await db.update(obDonations).set(setData).where(eq(obDonations.id, id)).returning().get();
      return {
        id: record.id,
        donorName: record.donorName,
        donorEmail: record.donorEmail,
        amount: record.amount,
        currency: record.currency,
        purpose: record.purpose,
        message: record.message,
        image: record.image,
        isAnonymous: record.isAnonymous,
        status: record.status,
        donatedAt: record.donatedAt?.toISOString() ?? null,
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
      await requireOBAdminOrSiteAdmin(context.auth.userId, context.auth);
      const db = createDb();
      await db.delete(obDonations).where(eq(obDonations.id, input.id)).run();
      return { success: true };
    }),
};

export const obRouter = {
  obMembers: obMembersRouter,
  obEvents: obEventsRouter,
  obDonations: obDonationsRouter,
};
