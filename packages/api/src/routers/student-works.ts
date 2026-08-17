import { z } from "zod";
import { eq, desc, asc, like, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { studentWorks } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import {
  authorTypeSchema,
  contentStatusSchema,
  reviewStatusSchema,
  sortDirectionSchema,
  studentWorkCategorySchema,
} from "../schemas";
import { generateUniqueSlug, checkSlugUnique } from "../lib/slug";
import { resolveClubAccess, assertClubMember } from "../lib/club-access";

export const studentWorksRouter = {
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirectionSchema.default("desc"),
        search: z.string().optional(),
        status: contentStatusSchema.optional(),
        category: studentWorkCategorySchema.optional(),
        activityId: z.string().optional(),
        reviewStatus: reviewStatusSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, search, status, category } = input;
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
        conditions.push(like(studentWorks.title, `%${search}%`));
      }
      if (status) {
        if (status !== "published" && !isSiteAdmin && !canSeeNonApproved) {
          throw new ORPCError("UNAUTHORIZED", { message: "Only published content is publicly visible." });
        }
        conditions.push(eq(studentWorks.status, status));
      } else if (!isSiteAdmin && !canSeeNonApproved) {
        conditions.push(eq(studentWorks.status, "published"));
      }
      if (category) {
        conditions.push(eq(studentWorks.category, category));
      }
      if (input.activityId) {
        conditions.push(eq(studentWorks.activityId, input.activityId));
      }
      if (input.reviewStatus) {
        if (input.reviewStatus !== "approved" && !canSeeNonApproved) {
          throw new ORPCError("UNAUTHORIZED", {
            message: "You must be a club member to view pending content.",
          });
        }
        conditions.push(eq(studentWorks.reviewStatus, input.reviewStatus));
      } else if (!canSeeNonApproved) {
        conditions.push(eq(studentWorks.reviewStatus, "approved"));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumn =
        sort === "title"
          ? studentWorks.title
          : sort === "status"
            ? studentWorks.status
            : sort === "category"
              ? studentWorks.category
              : sort === "publishedAt"
                ? studentWorks.publishedAt
                : sort === "createdAt"
                  ? studentWorks.createdAt
                  : studentWorks.createdAt;
      const orderFn = sortDir === "asc" ? asc : desc;

      const [countRow] = await db.select({ total: count() }).from(studentWorks).where(where).all();
      const total = countRow?.total ?? 0;

      const rows = await db
        .select()
        .from(studentWorks)
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
          description: row.description,
          category: row.category,
          studentNames: row.studentNames,
          studentGrade: row.studentGrade,
          authorType: row.authorType,
          coverImage: row.coverImage,
          contentUrl: row.contentUrl,
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
          userId: row.userId,
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
          ? await db.select().from(studentWorks).where(eq(studentWorks.id, input.id)).get()
          : await db.select().from(studentWorks).where(eq(studentWorks.slug, input.slug)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Student work not found" });
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
          throw new ORPCError("NOT_FOUND", { message: "Student work not found" });
        }
      }

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        category: row.category,
        studentNames: row.studentNames,
        studentGrade: row.studentGrade,
        authorType: row.authorType,
        coverImage: row.coverImage,
        contentUrl: row.contentUrl,
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
        userId: row.userId,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        slug: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: studentWorkCategorySchema.default("other"),
        studentNames: z.array(z.string()).optional(),
        studentGrade: z.string().optional(),
        authorType: authorTypeSchema.default("student"),
        coverImage: z.string().optional(),
        contentUrl: z.string().optional(),
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
          message: "A club (activityId) is required. General student works are created via site admin.",
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
        ? await generateUniqueSlug(studentWorks, input.slug)
        : await generateUniqueSlug(studentWorks, input.title);

      const record = await db
        .insert(studentWorks)
        .values({
          id,
          slug,
          title: input.title,
          description: input.description ?? null,
          category: input.category,
          studentNames: input.studentNames ?? [],
          studentGrade: input.studentGrade ?? null,
          authorType: input.authorType,
          coverImage: input.coverImage ?? null,
          contentUrl: input.contentUrl ?? null,
          tags: input.tags ?? [],
          status,
          publishedAt,
          userId: context.auth.userId,
          activityId: input.activityId,
          reviewStatus,
        })
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        category: record.category,
        studentNames: record.studentNames,
        studentGrade: record.studentGrade,
        authorType: record.authorType,
        coverImage: record.coverImage,
        contentUrl: record.contentUrl,
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
        userId: record.userId,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        slug: z.string().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        category: studentWorkCategorySchema.optional(),
        studentNames: z.array(z.string()).optional().optional(),
        studentGrade: z.string().optional(),
        authorType: authorTypeSchema.optional(),
        coverImage: z.string().optional(),
        contentUrl: z.string().optional(),
        tags: z.array(z.string()).optional(),
        publishNow: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db
        .select()
        .from(studentWorks)
        .where(eq(studentWorks.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Student work not found" });
      }
      if (!existing.activityId) {
        throw new ORPCError("FORBIDDEN", {
          message: "General student works can only be edited by a site admin.",
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
        updateData.slug = await generateUniqueSlug(studentWorks, input.slug, input.id);
      }
      if (input.title !== undefined) {
        updateData.title = input.title;
        if (input.slug === undefined) {
          updateData.slug = await generateUniqueSlug(studentWorks, input.title, input.id);
        }
      }
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.studentNames !== undefined) updateData.studentNames = input.studentNames;
      if (input.studentGrade !== undefined) updateData.studentGrade = input.studentGrade;
      if (input.authorType !== undefined) updateData.authorType = input.authorType;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
      if (input.contentUrl !== undefined) updateData.contentUrl = input.contentUrl;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (context.auth.role === "admin" && input.publishNow === true && !existing.publishedAt) {
        updateData.publishedAt = now;
        updateData.status = "published";
      }

      const record = await db
        .update(studentWorks)
        .set(updateData)
        .where(eq(studentWorks.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        category: record.category,
        studentNames: record.studentNames,
        studentGrade: record.studentGrade,
        authorType: record.authorType,
        coverImage: record.coverImage,
        contentUrl: record.contentUrl,
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
        userId: record.userId,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db
        .select()
        .from(studentWorks)
        .where(eq(studentWorks.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Student work not found" });
      }
      if (!existing.activityId) {
        throw new ORPCError("FORBIDDEN", {
          message: "General student works can only be deleted by a site admin.",
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

      await db.delete(studentWorks).where(eq(studentWorks.id, input.id)).run();

      return { success: true };
    }),

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .handler(async ({ input }) => {
      return checkSlugUnique(studentWorks, input.slug, input.excludeId);
    }),
};
