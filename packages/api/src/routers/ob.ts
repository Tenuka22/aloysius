import { z } from "zod";
import { eq, desc, asc, like, and } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { obMembers, obEvents, obDonations, principals } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { createClerkClient } from "@clerk/backend";
import { env } from "@aloysius-web/env/server";
import { protectedProcedure, publicProcedure } from "../index";
import { generateUniqueSlug } from "../lib/slug";
import { getUserEmail } from "../lib/club-access";

const clerkClient = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

/**
 * Validate every OB admin email stored in the DB against Clerk. Admin access is
 * granted live by comparing the user's Clerk email with the `adminEmail` on their
 * OB member row, so this sync only reports whether the designated emails belong
 * to real Clerk users. No Clerk metadata is written.
 */
async function syncOBAdminEmails(): Promise<{ synced: number; errors: number; errorsList: string[] }> {
  const db = createDb();
  const rows = await db.select().from(obMembers).where(eq(obMembers.status, "approved")).all();
  const adminEmails = [
    ...new Set(
      rows
        .map((r) => r.adminEmail)
        .filter((email): email is string => !!email)
        .map((email) => email.toLowerCase()),
    ),
  ];

  const results = { synced: 0, errors: 0, errorsList: [] as string[] };

  for (const email of adminEmails) {
    try {
      const users = await clerkClient.users.getUserList({ emailAddress: [email] });
      if (!users.data[0]) {
        results.errorsList.push(`No Clerk user found for ${email}`);
        results.errors++;
        continue;
      }
      results.synced++;
    } catch (err) {
      results.errorsList.push(
        `Error checking ${email}: ${err instanceof Error ? err.message : String(err)}`,
      );
      results.errors++;
    }
  }

  return results;
}

/**
 * Auto-sync the current published principal into the current year's President slot
 * (name + portrait), so the OB committee always reflects the principal.
 */
