import { z } from "zod";
import { and, eq, desc, asc, inArray, sql } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { activities, clubMembers, events, announcements, studentWorks, news, clubAlbums } from "@aloysius-web/db/schema";
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
          .set({ status: "pending", reason: null, decidedBy: null, decidedAt: null, updatedAt: now })
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
        .set({ status: "approved", reason: null, decidedBy: userId, decidedAt: now, updatedAt: now })
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

  /** Count of content pending review across all four content types. Site admin only. */
  pendingReviewCount: protectedProcedure.handler(async ({ context }) => {
    if (!context.auth?.adminCalled) {
      throw new ORPCError("UNAUTHORIZED", { message: "Site admin access required." });
    }

    const db = createDb();
    const [newsCount, eventCount, announcementCount, studentWorkCount, albumCount] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(news).where(eq(news.reviewStatus, "pending")).get(),
        db.select({ count: sql<number>`count(*)` }).from(events).where(eq(events.reviewStatus, "pending")).get(),
        db.select({ count: sql<number>`count(*)` }).from(announcements).where(eq(announcements.reviewStatus, "pending")).get(),
        db.select({ count: sql<number>`count(*)` }).from(studentWorks).where(eq(studentWorks.reviewStatus, "pending")).get(),
        db.select({ count: sql<number>`count(*)` }).from(clubAlbums).where(eq(clubAlbums.reviewStatus, "pending")).get(),
      ]);

    return (
      Number(newsCount?.count ?? 0) +
      Number(eventCount?.count ?? 0) +
      Number(announcementCount?.count ?? 0) +
      Number(studentWorkCount?.count ?? 0) +
      Number(albumCount?.count ?? 0)
    );
  }),

  /** All content pending review across news, events, announcements and student works. Site admin only. */
  listPendingContent: protectedProcedure.handler(async ({ context }) => {
    if (!context.auth?.adminCalled) {
      throw new ORPCError("UNAUTHORIZED", { message: "Site admin access required." });
    }

    const db = createDb();

    const [newsRows, eventRows, announcementRows, studentWorkRows, albumRows] =
      await Promise.all([
        db
          .select()
          .from(news)
          .where(eq(news.reviewStatus, "pending"))
          .orderBy(desc(news.updatedAt))
          .all(),
        db
          .select()
          .from(events)
          .where(eq(events.reviewStatus, "pending"))
          .orderBy(desc(events.updatedAt))
          .all(),
        db
          .select()
          .from(announcements)
          .where(eq(announcements.reviewStatus, "pending"))
          .orderBy(desc(announcements.updatedAt))
          .all(),
        db
          .select()
          .from(studentWorks)
          .where(eq(studentWorks.reviewStatus, "pending"))
          .orderBy(desc(studentWorks.updatedAt))
          .all(),
        db
          .select()
          .from(clubAlbums)
          .where(eq(clubAlbums.reviewStatus, "pending"))
          .orderBy(desc(clubAlbums.updatedAt))
          .all(),
      ]);

    const activityIds = [
      ...newsRows.map((r) => r.activityId),
      ...eventRows.map((r) => r.activityId),
      ...announcementRows.map((r) => r.activityId),
      ...studentWorkRows.map((r) => r.activityId),
      ...albumRows.map((r) => r.activityId),
    ].filter((id): id is string => !!id);

    const activityRows =
      activityIds.length > 0
        ? await db.select().from(activities).where(inArray(activities.id, activityIds)).all()
        : [];
    const activityMap = new Map(activityRows.map((a) => [a.id, a]));

    const items = [
      ...newsRows.map((r) => ({
        type: "news" as const,
        id: r.id,
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        coverImage: r.coverImage,
        activityId: r.activityId,
        activityName: r.activityId ? activityMap.get(r.activityId)?.name ?? null : null,
        userId: r.userId,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      ...eventRows.map((r) => ({
        type: "event" as const,
        id: r.id,
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        coverImage: r.coverImage,
        activityId: r.activityId,
        activityName: r.activityId ? activityMap.get(r.activityId)?.name ?? null : null,
        userId: r.userId,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      ...announcementRows.map((r) => ({
        type: "announcement" as const,
        id: r.id,
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        coverImage: r.coverImage,
        activityId: r.activityId,
        activityName: r.activityId ? activityMap.get(r.activityId)?.name ?? null : null,
        userId: r.userId,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      ...studentWorkRows.map((r) => ({
        type: "studentWork" as const,
        id: r.id,
        slug: r.slug,
        title: r.title,
        excerpt: r.description,
        coverImage: r.coverImage,
        activityId: r.activityId,
        activityName: r.activityId ? activityMap.get(r.activityId)?.name ?? null : null,
        userId: r.userId,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      ...albumRows.map((r) => ({
        type: "album" as const,
        id: r.id,
        slug: "",
        title: r.title,
        excerpt: r.description,
        coverImage: r.coverImage,
        activityId: r.activityId,
        activityName: activityMap.get(r.activityId)?.name ?? null,
        userId: r.userId,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return items;
  }),

  /** Approve or reject a piece of club content. Site admin only. */
  reviewContent: protectedProcedure
    .input(
      z.object({
        type: z.enum(["news", "event", "announcement", "studentWork", "album"]),
        id: z.string(),
        action: z.enum(["approve", "reject"]),
        reason: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.adminCalled) {
        throw new ORPCError("UNAUTHORIZED", { message: "Site admin access required." });
      }

      const db = createDb();
      const now = new Date();
      const reviewerId = context.auth.userId!;

      const reviewFields = {
        reviewStatus: input.action === "approve" ? ("approved" as const) : ("rejected" as const),
        reviewedBy: reviewerId,
        reviewedAt: now,
        rejectionReason: input.action === "reject" ? (input.reason ?? null) : null,
      };

      let authorUserId: string | null = null;
      let authorActivityId: string | null = null;
      let authorTitle = "";

      if (input.type === "news") {
        const existing = await db.select().from(news).where(eq(news.id, input.id)).get();
        if (!existing) throw new ORPCError("NOT_FOUND", { message: "News not found" });
        authorUserId = existing.userId;
        authorActivityId = existing.activityId;
        authorTitle = existing.title;
        await db
          .update(news)
          .set({
            ...reviewFields,
            status: input.action === "approve" ? "published" : "draft",
            publishedAt: input.action === "approve" ? now : null,
            updatedAt: now,
          })
          .where(eq(news.id, input.id))
          .run();
      } else if (input.type === "event") {
        const existing = await db.select().from(events).where(eq(events.id, input.id)).get();
        if (!existing) throw new ORPCError("NOT_FOUND", { message: "Event not found" });
        authorUserId = existing.userId;
        authorActivityId = existing.activityId;
        authorTitle = existing.title;
        await db
          .update(events)
          .set({
            ...reviewFields,
            status: input.action === "approve" ? "published" : "draft",
            publishedAt: input.action === "approve" ? now : null,
            updatedAt: now,
          })
          .where(eq(events.id, input.id))
          .run();
      } else if (input.type === "announcement") {
        const existing = await db
          .select()
          .from(announcements)
          .where(eq(announcements.id, input.id))
          .get();
        if (!existing) throw new ORPCError("NOT_FOUND", { message: "Announcement not found" });
        authorUserId = existing.userId;
        authorActivityId = existing.activityId;
        authorTitle = existing.title;
        await db
          .update(announcements)
          .set({
            ...reviewFields,
            status: input.action === "approve" ? "published" : "draft",
            publishedAt: input.action === "approve" ? now : null,
            updatedAt: now,
          })
          .where(eq(announcements.id, input.id))
          .run();
      } else if (input.type === "album") {
        const existing = await db.select().from(clubAlbums).where(eq(clubAlbums.id, input.id)).get();
        if (!existing) throw new ORPCError("NOT_FOUND", { message: "Album not found" });
        authorUserId = existing.userId;
        authorActivityId = existing.activityId;
        authorTitle = existing.title;
        await db
          .update(clubAlbums)
          .set({
            ...reviewFields,
            status: input.action === "approve" ? "published" : "draft",
            featuredOnHome: input.action === "approve" ? existing.featuredOnHome : false,
            updatedAt: now,
          })
          .where(eq(clubAlbums.id, input.id))
          .run();
      } else {
        const existing = await db
          .select()
          .from(studentWorks)
          .where(eq(studentWorks.id, input.id))
          .get();
        if (!existing) throw new ORPCError("NOT_FOUND", { message: "Student work not found" });
        authorUserId = existing.userId;
        authorActivityId = existing.activityId;
        authorTitle = existing.title;
        await db
          .update(studentWorks)
          .set({
            ...reviewFields,
            status: input.action === "approve" ? "published" : "draft",
            publishedAt: input.action === "approve" ? now : null,
            updatedAt: now,
          })
          .where(eq(studentWorks.id, input.id))
          .run();
      }

      const typeLabel =
        input.type === "news"
          ? "News"
          : input.type === "event"
            ? "Event"
            : input.type === "announcement"
              ? "Announcement"
              : input.type === "album"
                ? "Photo album"
                : "Student work";
      if (authorUserId) {
        await createNotification({
          userId: authorUserId,
          type: input.action === "approve" ? "content_approved" : "content_rejected",
          title:
            input.action === "approve"
              ? `${typeLabel} approved: ${authorTitle}`
              : `${typeLabel} rejected: ${authorTitle}`,
          body:
            input.action === "reject"
              ? input.reason
                ? `Reason: ${input.reason}`
                : undefined
              : "Your content is now live.",
          link: authorActivityId ? `/clubs/${authorActivityId}` : undefined,
        });
      }

      return { success: true };
    }),

};