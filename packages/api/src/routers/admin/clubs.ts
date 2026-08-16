import { z } from "zod";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { activities, news, events, announcements, studentWorks, clubAlbums } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import { contentKindSchema, reviewActionSchema } from "../../schemas";
import { createNotification } from "../../lib/notifications";

/**
 * Super-user tier for club content moderation. Site admin only (see
 * admin/index.ts) — approving/rejecting club-submitted news/events/
 * announcements/student works/albums, and the cross-activity pending queue.
 */
export const adminClubsRouter = {
  /** Count of content pending review across all five content types. */
  pendingReviewCount: adminProcedure.handler(async () => {
    const db = createDb();
    const [newsCount, eventCount, announcementCount, studentWorkCount, albumCount] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(news)
          .where(eq(news.reviewStatus, "pending"))
          .get(),
        db
          .select({ count: sql<number>`count(*)` })
          .from(events)
          .where(eq(events.reviewStatus, "pending"))
          .get(),
        db
          .select({ count: sql<number>`count(*)` })
          .from(announcements)
          .where(eq(announcements.reviewStatus, "pending"))
          .get(),
        db
          .select({ count: sql<number>`count(*)` })
          .from(studentWorks)
          .where(eq(studentWorks.reviewStatus, "pending"))
          .get(),
        db
          .select({ count: sql<number>`count(*)` })
          .from(clubAlbums)
          .where(eq(clubAlbums.reviewStatus, "pending"))
          .get(),
      ]);

    return (
      Number(newsCount?.count ?? 0) +
      Number(eventCount?.count ?? 0) +
      Number(announcementCount?.count ?? 0) +
      Number(studentWorkCount?.count ?? 0) +
      Number(albumCount?.count ?? 0)
    );
  }),

  /** All content pending review across news, events, announcements, student works, and albums. */
  listPendingContent: adminProcedure.handler(async () => {
    const db = createDb();

    const [newsRows, eventRows, announcementRows, studentWorkRows, albumRows] = await Promise.all([
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
        activityName: r.activityId ? (activityMap.get(r.activityId)?.name ?? null) : null,
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
        activityName: r.activityId ? (activityMap.get(r.activityId)?.name ?? null) : null,
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
        activityName: r.activityId ? (activityMap.get(r.activityId)?.name ?? null) : null,
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
        activityName: r.activityId ? (activityMap.get(r.activityId)?.name ?? null) : null,
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

  /** Approve or reject a piece of club content. */
  reviewContent: adminProcedure
    .input(
      z.object({
        type: contentKindSchema,
        id: z.string(),
        action: reviewActionSchema,
        reason: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
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
        const existing = await db
          .select()
          .from(clubAlbums)
          .where(eq(clubAlbums.id, input.id))
          .get();
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