async function syncPrincipalAsOBAdmin(): Promise<{ synced: number; errors: number; errorsList: string[] }> {
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
          adminEmail: null,
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

/**
 * Check if a user is an OB admin (approved member with admin email) or a site admin.
 * Used to gate create/update/delete operations on events and donations.
 */
async function requireOBAdminOrSiteAdmin(userId: string, auth?: { adminCalled?: boolean }) {
  if (auth?.adminCalled) return true;
  if (await isOBAdmin(userId)) return true;
  throw new ORPCError("FORBIDDEN", { message: "OB admin or site admin access required." });
}

/**
 * Check if a user is an OB admin: an approved OB member whose Clerk email matches
 * the `adminEmail` stored on their OB member row.
 */
async function isOBAdmin(userId: string): Promise<boolean> {
  const db = createDb();
  const row = await db.select().from(obMembers).where(eq(obMembers.userId, userId)).get();
  if (!row || row.status !== "approved" || !row.adminEmail) return false;
  const userEmail = await getUserEmail(userId);
  return !!userEmail && userEmail === row.adminEmail.toLowerCase();
}

// --- OB Members Router ---

export const obMembersRouter = {
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.string().optional(),
        status: z.enum(["pending", "approved", "rejected", "revoked"]).optional(),
        year: z.string().optional(),
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
      if (input.year) {
        conditions.push(eq(obMembers.year, input.year));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(obMembers).where(where).orderBy(asc(obMembers.sortOrder)).all();
      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        name: row.name,
        role: row.role,
        email: row.email,
        adminEmail: row.adminEmail,
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
        adminEmail: row.adminEmail,
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
        status: z.enum(["pending", "approved", "rejected", "revoked"]).default("approved"),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const callerIsOBAdmin = await isOBAdmin(context.auth.userId);
      if (!isSiteAdmin && !callerIsOBAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin or site admin access required." });
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
        status: z.enum(["pending", "approved", "rejected", "revoked"]).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const callerIsOBAdmin = await isOBAdmin(context.auth.userId);
      if (!isSiteAdmin && !callerIsOBAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin or site admin access required." });
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
      const record = await db.update(obMembers).set(setData).where(eq(obMembers.id, id)).returning().get();
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
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const callerIsOBAdmin = await isOBAdmin(context.auth.userId);
      if (!isSiteAdmin && !callerIsOBAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin or site admin access required." });
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
    if (!userId) return null;      const db = createDb();
      const row = await db.select().from(obMembers).where(eq(obMembers.userId, userId)).get();
      if (!row) return null;
      const isAdmin =
        row.status === "approved" && !!row.adminEmail
          ? (await getUserEmail(userId))?.toLowerCase() === row.adminEmail.toLowerCase()
          : false;
      return {
        id: row.id,
        userId: row.userId,
        name: row.name,
        role: row.role,
        email: row.email,
        adminEmail: row.adminEmail,
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
      const existing = await db.select().from(obMembers).where(eq(obMembers.userId, context.auth.userId)).get();
      if (existing) {
        if (existing.status === "approved") {
          return {
            id: existing.id,
            userId: existing.userId,
            name: existing.name,
            role: existing.role,
            email: existing.email,
            adminEmail: existing.adminEmail,
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
          adminEmail: updated.adminEmail,
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
        adminEmail: record.adminEmail,
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
        adminEmail: updated.adminEmail,
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
        adminEmail: updated.adminEmail,
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
        adminEmail: updated.adminEmail,
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

  /** Validate OB admin emails against Clerk. Site admin only. */
  syncOBAdminEmails: protectedProcedure.handler(async ({ context }) => {
    if (!context.auth?.userId) {
      throw new ORPCError("UNAUTHORIZED");
    }
    const isSiteAdmin = context.auth?.adminCalled ?? false;
    if (!isSiteAdmin) {
      throw new ORPCError("FORBIDDEN", { message: "Site admin access required." });
    }
    return syncOBAdminEmails();
  }),

  /** Auto-sync current Principal as OB admin. Site admin only. */
  syncPrincipalAsOBAdmin: protectedProcedure.handler(async ({ context }) => {
    if (!context.auth?.userId) {
      throw new ORPCError("UNAUTHORIZED");
    }
    const isSiteAdmin = context.auth?.adminCalled ?? false;
    if (!isSiteAdmin) {
      throw new ORPCError("FORBIDDEN", { message: "Site admin access required." });
    }
    return syncPrincipalAsOBAdmin();
  }),

  /**
   * Set the OB admin email for a specific year. The admin is any approved member
   * of that year whose email matches — not necessarily the President. Site admin only.
   */
  setOBAdmin: protectedProcedure
    .input(z.object({ year: z.string(), email: z.string().email().optional().nullable() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      if (!isSiteAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "Site admin access required." });
      }
      const db = createDb();
      const now = new Date();

      // Clear the admin designation from every approved member of the year.
      const yearAdmins = await db
        .select()
        .from(obMembers)
        .where(and(eq(obMembers.year, input.year), eq(obMembers.status, "approved")))
        .all();
      for (const admin of yearAdmins) {
        if (admin.adminEmail) {
          await db.update(obMembers).set({ adminEmail: null, updatedAt: now }).where(eq(obMembers.id, admin.id)).run();
        }
      }

      if (!input.email) {
        await syncOBAdminEmails();
        return { success: true, adminEmail: null };
      }

      let target = yearAdmins[0];
      if (!target) {
        const email = input.email;
        const values = {
          id: crypto.randomUUID() as string,
          userId: context.auth.userId as string,
          name: email.split("@")[0] ?? email,
          role: "ADMINISTRATOR" as const,
          email,
          photo: null,
          bio: null,
          year: input.year,
          sortOrder: 0,
          status: "approved" as const,
          decidedBy: context.auth.userId as string,
          decidedAt: now,
          createdAt: now,
          updatedAt: now,
        };
        target = await db.insert(obMembers).values(values).returning().get();
      }

      const record = await db.update(obMembers).set({ adminEmail: input.email, updatedAt: now }).where(eq(obMembers.id, target.id)).returning().get();
      await syncOBAdminEmails();

      return { success: true, adminEmail: record.adminEmail };
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
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const callerIsOBAdmin = await isOBAdmin(context.auth.userId);
      if (!isSiteAdmin && !callerIsOBAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin or site admin access required." });
      }
      const db = createDb();
      const now = new Date();
      const submittedIds = input.entries.map((e) => e.id).filter((id): id is string => !!id);

      for (const entry of input.entries) {
        if (entry.id) {
          const existing = await db.select().from(obMembers).where(eq(obMembers.id, entry.id)).get();
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
              adminEmail: null,
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
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const callerIsOBAdmin = await isOBAdmin(context.auth.userId);
      if (!isSiteAdmin && !callerIsOBAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin or site admin access required." });
      }
      const db = createDb();
      const slug = input.slug
        ? await generateUniqueSlug(obEvents, input.slug)
        : await generateUniqueSlug(obEvents, input.title);
      let status: "draft" | "published" = input.publishNow ? "published" : "draft";
      let publishedAt: Date | null = null;
      if (input.publishNow && !isSiteAdmin) {
        status = "draft";
        publishedAt = null;
      } else if (status === "published") {
        publishedAt = new Date();
      }
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
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const callerIsOBAdmin = await isOBAdmin(context.auth.userId);
      if (!isSiteAdmin && !callerIsOBAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "OB admin or site admin access required." });
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
      if (updateData.eventDate !== undefined) setData.eventDate = updateData.eventDate ? new Date(updateData.eventDate) : null;
      if (updateData.endDate !== undefined) setData.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
      if (updateData.isAllDay !== undefined) setData.isAllDay = updateData.isAllDay;
      if (updateData.status !== undefined) {
        if (!isSiteAdmin && updateData.status === "published" && existing.status !== "published") {
          throw new ORPCError("FORBIDDEN", { message: "Only site admin can publish OB events." });
        }
        setData.status = updateData.status;
        if (updateData.status === "published" && existing.status !== "published") {
          setData.publishedAt = now;
        }
      }
      if (updateData.publishNow) {
        if (!isSiteAdmin) {
          throw new ORPCError("FORBIDDEN", { message: "Only site admin can publish OB events." });
        }
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
