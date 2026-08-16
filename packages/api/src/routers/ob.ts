import { z } from "zod";
import { eq, desc, asc, like, and, isNull, inArray } from "drizzle-orm";
import { createDb, type Database } from "@aloysius-web/db";
import {
  obMembers,
  obEvents,
  obDonations,
  obNews,
  obAnnouncements,
  principals,
  gallery,
  galleryImages,
} from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import {
  audienceSchema,
  contentStatusSchema,
  donationStatusSchema,
  galleryLinkSchema,
  membershipStatusSchema,
} from "../schemas";
import { generateUniqueSlug } from "../lib/slug";
import { isOBAdmin } from "../lib/ob-admin";
import { ensurePrincipalAsStaffAndPresident } from "../lib/principal-sync";

/**
 * Auto-sync the current published principal into the current year's President slot
 * (name + portrait), so the OB committee always reflects the principal.
 */
export async function syncPrincipalAsOBAdmin(): Promise<{
  synced: number;
  errors: number;
  errorsList: string[];
}> {
  const db = createDb();
  const results = { synced: 0, errors: 0, errorsList: [] as string[] };
  try {
    const principal = await db
      .select()
      .from(principals)
      .where(eq(principals.status, "published"))
      .orderBy(asc(principals.sortOrder), desc(principals.createdAt))
      .limit(1)
      .get();
    if (!principal) {
      results.errorsList.push("No published principal found");
      results.errors++;
      return results;
    }
    const year = String(new Date().getFullYear());
    const existing = await db
      .select()
      .from(obMembers)
      .where(and(eq(obMembers.year, year), eq(obMembers.role, "President")))
      .get();
    const now = new Date();
    if (existing) {
      await db
        .update(obMembers)
        .set({ name: principal.name, photo: principal.portrait ?? null, updatedAt: now })
        .where(eq(obMembers.id, existing.id))
        .run();
    } else {
      await db
        .insert(obMembers)
        .values({
          id: crypto.randomUUID(),
          name: principal.name,
          role: "President",
          email: null,
          photo: principal.portrait ?? null,
          bio: principal.message ?? null,
          year,
          sortOrder: 3,
          status: "approved",
          decidedBy: null,
          decidedAt: null,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
    results.synced = 1;
    return results;
  } catch (err) {
    results.errorsList.push(
      `Error syncing principal: ${err instanceof Error ? err.message : String(err)}`,
    );
    results.errors++;
    return results;
  }
}

// --- OB Members Router ---

export const obMembersRouter = {
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.string().optional(),
        status: membershipStatusSchema.optional(),
        year: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      // Auto-sync the current published principal into the current year's President slot.
      await ensurePrincipalAsStaffAndPresident();
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
      if (input.year) {
        conditions.push(eq(obMembers.year, input.year));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db
        .select()
        .from(obMembers)
        .where(where)
        .orderBy(asc(obMembers.sortOrder))
        .all();
      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        name: row.name,
        role: row.role,
        email: row.email,
        photo: row.photo,
        bio: row.bio,
        year: row.year,
        sortOrder: row.sortOrder,
        status: row.status,
        decidedBy: row.decidedBy,
        decidedAt: row.decidedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    }),

  /**
   * Sync the current published principal into a specific committee year's President
   * slot (only if that slot is empty — a manual assignment is never overwritten).
   * Called before loading a committee year so a not-yet-built year defaults to the
   * principal without the site admin having to assign one by hand.
   */
  ensurePresidentForYear: publicProcedure
    .input(z.object({ year: z.string().min(1) }))
    .handler(async ({ input }) => {
      return ensurePrincipalAsStaffAndPresident(input.year);
    }),

  get: publicProcedure.input(z.object({ id: z.string() })).handler(async ({ input }) => {
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
      year: row.year,
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
        year: z.string().default(""),
        sortOrder: z.number().default(0),
        status: membershipStatusSchema.default("approved"),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const callerIsOBAdmin = await isOBAdmin(context.auth.userId);
      if (!callerIsOBAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
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
          year: input.year,
          sortOrder: input.sortOrder,
          status: input.status,
          decidedBy: input.status === "approved" ? context.auth.userId : null,
          decidedAt: input.status === "approved" ? now : null,
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
        year: record.year,
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
        year: z.string().optional(),
        sortOrder: z.number().optional(),
        status: membershipStatusSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const callerIsOBAdmin = await isOBAdmin(context.auth.userId);
      if (!callerIsOBAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
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
      if (updateData.year !== undefined) setData.year = updateData.year;
      if (updateData.sortOrder !== undefined) setData.sortOrder = updateData.sortOrder;
      if (updateData.status !== undefined) {
        setData.status = updateData.status;
        setData.decidedBy = context.auth.userId;
        setData.decidedAt = now;
      }
      const record = await db
        .update(obMembers)
        .set(setData)
        .where(eq(obMembers.id, id))
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
        year: record.year,
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
      const callerIsOBAdmin = await isOBAdmin(context.auth.userId);
      if (!callerIsOBAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db.select().from(obMembers).where(eq(obMembers.id, input.id)).get();
      if (!existing) throw new ORPCError("NOT_FOUND", { message: "OB member not found" });
      await db.delete(obMembers).where(eq(obMembers.id, input.id)).run();
      return { success: true };
    }),

  /** Current user's OB membership (or null). */
  myMembership: protectedProcedure.handler(async ({ context }) => {
    const userId = context.auth?.userId;
    if (!userId) return null;
    const db = createDb();
    const row = await db.select().from(obMembers).where(eq(obMembers.userId, userId)).get();
    const isAdmin = await isOBAdmin(userId);
    if (!row) {
      // Designated OB admin by email but no member row of their own yet
      // (e.g. the site admin set the OB admin email for a year with no members).
      if (!isAdmin) return null;
      return {
        id: null,
        userId,
        name: null,
        role: "ADMINISTRATOR",
        email: null,
        isAdmin,
        photo: null,
        bio: null,
        year: "",
        sortOrder: 0,
        status: "approved",
        decidedBy: null,
        decidedAt: null,
        createdAt: null,
        updatedAt: null,
      };
    }
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      role: row.role,
      email: row.email,
      isAdmin,
      photo: row.photo,
      bio: row.bio,
      year: row.year,
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
        year: z.string().default(""),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const db = createDb();
      const existing = await db
        .select()
        .from(obMembers)
        .where(eq(obMembers.userId, context.auth.userId))
        .get();
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
            year: existing.year,
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
          year: updated.year,
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
          year: input.year,
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
        year: record.year,
        sortOrder: record.sortOrder,
        status: record.status,
        decidedBy: record.decidedBy,
        decidedAt: record.decidedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),

  /** Approve a pending OB membership. OB admin only (site admin cannot approve). */
  approveMember: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "Only the OB admin can approve members." });
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
      return {
        id: updated.id,
        userId: updated.userId,
        name: updated.name,
        role: updated.role,
        email: updated.email,
        photo: updated.photo,
        bio: updated.bio,
        year: updated.year,
        sortOrder: updated.sortOrder,
        status: updated.status,
        decidedBy: updated.decidedBy,
        decidedAt: updated.decidedAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }),

  /** Reject a pending OB membership. OB admin only (site admin cannot reject). */
  rejectMember: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "Only the OB admin can reject members." });
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
      return {
        id: updated.id,
        userId: updated.userId,
        name: updated.name,
        role: updated.role,
        email: updated.email,
        photo: updated.photo,
        bio: updated.bio,
        year: updated.year,
        sortOrder: updated.sortOrder,
        status: updated.status,
        decidedBy: updated.decidedBy,
        decidedAt: updated.decidedAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }),

  /** Revoke an approved OB membership. OB admin only (site admin cannot revoke). */
  revokeMember: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "Only the OB admin can revoke members." });
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
      return {
        id: updated.id,
        userId: updated.userId,
        name: updated.name,
        role: updated.role,
        email: updated.email,
        photo: updated.photo,
        bio: updated.bio,
        year: updated.year,
        sortOrder: updated.sortOrder,
        status: updated.status,
        decidedBy: updated.decidedBy,
        decidedAt: updated.decidedAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }),


  /**
   * Save the full committee for a year at once. Each entry is a role slot; existing
   * members are updated (matched by id), new ones are created, and approved members
   * of the year whose role is a committee role but are not in the submitted entries
   * are removed (they were dropped from the form). Pending/rejected members are kept.
   */
  saveCommittee: protectedProcedure
    .input(
      z.object({
        year: z.string().min(1),
        entries: z.array(
          z.object({
            id: z.string().optional(),
            role: z.string().min(1),
            name: z.string().min(1),
            email: z.string().email().optional().nullable(),
            photo: z.string().optional().nullable(),
            bio: z.string().optional().nullable(),
            sortOrder: z.number(),
          }),
        ),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const callerIsOBAdmin = await isOBAdmin(context.auth.userId);
      if (!callerIsOBAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const now = new Date();
      const submittedIds = input.entries.map((e) => e.id).filter((id): id is string => !!id);

      for (const entry of input.entries) {
        if (entry.id) {
          const existing = await db
            .select()
            .from(obMembers)
            .where(eq(obMembers.id, entry.id))
            .get();
          if (!existing) {
            throw new ORPCError("NOT_FOUND", { message: "OB member not found" });
          }
          await db
            .update(obMembers)
            .set({
              name: entry.name,
              role: entry.role,
              email: entry.email ?? null,
              photo: entry.photo ?? null,
              bio: entry.bio ?? null,
              year: input.year,
              sortOrder: entry.sortOrder,
              status: "approved",
              decidedBy: context.auth.userId,
              decidedAt: now,
              updatedAt: now,
            })
            .where(eq(obMembers.id, entry.id))
            .run();
        } else {
          await db
            .insert(obMembers)
            .values({
              id: crypto.randomUUID(),
              name: entry.name,
              role: entry.role,
              email: entry.email ?? null,
              photo: entry.photo ?? null,
              bio: entry.bio ?? null,
              year: input.year,
              sortOrder: entry.sortOrder,
              status: "approved",
              decidedBy: context.auth.userId,
              decidedAt: now,
              createdAt: now,
              updatedAt: now,
            })
            .run();
        }
      }

      // Remove approved committee members of the year that were dropped from the form.
      const committeeRoles = [
        "PATRON",
        "JESUIT REPRESENTATIVE",
        "PARISH PRIEST",
        "PRESIDENT",
        "SECRETARY",
        "TREASURER",
        "VICE PRESIDENT - ADMINISTRATION",
        "VICE PRESIDENT - ACADEMICS",
        "VICE PRESIDENT - SOCIAL & CURRICULAR EVENTS",
        "VICE PRESIDENT - FUNDRAISING",
        "VICE PRESIDENT - MEMBERSHIP",
        "VICE PRESIDENT - PLAYGROUND & SPORTS",
        "ASSISTANT SECRETARY",
        "ASSISTANT TREASURER",
        "COMMITTEE MEMBER",
        "ADVISORY BOARD",
      ];
      const yearMembers = await db
        .select()
        .from(obMembers)
        .where(and(eq(obMembers.year, input.year), eq(obMembers.status, "approved")))
        .all();
      let removed = 0;
      for (const member of yearMembers) {
        if (submittedIds.includes(member.id)) continue;
        if (!committeeRoles.includes(member.role.toUpperCase())) continue;
        await db.delete(obMembers).where(eq(obMembers.id, member.id)).run();
        removed++;
      }

      return { saved: input.entries.length, removed };
    }),
};

// --- OB Events Router ---

export const obEventsRouter = {
  list: publicProcedure
    .input(
      z.object({
        status: contentStatusSchema.optional(),
        search: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const userId = context.auth?.userId ?? null;
      const canSeeAll = isSiteAdmin || (userId !== null && (await isOBAdmin(userId)));
      const conditions = [];
      if (input.status) {
        if (!canSeeAll && input.status !== "published") {
          throw new ORPCError("UNAUTHORIZED", { message: "OB admin or site admin access required." });
        }
        conditions.push(eq(obEvents.status, input.status));
      } else if (!canSeeAll) {
        conditions.push(eq(obEvents.status, "published"));
      }
      if (input.search) {
        conditions.push(like(obEvents.title, `%${input.search}%`));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db
        .select()
        .from(obEvents)
        .where(where)
        .orderBy(desc(obEvents.eventDate))
        .all();
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
    .handler(async ({ input, context }) => {
      const db = createDb();
      const row =
        "id" in input
          ? await db.select().from(obEvents).where(eq(obEvents.id, input.id)).get()
          : await db.select().from(obEvents).where(eq(obEvents.slug, input.slug)).get();
      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "OB event not found" });
      }
      if (row.status !== "published") {
        const isSiteAdmin = context.auth?.adminCalled ?? false;
        const userId = context.auth?.userId ?? null;
        const isAuthor = userId !== null && userId === row.userId;
        const callerIsOBAdmin = userId !== null && (await isOBAdmin(userId));
        if (!isSiteAdmin && !isAuthor && !callerIsOBAdmin) {
          throw new ORPCError("NOT_FOUND", { message: "OB event not found" });
        }
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
      const callerIsOBAdmin = await isOBAdmin(context.auth.userId);
      if (!callerIsOBAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const slug = input.slug
        ? await generateUniqueSlug(obEvents, input.slug)
        : await generateUniqueSlug(obEvents, input.title);
      const status: "draft" | "published" = input.publishNow ? "published" : "draft";
      const publishedAt: Date | null = status === "published" ? new Date() : null;
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
        status: contentStatusSchema.optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const callerIsOBAdmin = await isOBAdmin(context.auth.userId);
      if (!callerIsOBAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
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
      if (updateData.eventDate !== undefined)
        setData.eventDate = updateData.eventDate ? new Date(updateData.eventDate) : null;
      if (updateData.endDate !== undefined)
        setData.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
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
      const record = await db
        .update(obEvents)
        .set(setData)
        .where(eq(obEvents.id, id))
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

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
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
        status: donationStatusSchema.optional(),
        search: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const userId = context.auth?.userId ?? null;
      const canSeeAll = isSiteAdmin || (userId !== null && (await isOBAdmin(userId)));
      const conditions = [];
      if (input.status) {
        if (!canSeeAll && input.status !== "confirmed") {
          throw new ORPCError("UNAUTHORIZED", { message: "OB admin or site admin access required." });
        }
        conditions.push(eq(obDonations.status, input.status));
      } else if (!canSeeAll) {
        conditions.push(eq(obDonations.status, "confirmed"));
      }
      if (input.search) {
        conditions.push(like(obDonations.donorName, `%${input.search}%`));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db
        .select()
        .from(obDonations)
        .where(where)
        .orderBy(desc(obDonations.donatedAt))
        .all();
      return rows.map((row) => ({
        id: row.id,
        donorName: row.donorName,
        donorEmail: canSeeAll ? row.donorEmail : null,
        amount: row.amount,
        currency: row.currency,
        purpose: row.purpose,
        message: canSeeAll ? row.message : null,
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
    .handler(async ({ input, context }) => {
      const db = createDb();
      const row = await db.select().from(obDonations).where(eq(obDonations.id, input.id)).get();
      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Donation not found" });
      }
      if (row.status !== "confirmed") {
        const isSiteAdmin = context.auth?.adminCalled ?? false;
        const userId = context.auth?.userId ?? null;
        const isAuthor = userId !== null && userId === row.userId;
        const callerIsOBAdmin = userId !== null && (await isOBAdmin(userId));
        if (!isSiteAdmin && !isAuthor && !callerIsOBAdmin) {
          throw new ORPCError("NOT_FOUND", { message: "Donation not found" });
        }
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
        status: donationStatusSchema.default("pending"),
        donatedAt: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
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
        status: donationStatusSchema.optional(),
        donatedAt: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db
        .select()
        .from(obDonations)
        .where(eq(obDonations.id, input.id))
        .get();
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
      const record = await db
        .update(obDonations)
        .set(setData)
        .where(eq(obDonations.id, id))
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

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      await db.delete(obDonations).where(eq(obDonations.id, input.id)).run();
      return { success: true };
    }),
};

// --- OB Event Galleries Router ---

export const obEventGalleriesRouter = {
  list: publicProcedure
    .input(z.object({ obEventId: z.string() }))
    .handler(async ({ input, context }) => {
      const db = createDb();
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const userId = context.auth?.userId ?? null;
      const callerIsOBAdmin = userId !== null && (await isOBAdmin(userId));
      const canSeeDrafts = isSiteAdmin || callerIsOBAdmin;
      const conditions = [eq(gallery.obEventId, input.obEventId)];
      if (!canSeeDrafts) {
        conditions.push(eq(gallery.status, "published"));
      }
      const rows = await db
        .select()
        .from(gallery)
        .where(and(...conditions))
        .orderBy(desc(gallery.createdAt))
        .all();
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        coverImage: row.coverImage,
        obEventId: row.obEventId,
        status: row.status,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    }),
};

// --- OB Donation Galleries Router ---
// Mirrors OB Event Galleries: lets an OB admin (or site admin) attach a photo
// album to a specific donation ("in recognition of this gift..."), and lets
// the site admin publish/unpublish it for the public site.

export const obDonationGalleriesRouter = {
  list: publicProcedure
    .input(z.object({ obDonationId: z.string() }))
    .handler(async ({ input, context }) => {
      const db = createDb();
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const userId = context.auth?.userId ?? null;
      const callerIsOBAdmin = userId !== null && (await isOBAdmin(userId));
      const canSeeDrafts = isSiteAdmin || callerIsOBAdmin;
      const conditions = [eq(gallery.obDonationId, input.obDonationId)];
      if (!canSeeDrafts) {
        conditions.push(eq(gallery.status, "published"));
      }
      const rows = await db
        .select()
        .from(gallery)
        .where(and(...conditions))
        .orderBy(desc(gallery.createdAt))
        .all();
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        coverImage: row.coverImage,
        obDonationId: row.obDonationId,
        status: row.status,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    }),

  /** Unlinked galleries the OB admin can attach to a donation instead of creating a new one. */
  listAvailable: protectedProcedure.handler(async ({ context }) => {
    if (!context.auth?.userId) {
      throw new ORPCError("UNAUTHORIZED");
    }
    if (!(await isOBAdmin(context.auth.userId))) {
      throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
    }
    const db = createDb();
    const rows = await db
      .select()
      .from(gallery)
      .where(
        and(
          isNull(gallery.obEventId),
          isNull(gallery.obDonationId),
          isNull(gallery.eventId),
          isNull(gallery.studentWorkId),
          isNull(gallery.achievementId),
        ),
      )
      .orderBy(desc(gallery.createdAt))
      .all();
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      coverImage: row.coverImage,
      status: row.status,
    }));
  }),

  /** Attach an existing, unlinked gallery to a donation instead of creating a new one. */
  link: protectedProcedure
    .input(z.object({ id: z.string(), obDonationId: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db.select().from(gallery).where(eq(gallery.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }
      if (
        existing.obEventId ||
        existing.obDonationId ||
        existing.eventId ||
        existing.studentWorkId ||
        existing.achievementId
      ) {
        throw new ORPCError("BAD_REQUEST", { message: "This gallery is already linked elsewhere." });
      }
      const donation = await db
        .select()
        .from(obDonations)
        .where(eq(obDonations.id, input.obDonationId))
        .get();
      if (!donation) {
        throw new ORPCError("NOT_FOUND", { message: "OB donation not found" });
      }
      const now = new Date();
      const record = await db
        .update(gallery)
        .set({ obDonationId: input.obDonationId, updatedAt: now })
        .where(eq(gallery.id, input.id))
        .returning()
        .get();
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        coverImage: record.coverImage,
        obDonationId: record.obDonationId,
        status: record.status,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        obDonationId: z.string(),
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        coverImage: z.string().optional().nullable(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const donation = await db
        .select()
        .from(obDonations)
        .where(eq(obDonations.id, input.obDonationId))
        .get();
      if (!donation) {
        throw new ORPCError("NOT_FOUND", { message: "OB donation not found" });
      }
      const slug = await generateUniqueSlug(gallery, input.title);
      const now = new Date();
      const record = await db
        .insert(gallery)
        .values({
          id: crypto.randomUUID(),
          slug,
          title: input.title,
          description: input.description ?? null,
          coverImage: input.coverImage ?? null,
          obDonationId: input.obDonationId,
          status: "draft",
          userId: context.auth.userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        coverImage: record.coverImage,
        obDonationId: record.obDonationId,
        status: record.status,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),

  release: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db.select().from(gallery).where(eq(gallery.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }
      const now = new Date();
      const record = await db
        .update(gallery)
        .set({ status: "published", publishedAt: now, updatedAt: now })
        .where(eq(gallery.id, input.id))
        .returning()
        .get();
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        coverImage: record.coverImage,
        obDonationId: record.obDonationId,
        status: record.status,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),

  unrelease: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db.select().from(gallery).where(eq(gallery.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }
      const now = new Date();
      const record = await db
        .update(gallery)
        .set({ status: "archived", publishedAt: null, updatedAt: now })
        .where(eq(gallery.id, input.id))
        .returning()
        .get();
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        coverImage: record.coverImage,
        obDonationId: record.obDonationId,
        status: record.status,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),
};

// --- OB News Router ---
// Self-published by OB admins: no site-admin approval gate, unlike club content.

export const obNewsRouter = {
  list: publicProcedure
    .input(
      z.object({
        status: contentStatusSchema.optional(),
        search: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const userId = context.auth?.userId ?? null;
      const canSeeAll = isSiteAdmin || (userId !== null && (await isOBAdmin(userId)));
      const conditions = [];
      if (input.status) {
        if (!canSeeAll && input.status !== "published") {
          throw new ORPCError("UNAUTHORIZED", { message: "OB admin or site admin access required." });
        }
        conditions.push(eq(obNews.status, input.status));
      } else if (!canSeeAll) {
        conditions.push(eq(obNews.status, "published"));
      }
      if (input.search) {
        conditions.push(like(obNews.title, `%${input.search}%`));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db
        .select()
        .from(obNews)
        .where(where)
        .orderBy(desc(obNews.createdAt))
        .all();
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        content: row.content,
        excerpt: row.excerpt,
        coverImage: row.coverImage,
        status: row.status,
        publishedAt: row.publishedAt?.toISOString() ?? null,
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
          ? await db.select().from(obNews).where(eq(obNews.id, input.id)).get()
          : await db.select().from(obNews).where(eq(obNews.slug, input.slug)).get();
      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "OB news not found" });
      }
      if (row.status !== "published") {
        const isSiteAdmin = context.auth?.adminCalled ?? false;
        const userId = context.auth?.userId ?? null;
        const isAuthor = userId !== null && userId === row.userId;
        const callerIsOBAdmin = userId !== null && (await isOBAdmin(userId));
        if (!isSiteAdmin && !isAuthor && !callerIsOBAdmin) {
          throw new ORPCError("NOT_FOUND", { message: "OB news not found" });
        }
      }
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        content: row.content,
        excerpt: row.excerpt,
        coverImage: row.coverImage,
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
        content: z.string().min(1),
        excerpt: z.string().optional().nullable(),
        coverImage: z.string().optional().nullable(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const slug = input.slug
        ? await generateUniqueSlug(obNews, input.slug)
        : await generateUniqueSlug(obNews, input.title);
      const status: "draft" | "published" = input.publishNow ? "published" : "draft";
      const record = await db
        .insert(obNews)
        .values({
          id: crypto.randomUUID(),
          slug,
          title: input.title,
          content: input.content,
          excerpt: input.excerpt ?? null,
          coverImage: input.coverImage ?? null,
          status,
          publishedAt: status === "published" ? new Date() : null,
          userId: context.auth.userId,
        })
        .returning()
        .get();
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        content: record.content,
        excerpt: record.excerpt,
        coverImage: record.coverImage,
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
        content: z.string().min(1).optional(),
        excerpt: z.string().optional().nullable(),
        coverImage: z.string().optional().nullable(),
        status: contentStatusSchema.optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db.select().from(obNews).where(eq(obNews.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "OB news not found" });
      }
      const { id, ...updateData } = input;
      const now = new Date();
      const setData: Record<string, unknown> = { updatedAt: now };
      if (updateData.slug !== undefined) {
        setData.slug = await generateUniqueSlug(obNews, updateData.slug, id);
      }
      if (updateData.title !== undefined) {
        setData.title = updateData.title;
        if (updateData.slug === undefined) {
          setData.slug = await generateUniqueSlug(obNews, updateData.title, id);
        }
      }
      if (updateData.content !== undefined) setData.content = updateData.content;
      if (updateData.excerpt !== undefined) setData.excerpt = updateData.excerpt;
      if (updateData.coverImage !== undefined) setData.coverImage = updateData.coverImage;
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
      const record = await db
        .update(obNews)
        .set(setData)
        .where(eq(obNews.id, id))
        .returning()
        .get();
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        content: record.content,
        excerpt: record.excerpt,
        coverImage: record.coverImage,
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
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      await db.delete(obNews).where(eq(obNews.id, input.id)).run();
      return { success: true };
    }),
};

// --- OB Announcements Router ---
// Self-published by OB admins: no site-admin approval gate, unlike club content.

export const obAnnouncementsRouter = {
  list: publicProcedure
    .input(
      z.object({
        status: contentStatusSchema.optional(),
        audience: audienceSchema.optional(),
        search: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const userId = context.auth?.userId ?? null;
      const canSeeAll = isSiteAdmin || (userId !== null && (await isOBAdmin(userId)));
      const conditions = [];
      if (input.status) {
        if (!canSeeAll && input.status !== "published") {
          throw new ORPCError("UNAUTHORIZED", { message: "OB admin or site admin access required." });
        }
        conditions.push(eq(obAnnouncements.status, input.status));
      } else if (!canSeeAll) {
        conditions.push(eq(obAnnouncements.status, "published"));
      }
      if (input.audience) {
        conditions.push(eq(obAnnouncements.audience, input.audience));
      }
      if (input.search) {
        conditions.push(like(obAnnouncements.title, `%${input.search}%`));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db
        .select()
        .from(obAnnouncements)
        .where(where)
        .orderBy(desc(obAnnouncements.createdAt))
        .all();
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        content: row.content,
        excerpt: row.excerpt,
        coverImage: row.coverImage,
        audience: row.audience,
        status: row.status,
        publishedAt: row.publishedAt?.toISOString() ?? null,
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
          ? await db.select().from(obAnnouncements).where(eq(obAnnouncements.id, input.id)).get()
          : await db
              .select()
              .from(obAnnouncements)
              .where(eq(obAnnouncements.slug, input.slug))
              .get();
      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "OB announcement not found" });
      }
      if (row.status !== "published") {
        const isSiteAdmin = context.auth?.adminCalled ?? false;
        const userId = context.auth?.userId ?? null;
        const isAuthor = userId !== null && userId === row.userId;
        const callerIsOBAdmin = userId !== null && (await isOBAdmin(userId));
        if (!isSiteAdmin && !isAuthor && !callerIsOBAdmin) {
          throw new ORPCError("NOT_FOUND", { message: "OB announcement not found" });
        }
      }
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        content: row.content,
        excerpt: row.excerpt,
        coverImage: row.coverImage,
        audience: row.audience,
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
        content: z.string().min(1),
        excerpt: z.string().optional().nullable(),
        coverImage: z.string().optional().nullable(),
        audience: audienceSchema.optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const slug = input.slug
        ? await generateUniqueSlug(obAnnouncements, input.slug)
        : await generateUniqueSlug(obAnnouncements, input.title);
      const status: "draft" | "published" = input.publishNow ? "published" : "draft";
      const record = await db
        .insert(obAnnouncements)
        .values({
          id: crypto.randomUUID(),
          slug,
          title: input.title,
          content: input.content,
          excerpt: input.excerpt ?? null,
          coverImage: input.coverImage ?? null,
          audience: input.audience ?? "alumni",
          status,
          publishedAt: status === "published" ? new Date() : null,
          userId: context.auth.userId,
        })
        .returning()
        .get();
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        content: record.content,
        excerpt: record.excerpt,
        coverImage: record.coverImage,
        audience: record.audience,
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
        content: z.string().min(1).optional(),
        excerpt: z.string().optional().nullable(),
        coverImage: z.string().optional().nullable(),
        audience: audienceSchema.optional(),
        status: contentStatusSchema.optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db
        .select()
        .from(obAnnouncements)
        .where(eq(obAnnouncements.id, input.id))
        .get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "OB announcement not found" });
      }
      const { id, ...updateData } = input;
      const now = new Date();
      const setData: Record<string, unknown> = { updatedAt: now };
      if (updateData.slug !== undefined) {
        setData.slug = await generateUniqueSlug(obAnnouncements, updateData.slug, id);
      }
      if (updateData.title !== undefined) {
        setData.title = updateData.title;
        if (updateData.slug === undefined) {
          setData.slug = await generateUniqueSlug(obAnnouncements, updateData.title, id);
        }
      }
      if (updateData.content !== undefined) setData.content = updateData.content;
      if (updateData.excerpt !== undefined) setData.excerpt = updateData.excerpt;
      if (updateData.coverImage !== undefined) setData.coverImage = updateData.coverImage;
      if (updateData.audience !== undefined) setData.audience = updateData.audience;
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
      const record = await db
        .update(obAnnouncements)
        .set(setData)
        .where(eq(obAnnouncements.id, id))
        .returning()
        .get();
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        content: record.content,
        excerpt: record.excerpt,
        coverImage: record.coverImage,
        audience: record.audience,
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
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      await db.delete(obAnnouncements).where(eq(obAnnouncements.id, input.id)).run();
      return { success: true };
    }),
};

// --- OB Gallery Router ---
// Lets an OB admin manage photos on a gallery they've created or linked (event
// or donation) and publish it when ready. Mirrors admin.gallery's image and
// release endpoints, gated on isOBAdmin instead of the site admin role.

type GalleryLink =
  | { type: "event"; id: string }
  | { type: "donation"; id: string }
  | { type: "none" }
  | undefined;

/**
 * Resolves a gallery's `link` input into the obEventId/obDonationId columns to
 * set, validating the target exists. `undefined` link leaves both untouched by
 * the caller (it never calls this helper); "none" clears both.
 */
async function resolveGalleryLink(
  db: Database,
  link: GalleryLink,
): Promise<{ obEventId: string | null; obDonationId: string | null }> {
  if (!link || link.type === "none") {
    return { obEventId: null, obDonationId: null };
  }
  if (link.type === "event") {
    const event = await db.select().from(obEvents).where(eq(obEvents.id, link.id)).get();
    if (!event) throw new ORPCError("NOT_FOUND", { message: "OB event not found" });
    return { obEventId: link.id, obDonationId: null };
  }
  const donation = await db.select().from(obDonations).where(eq(obDonations.id, link.id)).get();
  if (!donation) throw new ORPCError("NOT_FOUND", { message: "OB donation not found" });
  return { obEventId: null, obDonationId: link.id };
}

export const obGalleryRouter = {
  /** All OB-scope galleries (event-linked, donation-linked, or standalone) for the manage page. */
  list: publicProcedure.handler(async ({ context }) => {
    const db = createDb();
    const userId = context.auth?.userId ?? null;
    const canSeeAll = (context.auth?.adminCalled ?? false) || (userId !== null && (await isOBAdmin(userId)));
    if (!canSeeAll) {
      return [];
    }
    const rows = await db
      .select()
      .from(gallery)
      .where(
        and(isNull(gallery.eventId), isNull(gallery.studentWorkId), isNull(gallery.achievementId)),
      )
      .orderBy(desc(gallery.createdAt))
      .all();

    const galleryIds = rows.map((r) => r.id);
    const imageCounts = new Map<string, number>();
    if (galleryIds.length > 0) {
      const images = await db
        .select({ galleryId: galleryImages.galleryId })
        .from(galleryImages)
        .where(inArray(galleryImages.galleryId, galleryIds))
        .all();
      for (const img of images) {
        imageCounts.set(img.galleryId, (imageCounts.get(img.galleryId) ?? 0) + 1);
      }
    }

    const eventIds = [...new Set(rows.map((r) => r.obEventId).filter((v): v is string => !!v))];
    const eventTitles = new Map<string, string>();
    if (eventIds.length > 0) {
      const events = await db
        .select({ id: obEvents.id, title: obEvents.title })
        .from(obEvents)
        .where(inArray(obEvents.id, eventIds))
        .all();
      for (const e of events) eventTitles.set(e.id, e.title);
    }

    const donationIds = [
      ...new Set(rows.map((r) => r.obDonationId).filter((v): v is string => !!v)),
    ];
    const donationNames = new Map<string, string>();
    if (donationIds.length > 0) {
      const donations = await db
        .select({ id: obDonations.id, donorName: obDonations.donorName, purpose: obDonations.purpose })
        .from(obDonations)
        .where(inArray(obDonations.id, donationIds))
        .all();
      for (const d of donations) {
        donationNames.set(d.id, d.purpose || `Gift from ${d.donorName}`);
      }
    }

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      coverImage: row.coverImage,
      obEventId: row.obEventId,
      obDonationId: row.obDonationId,
      linkedTitle: row.obEventId
        ? (eventTitles.get(row.obEventId) ?? null)
        : row.obDonationId
          ? (donationNames.get(row.obDonationId) ?? null)
          : null,
      status: row.status,
      imageCount: imageCounts.get(row.id) ?? 0,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        coverImage: z.string().optional().nullable(),
        link: galleryLinkSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const linkFields = await resolveGalleryLink(db, input.link);
      const slug = await generateUniqueSlug(gallery, input.title);
      const now = new Date();
      const record = await db
        .insert(gallery)
        .values({
          id: crypto.randomUUID(),
          slug,
          title: input.title,
          description: input.description ?? null,
          coverImage: input.coverImage ?? null,
          ...linkFields,
          status: "draft",
          userId: context.auth.userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();
      return { id: record.id, slug: record.slug, title: record.title };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        coverImage: z.string().optional().nullable(),
        link: galleryLinkSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db.select().from(gallery).where(eq(gallery.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }
      const setData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.title !== undefined) setData.title = input.title;
      if (input.description !== undefined) setData.description = input.description;
      if (input.coverImage !== undefined) setData.coverImage = input.coverImage;
      if (input.link !== undefined) {
        Object.assign(setData, await resolveGalleryLink(db, input.link));
      }
      const record = await db
        .update(gallery)
        .set(setData)
        .where(eq(gallery.id, input.id))
        .returning()
        .get();
      return { id: record.id, title: record.title };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db.select().from(gallery).where(eq(gallery.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }
      await db.delete(gallery).where(eq(gallery.id, input.id)).run();
      return { success: true };
    }),

  addImage: protectedProcedure
    .input(
      z.object({
        galleryId: z.string(),
        url: z.string().min(1),
        caption: z.string().optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existingGallery = await db
        .select()
        .from(gallery)
        .where(eq(gallery.id, input.galleryId))
        .get();
      if (!existingGallery) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }
      const id = crypto.randomUUID();
      const record = await db
        .insert(galleryImages)
        .values({
          id,
          galleryId: input.galleryId,
          url: input.url,
          caption: input.caption ?? null,
          sortOrder: input.sortOrder ?? 0,
        })
        .returning()
        .get();
      return {
        id: record.id,
        galleryId: record.galleryId,
        url: record.url,
        caption: record.caption,
        sortOrder: record.sortOrder,
        createdAt: record.createdAt.toISOString(),
      };
    }),

  removeImage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db
        .select()
        .from(galleryImages)
        .where(eq(galleryImages.id, input.id))
        .get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery image not found" });
      }
      await db.delete(galleryImages).where(eq(galleryImages.id, input.id)).run();
      return { success: true };
    }),

  updateImage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        caption: z.string().optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db
        .select()
        .from(galleryImages)
        .where(eq(galleryImages.id, input.id))
        .get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery image not found" });
      }
      const updateData: Record<string, unknown> = {};
      if (input.caption !== undefined) updateData.caption = input.caption;
      if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
      const record = await db
        .update(galleryImages)
        .set(updateData)
        .where(eq(galleryImages.id, input.id))
        .returning()
        .get();
      return {
        id: record.id,
        galleryId: record.galleryId,
        url: record.url,
        caption: record.caption,
        sortOrder: record.sortOrder,
        createdAt: record.createdAt.toISOString(),
      };
    }),

  release: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db.select().from(gallery).where(eq(gallery.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }
      const now = new Date();
      const record = await db
        .update(gallery)
        .set({ status: "published", publishedAt: now, updatedAt: now })
        .where(eq(gallery.id, input.id))
        .returning()
        .get();
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        status: record.status,
        publishedAt: record.publishedAt?.toISOString() ?? null,
      };
    }),

  unrelease: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!(await isOBAdmin(context.auth.userId))) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin access required." });
      }
      const db = createDb();
      const existing = await db.select().from(gallery).where(eq(gallery.id, input.id)).get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
      }
      const now = new Date();
      const record = await db
        .update(gallery)
        .set({ status: "archived", publishedAt: null, updatedAt: now })
        .where(eq(gallery.id, input.id))
        .returning()
        .get();
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        status: record.status,
        publishedAt: record.publishedAt?.toISOString() ?? null,
      };
    }),
};

export const obRouter = {
  obMembers: obMembersRouter,
  obEvents: obEventsRouter,
  obDonations: obDonationsRouter,
  obNews: obNewsRouter,
  obAnnouncements: obAnnouncementsRouter,
  obEventGalleries: obEventGalleriesRouter,
  obDonationGalleries: obDonationGalleriesRouter,
  obGallery: obGalleryRouter,
};
