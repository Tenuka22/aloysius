import { z } from "zod";
import { and, eq, desc, asc, inArray, sql } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { activities, clubMembers } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { createClerkClient } from "@clerk/backend";
import { env } from "@aloysius-web/env/server";
import { protectedProcedure } from "../index";
import {
  getMembership,
  getMembershipById,
  serializeMembership,
  isApprovedMember,
  resolveClubAccess,
  getUserEmail,
  type MembershipRow,
} from "../lib/club-access";
import { createNotification, createNotifications } from "../lib/notifications";

const clerkClient = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

function serializeActivity(row: typeof activities.$inferSelect) {
  return {
    id: row.id,
    slug: row.slug,
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
}

export const clubsRouter = {
  /** All clubs the current user belongs to (approved member or club admin), with their membership. */
  myClubs: protectedProcedure.handler(async ({ context }) => {
    const userId = context.auth?.userId;
    if (!userId) throw new ORPCError("UNAUTHORIZED");

    const db = createDb();
    const rows = await db
      .select()
      .from(clubMembers)
      .where(eq(clubMembers.userId, userId))
      .orderBy(desc(clubMembers.updatedAt))
      .all();

    const activityIds = rows.map((r) => r.activityId);
    const allActivities =
      activityIds.length > 0
        ? await db.select().from(activities).where(inArray(activities.id, activityIds)).all()
        : [];

    const activityMap = new Map(allActivities.map((a) => [a.id, a]));

    const userEmail = await getUserEmail(userId);

    // Include activities where the user is the designated admin by email even if
    // they don't have a club_members row yet, so the admin UI and navbar show up.
    if (userEmail) {
      const adminActivities = await db
        .select()
        .from(activities)
        .where(sql`lower(${activities.adminEmail}) = ${userEmail}`)
        .all();
      for (const a of adminActivities) {
        if (activityMap.has(a.id)) continue;
        activityMap.set(a.id, a);
        rows.push({
          id: `email-admin:${a.id}`,
          activityId: a.id,
          userId,
          name: null,
          role: "admin" as const,
          status: "approved" as const,
          reason: null,
          decidedBy: "system",
          decidedAt: null,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        });
      }
    }

    return rows
      .filter((r) => activityMap.has(r.activityId))
      .map((r) => {
        const activity = activityMap.get(r.activityId)!;
        const isAdmin =
          (r.role === "admin" && r.status === "approved") ||
          (!!userEmail && !!activity.adminEmail && userEmail === activity.adminEmail.toLowerCase());
        return {
          membership: { ...serializeMembership(r as MembershipRow), isAdmin },
          activity: serializeActivity(activity),
        };
      });
  }),

  /** The current user's membership for a single club (or null if none). */
  membership: protectedProcedure
    .input(z.object({ activityId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      const membership = await getMembership(db, input.activityId, userId);
      if (!membership) return null;

      let isAdmin = membership.role === "admin" && membership.status === "approved";
      if (!isAdmin) {
        const activity = await db
          .select()
          .from(activities)
          .where(eq(activities.id, input.activityId))
          .get();
        if (activity?.adminEmail) {
          const userEmail = await getUserEmail(userId);
          isAdmin = !!userEmail && userEmail === activity.adminEmail.toLowerCase();
        }
      }

      return { ...serializeMembership(membership), isAdmin };
    }),

  /** Members of a club. Club admins/site admins see everything; members see approved only. */
  listMembers: protectedProcedure
    .input(z.object({ activityId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      const { membership, isClubAdmin } = await resolveClubAccess(
        db,
        input.activityId,
        userId,
        context.auth?.adminCalled ?? false,
      );

      if (!isClubAdmin && !isApprovedMember(membership)) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "You must be a member of this club to view its members.",
        });
      }

      const rows = await db
        .select()
        .from(clubMembers)
        .where(eq(clubMembers.activityId, input.activityId))
        .orderBy(asc(clubMembers.role), asc(clubMembers.name))
        .all();

      return rows
        .filter((r) => isClubAdmin || r.status === "approved")
        .map((r) => serializeMembership(r as MembershipRow));
    }),

  /** Request to join a club. Creates a pending membership (or re-requests after rejection). */
  requestMembership: protectedProcedure
    .input(z.object({ activityId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, input.activityId))
        .get();

      if (!activity) {
        throw new ORPCError("NOT_FOUND", { message: "Club not found" });
      }

      const existing = await getMembership(db, input.activityId, userId);

      if (existing) {
        if (existing.status === "approved") {
          return serializeMembership(existing);
        }
        if (existing.status === "pending") {
          return serializeMembership(existing);
        }
        // rejected / revoked → allow re-request
        const now = new Date();
        const updated = await db
          .update(clubMembers)
          .set({
            status: "pending",
            reason: null,
            decidedBy: null,
            decidedAt: null,
            updatedAt: now,
          })
          .where(eq(clubMembers.id, existing.id))
          .returning()
          .get();
        return serializeMembership(updated as MembershipRow);
      }

      const id = crypto.randomUUID();
      const now = new Date();

      let name: string | null = null;
      try {
        const user = await clerkClient.users.getUser(userId);
        name =
          user.firstName || user.lastName
            ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
            : null;
      } catch {
        // name is optional
      }

      const record = await db
        .insert(clubMembers)
        .values({
          id,
          activityId: input.activityId,
          userId,
          name,
          role: "member",
          status: "pending",
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();

      // Notify the club's admins about the new request
      const adminRows = await db
        .select()
        .from(clubMembers)
        .where(
          and(
            eq(clubMembers.activityId, input.activityId),
            eq(clubMembers.role, "admin"),
            eq(clubMembers.status, "approved"),
          ),
        )
        .all();
      await createNotifications(
        adminRows
          .filter((a) => a.userId !== userId)
          .map((a) => ({
            userId: a.userId,
            type: "membership_request" as const,
            title: `New membership request: ${activity.name}`,
            body: name ? `${name} requested to join.` : "A user requested to join.",
            link: `/clubs/${input.activityId}`,
          })),
      );

      return serializeMembership(record as MembershipRow);
    }),

  /** Approve a pending membership. Club admin or site admin only. */
  approveMember: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      const membership = await getMembershipById(db, input.id);
      if (!membership) throw new ORPCError("NOT_FOUND", { message: "Membership not found" });

      const { isClubAdmin } = await resolveClubAccess(
        db,
        membership.activityId,
        userId,
        context.auth?.adminCalled ?? false,
      );
      if (!isClubAdmin) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Only club admins can approve membership requests.",
        });
      }

      const now = new Date();
      const updated = await db
        .update(clubMembers)
        .set({
          status: "approved",
          reason: null,
          decidedBy: userId,
          decidedAt: now,
          updatedAt: now,
        })
        .where(eq(clubMembers.id, input.id))
        .returning()
        .get();

      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, membership.activityId))
        .get();
      await createNotification({
        userId: membership.userId,
        type: "membership_approved",
        title: `You're now a member of ${activity?.name ?? "the club"}`,
        body: "Your membership request was approved.",
        link: `/clubs/${membership.activityId}`,
      });

      return serializeMembership(updated as MembershipRow);
    }),

  /** Reject a pending membership. Club admin or site admin only. */
  rejectMember: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      const membership = await getMembershipById(db, input.id);
      if (!membership) throw new ORPCError("NOT_FOUND", { message: "Membership not found" });

      const { isClubAdmin } = await resolveClubAccess(
        db,
        membership.activityId,
        userId,
        context.auth?.adminCalled ?? false,
      );
      if (!isClubAdmin) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Only club admins can reject membership requests.",
        });
      }

      const now = new Date();
      const updated = await db
        .update(clubMembers)
        .set({
          status: "rejected",
          reason: input.reason ?? null,
          decidedBy: userId,
          decidedAt: now,
          updatedAt: now,
        })
        .where(eq(clubMembers.id, input.id))
        .returning()
        .get();

      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, membership.activityId))
        .get();
      await createNotification({
        userId: membership.userId,
        type: "membership_rejected",
        title: `Membership request declined: ${activity?.name ?? "the club"}`,
        body: input.reason ? `Reason: ${input.reason}` : undefined,
        link: `/clubs/${membership.activityId}`,
      });

      return serializeMembership(updated as MembershipRow);
    }),

  /** Revoke an approved member (removes their posting access). Club admin or site admin only. */
  revokeMember: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      const membership = await getMembershipById(db, input.id);
      if (!membership) throw new ORPCError("NOT_FOUND", { message: "Membership not found" });

      const { isClubAdmin } = await resolveClubAccess(
        db,
        membership.activityId,
        userId,
        context.auth?.adminCalled ?? false,
      );
      if (!isClubAdmin) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Only club admins can revoke members.",
        });
      }

      const now = new Date();
      const updated = await db
        .update(clubMembers)
        .set({
          status: "revoked",
          reason: input.reason ?? null,
          decidedBy: userId,
          decidedAt: now,
          updatedAt: now,
        })
        .where(eq(clubMembers.id, input.id))
        .returning()
        .get();

      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, membership.activityId))
        .get();
      await createNotification({
        userId: membership.userId,
        type: "membership_revoked",
        title: `Access revoked: ${activity?.name ?? "the club"}`,
        body: input.reason ? `Reason: ${input.reason}` : "Your club access has been revoked.",
        link: `/clubs/${membership.activityId}`,
      });

      return serializeMembership(updated as MembershipRow);
    }),

};
