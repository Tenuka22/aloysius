import { z } from "zod";
import { eq, desc, asc, like, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { events, eventRecords } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import {
  authorTypeSchema,
  contentStatusSchema,
  reviewStatusSchema,
  sortDirectionSchema,
} from "../schemas";
import { generateUniqueSlug, checkSlugUnique } from "../lib/slug";
import { resolveClubAccess, assertClubMember } from "../lib/club-access";

export const eventsRouter = {
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirectionSchema.default("desc"),
        search: z.string().optional(),
        status: contentStatusSchema.optional(),
        activityId: z.string().optional(),
        reviewStatus: reviewStatusSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, search, status } = input;
      const offset = (page - 1) * pageSize;

      // Review visibility: non-members can only see approved club content.
      // Site admins always see everything.
      const userId = context.auth?.userId ?? null;
      const isSiteAdmin = context.auth?.role === "admin";
      let canSeeNonApproved = isSiteAdmin;
      if (input.activityId && userId) {
        const { membership, isClubAdmin } = await resolveClubAccess(
          db,
          input.activityId,
          userId,
          isSiteAdmin,
        );
        canSeeNonApproved = canSeeNonApproved || isClubAdmin || membership?.status === "approved";
      }

      const conditions = [];
      if (search) {
        conditions.push(like(events.title, `%${search}%`));
      }
      if (status) {
        if (status !== "published" && !isSiteAdmin && !canSeeNonApproved) {
          throw new ORPCError("UNAUTHORIZED", { message: "Only published content is publicly visible." });
        }
        conditions.push(eq(events.status, status));
      } else if (!isSiteAdmin && !canSeeNonApproved) {
        conditions.push(eq(events.status, "published"));
      }
      if (input.activityId) {
        conditions.push(eq(events.activityId, input.activityId));
      }
      if (input.reviewStatus) {
        if (input.reviewStatus !== "approved" && !canSeeNonApproved) {
          throw new ORPCError("UNAUTHORIZED", {
            message: "You must be a club member to view pending content.",
          });
        }
        conditions.push(eq(events.reviewStatus, input.reviewStatus));
      } else if (!canSeeNonApproved) {
        // Public listings only surface approved content.
        conditions.push(eq(events.reviewStatus, "approved"));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumn =
        sort === "title"
          ? events.title
          : sort === "status"
            ? events.status
            : sort === "startDate"
              ? events.startDate
              : sort === "createdAt"
                ? events.createdAt
                : events.createdAt;
      const orderFn = sortDir === "asc" ? asc : desc;

      const [countRow] = await db.select({ total: count() }).from(events).where(where).all();
      const total = countRow?.total ?? 0;

      const rows = await db
        .select()
        .from(events)
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset)
        .all();

      return {
        rows: rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          excerpt: row.excerpt,
          coverImage: row.coverImage,
          bodyImage: row.bodyImage,
          purpose: row.purpose,
          organization: row.organization,
          organizerName: row.organizerName,
          organizerType: row.organizerType,
          location: row.location,
          startDate: row.startDate.toISOString(),
          endDate: row.endDate?.toISOString() ?? null,
          isRecurring: row.isRecurring,
          isAllDay: row.isAllDay,
          recurrenceRule: row.recurrenceRule,
          tags: row.tags,
          status: row.status,
          activityId: row.activityId,
          reviewStatus: row.reviewStatus,
          reviewedBy: row.reviewedBy,
          reviewedAt: row.reviewedAt?.toISOString() ?? null,
          rejectionReason: row.rejectionReason,
          publishedAt: row.publishedAt?.toISOString() ?? null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
        total,
        pageCount: Math.ceil(total / pageSize),
        page,
        pageSize,
      };
    }),

  get: publicProcedure
    .input(z.union([z.object({ id: z.string() }), z.object({ slug: z.string() })]))
    .handler(async ({ input, context }) => {
      const db = createDb();
      const row =
        "id" in input
          ? await db.select().from(events).where(eq(events.id, input.id)).get()
          : await db.select().from(events).where(eq(events.slug, input.slug)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Event not found" });
      }

      // Non-published/non-approved content is only visible to the author, club members/admins, or site admins.
      const isSiteAdmin = context.auth?.role === "admin";
      const userId = context.auth?.userId ?? null;
      const isAuthor = userId !== null && userId === row.userId;
      const needsGating = row.status !== "published" || (!!row.activityId && row.reviewStatus !== "approved");
      if (needsGating) {
        let canView = isSiteAdmin || isAuthor;
        if (!canView && userId && row.activityId) {
          const { membership, isClubAdmin } = await resolveClubAccess(
            db,
            row.activityId,
            userId,
            isSiteAdmin,
          );
          canView = isClubAdmin || membership?.status === "approved";
        }
        if (!canView) {
          throw new ORPCError("NOT_FOUND", { message: "Event not found" });
        }
      }

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        content: row.content,
        excerpt: row.excerpt,
        coverImage: row.coverImage,
        bodyImage: row.bodyImage,
        purpose: row.purpose,
        organization: row.organization,
        organizerName: row.organizerName,
        organizerType: row.organizerType,
        location: row.location,
        startDate: row.startDate.toISOString(),
        endDate: row.endDate?.toISOString() ?? null,
        isRecurring: row.isRecurring,
        isAllDay: row.isAllDay,
        recurrenceRule: row.recurrenceRule,
        tags: row.tags,
        status: row.status,
        activityId: row.activityId,
        reviewStatus: row.reviewStatus,
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt?.toISOString() ?? null,
        rejectionReason: row.rejectionReason,
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
        content: z.string(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        bodyImage: z.string().optional(),
        purpose: z.string().optional(),
        organization: z.string().optional(),
        organizerName: z.string().optional(),
        organizerType: authorTypeSchema.optional(),
        location: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        isRecurring: z.boolean().optional(),
        isAllDay: z.boolean().optional(),
        recurrenceRule: z.string().optional(),
        tags: z.array(z.string()).optional(),
        publishNow: z.boolean().optional(),
        activityId: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!input.activityId) {
        throw new ORPCError("FORBIDDEN", {
          message: "A club (activityId) is required. General events are created via site admin.",
        });
      }

      const db = createDb();
      const { membership, isClubAdmin } = await resolveClubAccess(
        db,
        input.activityId,
        context.auth.userId,
        context.auth.role === "admin",
      );
      assertClubMember(membership, context.auth.role === "admin", isClubAdmin);

      const reviewStatus: "pending" | "approved" = context.auth.role === "admin" ? "approved" : "pending";
      const status: "draft" | "published" =
        context.auth.role === "admin" && input.publishNow ? "published" : "draft";
      const publishedAt: Date | null = status === "published" ? new Date() : null;

      const id = crypto.randomUUID();
      const slug = input.slug
        ? await generateUniqueSlug(events, input.slug)
        : await generateUniqueSlug(events, input.title);

      const record = await db
        .insert(events)
        .values({
          id,
          slug,
          title: input.title,
          content: input.content,
          excerpt: input.excerpt ?? null,
          coverImage: input.coverImage ?? null,
          bodyImage: input.bodyImage ?? null,
          purpose: input.purpose ?? null,
          organization: input.organization ?? null,
          organizerName: input.organizerName ?? null,
          organizerType: input.organizerType ?? null,
          location: input.location ?? null,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          isRecurring: input.isRecurring ?? false,
          isAllDay: input.isAllDay ?? false,
          recurrenceRule: input.recurrenceRule ?? null,
          tags: input.tags ?? [],
          status,
          activityId: input.activityId,
          reviewStatus,
          publishedAt,
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
        bodyImage: record.bodyImage,
        purpose: record.purpose,
        organization: record.organization,
        organizerName: record.organizerName,
        organizerType: record.organizerType,
        location: record.location,
        startDate: record.startDate.toISOString(),
        endDate: record.endDate?.toISOString() ?? null,
        isRecurring: record.isRecurring,
        isAllDay: record.isAllDay,
        recurrenceRule: record.recurrenceRule,
        tags: record.tags,
        status: record.status,
        activityId: record.activityId,
        reviewStatus: record.reviewStatus,
        reviewedBy: record.reviewedBy,
        reviewedAt: record.reviewedAt?.toISOString() ?? null,
        rejectionReason: record.rejectionReason,
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
        content: z.string().optional(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        bodyImage: z.string().optional(),
        purpose: z.string().optional(),
        organization: z.string().optional(),
        organizerName: z.string().optional(),
        organizerType: authorTypeSchema.optional(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isRecurring: z.boolean().optional(),
        isAllDay: z.boolean().optional(),
        recurrenceRule: z.string().optional(),
        tags: z.array(z.string()).optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db.select().from(events).where(eq(events.id, input.id)).get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Event not found" });
      }
      if (!existing.activityId) {
        throw new ORPCError("FORBIDDEN", {
          message: "General events can only be edited by a site admin.",
        });
      }

      const { membership, isClubAdmin } = await resolveClubAccess(
        db,
        existing.activityId,
        context.auth.userId,
        context.auth.role === "admin",
      );
      assertClubMember(membership, context.auth.role === "admin", isClubAdmin);

      const now = new Date();
      const updateData: Record<string, unknown> = {
        updatedAt: now,
      };

      if (!context.auth.role === "admin") {
        updateData.reviewStatus = "pending";
        updateData.status = "draft";
        updateData.publishedAt = null;
        updateData.reviewedBy = null;
        updateData.reviewedAt = null;
        updateData.rejectionReason = null;
      }

      if (input.slug !== undefined) {
        updateData.slug = await generateUniqueSlug(events, input.slug, input.id);
      }
      if (input.title !== undefined) {
        updateData.title = input.title;
        if (input.slug === undefined) {
          updateData.slug = await generateUniqueSlug(events, input.title, input.id);
        }
      }
      if (input.content !== undefined) updateData.content = input.content;
      if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
      if (input.bodyImage !== undefined) updateData.bodyImage = input.bodyImage;
      if (input.purpose !== undefined) updateData.purpose = input.purpose;
      if (input.organization !== undefined) updateData.organization = input.organization;
      if (input.organizerName !== undefined) updateData.organizerName = input.organizerName || null;
      if (input.organizerType !== undefined) updateData.organizerType = input.organizerType || null;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
      if (input.endDate !== undefined)
        updateData.endDate = input.endDate ? new Date(input.endDate) : null;
      if (input.isRecurring !== undefined) updateData.isRecurring = input.isRecurring;
      if (input.isAllDay !== undefined) updateData.isAllDay = input.isAllDay;
      if (input.recurrenceRule !== undefined) updateData.recurrenceRule = input.recurrenceRule;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (context.auth.role === "admin" && input.publishNow === true && !existing.publishedAt) {
        updateData.publishedAt = now;
        updateData.status = "published";
      }

      const record = await db
        .update(events)
        .set(updateData)
        .where(eq(events.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        content: record.content,
        excerpt: record.excerpt,
        coverImage: record.coverImage,
        bodyImage: record.bodyImage,
        purpose: record.purpose,
        organization: record.organization,
        organizerName: record.organizerName,
        organizerType: record.organizerType,
        location: record.location,
        startDate: record.startDate.toISOString(),
        endDate: record.endDate?.toISOString() ?? null,
        isRecurring: record.isRecurring,
        isAllDay: record.isAllDay,
        recurrenceRule: record.recurrenceRule,
        tags: record.tags,
        status: record.status,
        activityId: record.activityId,
        reviewStatus: record.reviewStatus,
        reviewedBy: record.reviewedBy,
        reviewedAt: record.reviewedAt?.toISOString() ?? null,
        rejectionReason: record.rejectionReason,
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

      const db = createDb();
      const existing = await db.select().from(events).where(eq(events.id, input.id)).get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Event not found" });
      }
      if (!existing.activityId) {
        throw new ORPCError("FORBIDDEN", {
          message: "General events can only be deleted by a site admin.",
        });
      }

      const { isClubAdmin } = await resolveClubAccess(
        db,
        existing.activityId,
        context.auth.userId,
        context.auth.role === "admin",
      );
      const isAuthor = existing.userId === context.auth.userId;
      if (!isAuthor && !isClubAdmin) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Only the author or a club admin can delete this.",
        });
      }

      await db.delete(events).where(eq(events.id, input.id)).run();

      return { success: true };
    }),

  listRecords: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const rows = await db
        .select()
        .from(eventRecords)
        .where(eq(eventRecords.eventId, input.eventId))
        .orderBy(desc(eventRecords.recordedAt))
        .all();

      return rows.map((row) => ({
        id: row.id,
        eventId: row.eventId,
        outcome: row.outcome,
        reason: row.reason,
        notes: row.notes,
        recordedAt: row.recordedAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      }));
    }),

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .handler(async ({ input }) => {
      return checkSlugUnique(events, input.slug, input.excludeId);
    }),
};
