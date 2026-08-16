import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { obEvents, obDonations, obNews, obAnnouncements, gallery } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";
import { audienceSchema, contentStatusSchema } from "../../schemas";
import { generateUniqueSlug } from "../../lib/slug";
import { syncPrincipalAsOBAdmin } from "../ob";

/**
 * Super-user tier for OB (Old Boys) galleries, news, and announcements. Site
 * admin only (see admin/index.ts). Mirrors the OB-admin-scoped procedures in
 * ../ob.ts, which drop the site-admin OR-branch and remain gated on
 * `isOBAdmin` alone; site admins act through this router instead.
 */
export const adminObRouter = {
  eventGalleries: {
    create: adminProcedure
      .input(
        z.object({
          obEventId: z.string(),
          title: z.string().min(1),
          description: z.string().optional().nullable(),
          coverImage: z.string().optional().nullable(),
        }),
      )
      .handler(async ({ input, context }) => {
        const db = createDb();
        const event = await db.select().from(obEvents).where(eq(obEvents.id, input.obEventId)).get();
        if (!event) {
          throw new ORPCError("NOT_FOUND", { message: "OB event not found" });
        }
        const slug = await generateUniqueSlug(gallery, event.title);
        const now = new Date();
        const record = await db
          .insert(gallery)
          .values({
            id: crypto.randomUUID(),
            slug,
            title: input.title,
            description: input.description ?? null,
            coverImage: input.coverImage ?? null,
            obEventId: input.obEventId,
            status: "draft",
            userId: context.auth.userId!,
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
          obEventId: record.obEventId,
          status: record.status,
          publishedAt: record.publishedAt?.toISOString() ?? null,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        };
      }),

    release: adminProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
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
          obEventId: record.obEventId,
          status: record.status,
          publishedAt: record.publishedAt?.toISOString() ?? null,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        };
      }),

    unrelease: adminProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
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
          obEventId: record.obEventId,
          status: record.status,
          publishedAt: record.publishedAt?.toISOString() ?? null,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        };
      }),
  },

  donationGalleries: {
    create: adminProcedure
      .input(
        z.object({
          obDonationId: z.string(),
          title: z.string().min(1),
          description: z.string().optional().nullable(),
          coverImage: z.string().optional().nullable(),
        }),
      )
      .handler(async ({ input, context }) => {
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
            userId: context.auth.userId!,
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

    release: adminProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
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

    unrelease: adminProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
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
  },

  news: {
    create: adminProcedure
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
            userId: context.auth.userId!,
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

    update: adminProcedure
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
      .handler(async ({ input }) => {
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

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const db = createDb();
        await db.delete(obNews).where(eq(obNews.id, input.id)).run();
        return { success: true };
      }),
  },

  announcements: {
    create: adminProcedure
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
            userId: context.auth.userId!,
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

    update: adminProcedure
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
      .handler(async ({ input }) => {
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

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const db = createDb();
        await db.delete(obAnnouncements).where(eq(obAnnouncements.id, input.id)).run();
        return { success: true };
      }),
  },

  /** OB committee membership admin. */
  members: {
    /** Auto-sync the current published principal into the current year's President slot. */
    syncPrincipalAsOBAdmin: adminProcedure.handler(async () => syncPrincipalAsOBAdmin()),
  },
};
