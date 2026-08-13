import { z } from "zod";
import { eq, desc, asc, and, inArray, sql } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { clubAlbums, clubAlbumImages, activities } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { resolveClubAccess, assertClubMember } from "../lib/club-access";
import { createNotification } from "../lib/notifications";

type AlbumRow = typeof clubAlbums.$inferSelect;
type AlbumImageRow = typeof clubAlbumImages.$inferSelect;

function serializeAlbum(row: AlbumRow, imageCount: number, clubName?: string | null) {
  return {
    id: row.id,
    activityId: row.activityId,
    title: row.title,
    description: row.description,
    coverImage: row.coverImage,
    status: row.status,
    reviewStatus: row.reviewStatus,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    rejectionReason: row.rejectionReason,
    featuredOnHome: row.featuredOnHome,
    userId: row.userId,
    imageCount,
    clubName: clubName ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeImage(row: AlbumImageRow) {
  return {
    id: row.id,
    albumId: row.albumId,
    url: row.url,
    caption: row.caption,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

async function getAlbumWithImages(db: ReturnType<typeof createDb>, id: string) {
  const row = await db.select().from(clubAlbums).where(eq(clubAlbums.id, id)).get();
  if (!row) return null;

  const images = await db
    .select()
    .from(clubAlbumImages)
    .where(eq(clubAlbumImages.albumId, id))
    .orderBy(asc(clubAlbumImages.sortOrder))
    .all();

  const activity = await db.select().from(activities).where(eq(activities.id, row.activityId)).get();

  return {
    album: serializeAlbum(row, images.length, activity?.name),
    images: images.map(serializeImage),
  };
}

export const clubAlbumsRouter = {
  /** Albums of a club. Public sees approved only; members/admins see all. */
  list: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = createDb();
      const { activityId, page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const userId = context.auth?.userId ?? null;
      const isSiteAdmin = context.auth?.adminCalled ?? false;
      let canSeeNonApproved = isSiteAdmin;
      if (userId) {
        const { membership, isClubAdmin } = await resolveClubAccess(
          db,
          activityId,
          userId,
          isSiteAdmin,
        );
        canSeeNonApproved = canSeeNonApproved || isClubAdmin || membership?.status === "approved";
      }

      const conditions = [eq(clubAlbums.activityId, activityId)];
      if (!canSeeNonApproved) {
        conditions.push(eq(clubAlbums.reviewStatus, "approved"));
      }
      const where = and(...conditions);

      const countRow = await db
        .select({ total: sql<number>`count(*)` })
        .from(clubAlbums)
        .where(where)
        .get();
      const total = Number(countRow?.total ?? 0);

      const rows = await db
        .select()
        .from(clubAlbums)
        .where(where)
        .orderBy(desc(clubAlbums.updatedAt))
        .limit(pageSize)
        .offset(offset)
        .all();

      const albumIds = rows.map((r) => r.id);
      const imageCounts =
        albumIds.length > 0
          ? await db
              .select({
                albumId: clubAlbumImages.albumId,
                count: sql<number>`count(*)`,
              })
              .from(clubAlbumImages)
              .where(inArray(clubAlbumImages.albumId, albumIds))
              .groupBy(clubAlbumImages.albumId)
              .all()
          : [];
      const countMap = new Map(imageCounts.map((r) => [r.albumId, Number(r.count)]));

      const activity = await db.select().from(activities).where(eq(activities.id, activityId)).get();

      return {
        rows: rows.map((row) => serializeAlbum(row, countMap.get(row.id) ?? 0, activity?.name)),
        total,
        pageCount: Math.ceil(total / pageSize),
        page,
        pageSize,
      };
    }),

  /** A single album with its images. Visibility: approved for public, all for members/admins/author. */
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const db = createDb();
      const result = await getAlbumWithImages(db, input.id);
      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "Album not found" });
      }

      if (result.album.reviewStatus !== "approved") {
        const userId = context.auth?.userId ?? null;
        const isSiteAdmin = context.auth?.adminCalled ?? false;
        const isAuthor = userId !== null && userId === result.album.userId;
        let canView = isSiteAdmin || isAuthor;
        if (!canView && userId) {
          const { membership, isClubAdmin } = await resolveClubAccess(
            db,
            result.album.activityId,
            userId,
            isSiteAdmin,
          );
          canView = isClubAdmin || membership?.status === "approved";
        }
        if (!canView) {
          throw new ORPCError("NOT_FOUND", { message: "Album not found" });
        }
      }

      return result;
    }),

  /** Featured-on-homepage albums (approved only), for the public homepage. */
  listFeatured: publicProcedure.handler(async () => {
    const db = createDb();
    const rows = await db
      .select()
      .from(clubAlbums)
      .where(
        and(eq(clubAlbums.reviewStatus, "approved"), eq(clubAlbums.featuredOnHome, true)),
      )
      .orderBy(desc(clubAlbums.updatedAt))
      .limit(6)
      .all();

    const activityIds = [...new Set(rows.map((r) => r.activityId))];
    const activityRows =
      activityIds.length > 0
        ? await db.select().from(activities).where(inArray(activities.id, activityIds)).all()
        : [];
    const activityMap = new Map(activityRows.map((a) => [a.id, a]));

    const albumIds = rows.map((r) => r.id);
    const imageCounts =
      albumIds.length > 0
        ? await db
            .select({
              albumId: clubAlbumImages.albumId,
              count: sql<number>`count(*)`,
            })
            .from(clubAlbumImages)
            .where(inArray(clubAlbumImages.albumId, albumIds))
            .groupBy(clubAlbumImages.albumId)
            .all()
        : [];
    const countMap = new Map(imageCounts.map((r) => [r.albumId, Number(r.count)]));

    return rows.map((row) =>
      serializeAlbum(row, countMap.get(row.id) ?? 0, activityMap.get(row.activityId)?.name),
    );
  }),

  /** Create an album. Approved club members only; requires site-admin review unless site admin. */
  create: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      const activity = await db.select().from(activities).where(eq(activities.id, input.activityId)).get();
      if (!activity) {
        throw new ORPCError("NOT_FOUND", { message: "Club not found" });
      }

      const { membership, isClubAdmin } = await resolveClubAccess(
        db,
        input.activityId,
        userId,
        context.auth?.adminCalled ?? false,
      );
      assertClubMember(membership, context.auth?.adminCalled ?? false, isClubAdmin);

      const isSiteAdmin = context.auth?.adminCalled ?? false;
      const reviewStatus = isSiteAdmin ? "approved" : "pending";
      const now = new Date();

      const record = await db
        .insert(clubAlbums)
        .values({
          id: crypto.randomUUID(),
          activityId: input.activityId,
          title: input.title,
          description: input.description ?? null,
          coverImage: null,
          status: isSiteAdmin ? "published" : "draft",
          reviewStatus,
          reviewedBy: isSiteAdmin ? userId : null,
          reviewedAt: isSiteAdmin ? now : null,
          featuredOnHome: false,
          userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();

      return serializeAlbum(record as AlbumRow, 0, activity.name);
    }),

  /** Update album title/description. Author or club admin; re-triggers review for non-site-admins. */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      const existing = await db.select().from(clubAlbums).where(eq(clubAlbums.id, input.id)).get();
      if (!existing) throw new ORPCError("NOT_FOUND", { message: "Album not found" });

      const { membership, isClubAdmin } = await resolveClubAccess(
        db,
        existing.activityId,
        userId,
        context.auth?.adminCalled ?? false,
      );
      assertClubMember(membership, context.auth?.adminCalled ?? false, isClubAdmin);

      const isAuthor = existing.userId === userId;
      if (!isAuthor && !isClubAdmin) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Only the author or a club admin can edit this album.",
        });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = { updatedAt: now };
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;

      if (!context.auth?.adminCalled) {
        updateData.reviewStatus = "pending";
        updateData.status = "draft";
        updateData.reviewedBy = null;
        updateData.reviewedAt = null;
        updateData.rejectionReason = null;
        updateData.featuredOnHome = false;
      }

      const record = await db
        .update(clubAlbums)
        .set(updateData)
        .where(eq(clubAlbums.id, input.id))
        .returning()
        .get();

      return serializeAlbum(record as AlbumRow, 0);
    }),

  /** Delete an album (cascades its images). Author or club admin. */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      const existing = await db.select().from(clubAlbums).where(eq(clubAlbums.id, input.id)).get();
      if (!existing) throw new ORPCError("NOT_FOUND", { message: "Album not found" });

      const { isClubAdmin } = await resolveClubAccess(
        db,
        existing.activityId,
        userId,
        context.auth?.adminCalled ?? false,
      );
      const isAuthor = existing.userId === userId;
      if (!isAuthor && !isClubAdmin) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Only the author or a club admin can delete this album.",
        });
      }

      await db.delete(clubAlbums).where(eq(clubAlbums.id, input.id)).run();
      return { success: true };
    }),

  /** Add a photo to an album. Author or club admin. Re-triggers review for non-site-admins. */
  addImage: protectedProcedure
    .input(
      z.object({
        albumId: z.string(),
        url: z.string().min(1),
        caption: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      const album = await db.select().from(clubAlbums).where(eq(clubAlbums.id, input.albumId)).get();
      if (!album) throw new ORPCError("NOT_FOUND", { message: "Album not found" });

      const { membership, isClubAdmin } = await resolveClubAccess(
        db,
        album.activityId,
        userId,
        context.auth?.adminCalled ?? false,
      );
      assertClubMember(membership, context.auth?.adminCalled ?? false, isClubAdmin);

      const isAuthor = album.userId === userId;
      if (!isAuthor && !isClubAdmin) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Only the author or a club admin can add photos.",
        });
      }

      const maxSort = await db
        .select({ max: sql<number>`max(${clubAlbumImages.sortOrder})` })
        .from(clubAlbumImages)
        .where(eq(clubAlbumImages.albumId, input.albumId))
        .get();
      const sortOrder = Number(maxSort?.max ?? 0) + 1;

      const record = await db
        .insert(clubAlbumImages)
        .values({
          id: crypto.randomUUID(),
          albumId: input.albumId,
          url: input.url,
          caption: input.caption ?? null,
          sortOrder,
        })
        .returning()
        .get();

      // Set cover image to the first photo if none set yet
      if (!album.coverImage) {
        await db
          .update(clubAlbums)
          .set({ coverImage: input.url, updatedAt: new Date() })
          .where(eq(clubAlbums.id, input.albumId))
          .run();
      }

      if (!context.auth?.adminCalled) {
        await db
          .update(clubAlbums)
          .set({
            reviewStatus: "pending",
            status: "draft",
            reviewedBy: null,
            reviewedAt: null,
            rejectionReason: null,
            featuredOnHome: false,
            updatedAt: new Date(),
          })
          .where(eq(clubAlbums.id, input.albumId))
          .run();
      }

      return serializeImage(record as AlbumImageRow);
    }),

  /** Remove a photo from an album. Author or club admin. Re-triggers review for non-site-admins. */
  removeImage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      const existing = await db.select().from(clubAlbumImages).where(eq(clubAlbumImages.id, input.id)).get();
      if (!existing) throw new ORPCError("NOT_FOUND", { message: "Image not found" });

      const album = await db.select().from(clubAlbums).where(eq(clubAlbums.id, existing.albumId)).get();
      if (!album) throw new ORPCError("NOT_FOUND", { message: "Album not found" });

      const { membership, isClubAdmin } = await resolveClubAccess(
        db,
        album.activityId,
        userId,
        context.auth?.adminCalled ?? false,
      );
      assertClubMember(membership, context.auth?.adminCalled ?? false, isClubAdmin);

      const isAuthor = album.userId === userId;
      if (!isAuthor && !isClubAdmin) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Only the author or a club admin can remove photos.",
        });
      }

      await db.delete(clubAlbumImages).where(eq(clubAlbumImages.id, input.id)).run();

      // If the removed image was the cover, promote the first remaining image
      if (album.coverImage === existing.url) {
        const first = await db
          .select()
          .from(clubAlbumImages)
          .where(eq(clubAlbumImages.albumId, existing.albumId))
          .orderBy(asc(clubAlbumImages.sortOrder))
          .limit(1)
          .get();
        await db
          .update(clubAlbums)
          .set({ coverImage: first?.url ?? null, updatedAt: new Date() })
          .where(eq(clubAlbums.id, existing.albumId))
          .run();
      }

      if (!context.auth?.adminCalled) {
        await db
          .update(clubAlbums)
          .set({
            reviewStatus: "pending",
            status: "draft",
            reviewedBy: null,
            reviewedAt: null,
            rejectionReason: null,
            featuredOnHome: false,
            updatedAt: new Date(),
          })
          .where(eq(clubAlbums.id, existing.albumId))
          .run();
      }

      return { success: true };
    }),

  /** Approve or reject an album. Site admin only. */
  review: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        action: z.enum(["approve", "reject"]),
        reason: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.adminCalled) {
        throw new ORPCError("UNAUTHORIZED", { message: "Site admin access required." });
      }
      const reviewerId = context.auth.userId!;
      const db = createDb();
      const existing = await db.select().from(clubAlbums).where(eq(clubAlbums.id, input.id)).get();
      if (!existing) throw new ORPCError("NOT_FOUND", { message: "Album not found" });

      const now = new Date();
      await db
        .update(clubAlbums)
        .set({
          reviewStatus: input.action === "approve" ? "approved" : "rejected",
          status: input.action === "approve" ? "published" : "draft",
          reviewedBy: reviewerId,
          reviewedAt: now,
          rejectionReason: input.action === "reject" ? (input.reason ?? null) : null,
          updatedAt: now,
        })
        .where(eq(clubAlbums.id, input.id))
        .run();

      await createNotification({
        userId: existing.userId,
        type: input.action === "approve" ? "content_approved" : "content_rejected",
        title:
          input.action === "approve"
            ? `Photo album approved: ${existing.title}`
            : `Photo album rejected: ${existing.title}`,
        body:
          input.action === "reject"
            ? input.reason
              ? `Reason: ${input.reason}`
              : undefined
            : "Your album is now live on the club page.",
        link: `/clubs/${existing.activityId}`,
      });

      return { success: true };
    }),

  /** Toggle featured-on-homepage. Site admin only; only approved albums can be featured. */
  setFeatured: protectedProcedure
    .input(z.object({ id: z.string(), featured: z.boolean() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.adminCalled) {
        throw new ORPCError("UNAUTHORIZED", { message: "Site admin access required." });
      }

      const db = createDb();
      const existing = await db.select().from(clubAlbums).where(eq(clubAlbums.id, input.id)).get();
      if (!existing) throw new ORPCError("NOT_FOUND", { message: "Album not found" });

      if (input.featured && existing.reviewStatus !== "approved") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Only approved albums can be featured on the homepage.",
        });
      }

      await db
        .update(clubAlbums)
        .set({ featuredOnHome: input.featured, updatedAt: new Date() })
        .where(eq(clubAlbums.id, input.id))
        .run();

      return { success: true };
    }),
};
