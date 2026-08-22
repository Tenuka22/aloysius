import { z } from "zod";
import { eq, desc, asc, like, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { news } from "@aloysius-web/db/schema";
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
import {
  CAPABILITY_MANAGE_NEWS,
  fetchActivityCapabilities,
  assertCapability,
} from "../lib/capabilities";

export const newsRouter = {
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
        conditions.push(like(news.title, `%${search}%`));
      }
      if (status) {
        if (status !== "published" && !isSiteAdmin && !canSeeNonApproved) {
          throw new ORPCError("UNAUTHORIZED", { message: "Only published content is publicly visible." });
        }
        conditions.push(eq(news.status, status));
      } else if (!isSiteAdmin && !canSeeNonApproved) {
        conditions.push(eq(news.status, "published"));
      }
      if (input.activityId) {
        conditions.push(eq(news.activityId, input.activityId));
      }
      if (input.reviewStatus) {
        if (input.reviewStatus !== "approved" && !canSeeNonApproved) {
          throw new ORPCError("UNAUTHORIZED", {
            message: "You must be a club member to view pending content.",
          });
        }
        conditions.push(eq(news.reviewStatus, input.reviewStatus));
      } else if (!canSeeNonApproved) {
        conditions.push(eq(news.reviewStatus, "approved"));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumn =
        sort === "title"
          ? news.title
          : sort === "status"
            ? news.status
            : sort === "createdAt"
              ? news.createdAt
              : news.createdAt;
      const orderFn = sortDir === "asc" ? asc : desc;

      const [countRow] = await db.select({ total: count() }).from(news).where(where).all();
      const total = countRow?.total ?? 0;

      const rows = await db
        .select()
        .from(news)
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
          tags: row.tags,
          status: row.status,
          publishedAt: row.publishedAt?.toISOString() ?? null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          authorName: row.authorName,
          authorType: row.authorType,
          activityId: row.activityId,
          reviewStatus: row.reviewStatus,
          reviewedBy: row.reviewedBy,
          reviewedAt: row.reviewedAt?.toISOString() ?? null,
          rejectionReason: row.rejectionReason,
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
          ? await db.select().from(news).where(eq(news.id, input.id)).get()
          : await db.select().from(news).where(eq(news.slug, input.slug)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "News not found" });
      }

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
          throw new ORPCError("NOT_FOUND", { message: "News not found" });
        }
      }

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        content: row.content,
        excerpt: row.excerpt,
        coverImage: row.coverImage,
        tags: row.tags,
        status: row.status,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        authorName: row.authorName,
        authorType: row.authorType,
        activityId: row.activityId,
        reviewStatus: row.reviewStatus,
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt?.toISOString() ?? null,
        rejectionReason: row.rejectionReason,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().optional(),
        content: z.string(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        publishNow: z.boolean().optional(),
        authorName: z.string().optional(),
        authorType: authorTypeSchema.optional(),
        activityId: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      if (!input.activityId) {
        throw new ORPCError("FORBIDDEN", {
          message: "A club (activityId) is required. General news is created via site admin.",
        });
      }

      const db = createDb();
      const capabilities = await fetchActivityCapabilities(db, input.activityId);
      assertCapability(capabilities, CAPABILITY_MANAGE_NEWS);
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
        ? await generateUniqueSlug(news, input.slug)
        : await generateUniqueSlug(news, input.title);

      const record = await db
        .insert(news)
        .values({
          id,
          slug,
          title: input.title,
          content: input.content,
          excerpt: input.excerpt ?? null,
          coverImage: input.coverImage ?? null,
          tags: input.tags ?? [],
          status,
          publishedAt,
          userId: context.auth.userId,
          authorName: input.authorName ?? null,
          authorType: input.authorType ?? null,
          activityId: input.activityId,
          reviewStatus,
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
        tags: record.tags,
        status: record.status,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        authorName: record.authorName,
        authorType: record.authorType,
        activityId: record.activityId,
        reviewStatus: record.reviewStatus,
        reviewedBy: record.reviewedBy,
        reviewedAt: record.reviewedAt?.toISOString() ?? null,
        rejectionReason: record.rejectionReason,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        slug: z.string().optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        publishNow: z.boolean().optional(),
        authorName: z.string().optional(),
        authorType: authorTypeSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db.select().from(news).where(eq(news.id, input.id)).get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "News not found" });
      }
      if (!existing.activityId) {
        throw new ORPCError("FORBIDDEN", {
          message: "General news can only be edited by a site admin.",
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

      if (context.auth.role !== "admin") {
        updateData.reviewStatus = "pending";
        updateData.status = "draft";
        updateData.publishedAt = null;
        updateData.reviewedBy = null;
        updateData.reviewedAt = null;
        updateData.rejectionReason = null;
      }

      if (input.slug !== undefined) {
        updateData.slug = await generateUniqueSlug(news, input.slug, input.id);
      } else if (input.title !== undefined) {
        updateData.title = input.title;
        updateData.slug = await generateUniqueSlug(news, input.title, input.id);
      }
      if (input.content !== undefined) updateData.content = input.content;
      if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.authorName !== undefined) updateData.authorName = input.authorName;
      if (input.authorType !== undefined) updateData.authorType = input.authorType;
      if (context.auth.role === "admin" && input.publishNow === true && !existing.publishedAt) {
        updateData.publishedAt = now;
        updateData.status = "published";
      }

      const record = await db
        .update(news)
        .set(updateData)
        .where(eq(news.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        content: record.content,
        excerpt: record.excerpt,
        coverImage: record.coverImage,
        tags: record.tags,
        status: record.status,
        publishedAt: record.publishedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        authorName: record.authorName,
        authorType: record.authorType,
        activityId: record.activityId,
        reviewStatus: record.reviewStatus,
        reviewedBy: record.reviewedBy,
        reviewedAt: record.reviewedAt?.toISOString() ?? null,
        rejectionReason: record.rejectionReason,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db.select().from(news).where(eq(news.id, input.id)).get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "News not found" });
      }
      if (!existing.activityId) {
        throw new ORPCError("FORBIDDEN", {
          message: "General news can only be deleted by a site admin.",
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

      await db.delete(news).where(eq(news.id, input.id)).run();

      return { success: true };
    }),


  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .handler(async ({ input }) => {
      return checkSlugUnique(news, input.slug, input.excludeId);
    }),
};
