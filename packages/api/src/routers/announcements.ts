import { z } from "zod";
import { eq, desc, asc, like, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { announcements } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { generateUniqueSlug, checkSlugUnique } from "../lib/slug";
import { resolveClubAccess, assertClubMember } from "../lib/club-access";

const sortDirection = z.enum(["asc", "desc"]);

export const announcementsRouter = {
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        sortDir: sortDirection.default("desc"),
        search: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        audience: z.enum(["all", "students", "parents", "staff", "alumni"]).optional(),
        activityId: z.string().optional(),
        reviewStatus: z.enum(["pending", "approved", "rejected"]).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const { page, pageSize, sort, sortDir, search, status, audience } = input;
      const offset = (page - 1) * pageSize;

      const userId = context.auth?.userId ?? null;
      const isSiteAdmin = context.auth?.adminCalled ?? false;
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
        conditions.push(like(announcements.title, `%${search}%`));
      }
      if (status) {
        conditions.push(eq(announcements.status, status));
      }
      if (audience) {
        conditions.push(eq(announcements.audience, audience));
      }
      if (input.activityId) {
        conditions.push(eq(announcements.activityId, input.activityId));
      }
      if (input.reviewStatus) {
        if (input.reviewStatus !== "approved" && !canSeeNonApproved) {
          throw new ORPCError("UNAUTHORIZED", {
            message: "You must be a club member to view pending content.",
          });
        }
        conditions.push(eq(announcements.reviewStatus, input.reviewStatus));
      } else if (!canSeeNonApproved) {
        conditions.push(eq(announcements.reviewStatus, "approved"));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumn =
        sort === "title"
          ? announcements.title
          : sort === "status"
            ? announcements.status
            : sort === "audience"
              ? announcements.audience
              : sort === "createdAt"
                ? announcements.createdAt
                : announcements.createdAt;
      const orderFn = sortDir === "asc" ? asc : desc;

      const [countRow] = await db
        .select({ total: count() })
        .from(announcements)
        .where(where)
        .all();
      const total = countRow?.total ?? 0;

      const rows = await db
        .select()
        .from(announcements)
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
          audience: row.audience,
          addressedTo: row.addressedTo,
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
          ? await db.select().from(announcements).where(eq(announcements.id, input.id)).get()
          : await db.select().from(announcements).where(eq(announcements.slug, input.slug)).get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Announcement not found" });
      }

      if (row.activityId && row.reviewStatus !== "approved") {
        const userId = context.auth?.userId ?? null;
        const isSiteAdmin = context.auth?.adminCalled ?? false;
        const isAuthor = userId !== null && userId === row.userId;
        let canView = isSiteAdmin || isAuthor;
        if (!canView && userId) {
          const { membership, isClubAdmin } = await resolveClubAccess(
            db,
            row.activityId,
            userId,
            isSiteAdmin,
          );
          canView = isClubAdmin || membership?.status === "approved";
        }
        if (!canView) {
          throw new ORPCError("NOT_FOUND", { message: "Announcement not found" });
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
        audience: row.audience,
        addressedTo: row.addressedTo,
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
        slug: z.string().optional(),
        title: z.string().min(1),
        content: z.string(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        audience: z.enum(["all", "students", "parents", "staff", "alumni"]).optional(),
        addressedTo: z.string().optional(),
        publishNow: z.boolean().optional(),
        authorName: z.string().optional(),
        authorType: z.enum(["student", "faculty", "club", "org"]).optional(),
        activityId: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();

      let reviewStatus: "pending" | "approved" | "rejected" = "approved";
      let status: "draft" | "published" = input.publishNow ? "published" : "draft";
      let publishedAt: Date | null = input.publishNow ? new Date() : null;

      if (input.activityId) {
        const { membership, isClubAdmin } = await resolveClubAccess(
          db,
          input.activityId,
          context.auth.userId,
          context.auth.adminCalled,
        );
        assertClubMember(membership, context.auth.adminCalled, isClubAdmin);

        if (!context.auth.adminCalled) {
          reviewStatus = "pending";
          status = "draft";
          publishedAt = null;
        }
      }

      const id = crypto.randomUUID();
      const slug = input.slug
        ? await generateUniqueSlug(announcements, input.slug)
        : await generateUniqueSlug(announcements, input.title);

      const record = await db
        .insert(announcements)
        .values({
          id,
          slug,
          title: input.title,
          content: input.content,
          excerpt: input.excerpt ?? null,
          coverImage: input.coverImage ?? null,
          tags: input.tags ?? [],
          status,
          audience: input.audience ?? "all",
          addressedTo: input.addressedTo ?? null,
          publishedAt,
          authorName: input.authorName ?? null,
          authorType: input.authorType ?? null,
          userId: context.auth.userId,
          activityId: input.activityId ?? null,
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
        audience: record.audience,
        addressedTo: record.addressedTo,
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
        slug: z.string().optional(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        audience: z.enum(["all", "students", "parents", "staff", "alumni"]).optional(),
        addressedTo: z.string().optional(),
        publishNow: z.boolean().optional(),
        authorName: z.string().optional(),
        authorType: z.enum(["student", "faculty", "club", "org"]).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db
        .select()
        .from(announcements)
        .where(eq(announcements.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Announcement not found" });
      }

      if (existing.activityId) {
        const { membership, isClubAdmin } = await resolveClubAccess(
          db,
          existing.activityId,
          context.auth.userId,
          context.auth.adminCalled,
        );
        assertClubMember(membership, context.auth.adminCalled, isClubAdmin);
      }

      const now = new Date();
      const updateData: Record<string, unknown> = {
        updatedAt: now,
      };

      if (existing.activityId && !context.auth.adminCalled) {
        updateData.reviewStatus = "pending";
        updateData.status = "draft";
        updateData.publishedAt = null;
        updateData.reviewedBy = null;
        updateData.reviewedAt = null;
        updateData.rejectionReason = null;
      }

      if (input.slug !== undefined) {
        updateData.slug = await generateUniqueSlug(announcements, input.slug, input.id);
      }
      if (input.title !== undefined) {
        updateData.title = input.title;
        if (input.slug === undefined) {
          updateData.slug = await generateUniqueSlug(announcements, input.title, input.id);
        }
      }
      if (input.content !== undefined) updateData.content = input.content;
      if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.audience !== undefined) updateData.audience = input.audience;
      if (input.addressedTo !== undefined) updateData.addressedTo = input.addressedTo;
      if (input.authorName !== undefined) updateData.authorName = input.authorName;
      if (input.authorType !== undefined) updateData.authorType = input.authorType;
      if (input.publishNow === true && !existing.publishedAt) {
        updateData.publishedAt = now;
        updateData.status = "published";
      }

      const record = await db
        .update(announcements)
        .set(updateData)
        .where(eq(announcements.id, input.id))
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
        audience: record.audience,
        addressedTo: record.addressedTo,
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
      const existing = await db
        .select()
        .from(announcements)
        .where(eq(announcements.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Announcement not found" });
      }

      if (existing.activityId) {
        const { isClubAdmin } = await resolveClubAccess(
          db,
          existing.activityId,
          context.auth.userId,
          context.auth.adminCalled,
        );
        const isAuthor = existing.userId === context.auth.userId;
        if (!isAuthor && !isClubAdmin) {
          throw new ORPCError("UNAUTHORIZED", {
            message: "Only the author or a club admin can delete this.",
          });
        }
      }

      await db.delete(announcements).where(eq(announcements.id, input.id)).run();

      return { success: true };
    }),

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .handler(async ({ input }) => {
      return checkSlugUnique(announcements, input.slug, input.excludeId);
    }),
};
