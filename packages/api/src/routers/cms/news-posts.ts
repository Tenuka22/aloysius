import { fileIdSchema } from "@aloysius/db/schema/files";
import { newsPost, newsPostIdSchema } from "@aloysius/db/schema/news-posts";
import { ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

const NEWS_POST_CATEGORIES = [
  "academic",
  "sports",
  "arts",
  "achievement",
  "general",
] as const;

const newsPostFieldsSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  summary: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(400)))),
  body: v.pipe(v.string(), v.minLength(1), v.maxLength(10_000)),
  category: v.optional(v.nullable(v.picklist(NEWS_POST_CATEGORIES))),
  coverImageId: v.optional(v.nullable(fileIdSchema)),
});

const slugify = (title: string, id: string) =>
  `${title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/(?<edgeDash>^-|-$)/gu, "")
    .slice(0, 60)}-${id.slice(0, 8)}`;

/**
 * Every news post, newest-first. One query backs both `/news` and the CMS
 * management screen - see `listAnnouncements` for why there is no separate
 * admin-only variant.
 */
export const listNewsPosts = publicProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select({
      id: newsPost.id,
      title: newsPost.title,
      summary: newsPost.summary,
      body: newsPost.body,
      category: newsPost.category,
      coverImageId: newsPost.coverImageId,
      publishedAt: newsPost.publishedAt,
    })
    .from(newsPost)
    .orderBy(desc(newsPost.publishedAt))
    .all();

  const urls = await resolveFileUrls(
    context.db,
    rows.flatMap((row) => (row.coverImageId ? [row.coverImageId] : []))
  );

  return rows.map((row) => ({
    ...row,
    coverImageUrl: row.coverImageId
      ? (urls.get(row.coverImageId) ?? null)
      : null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  }));
});

/**
 * CMS staff writing a news post directly - no club, no review queue. See
 * `announcements.ts`'s `createAnnouncement` for why `status` is `approved`
 * and the author stands in as their own reviewer.
 */
export const createNewsPost = cmsProcedure
  .input(newsPostFieldsSchema)
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();
    const now = new Date();
    const record = await context.db
      .insert(newsPost)
      .values({
        id,
        club: null,
        slug: slugify(input.title, id),
        title: input.title,
        summary: input.summary ?? null,
        body: input.body,
        category: input.category ?? null,
        coverImageId: input.coverImageId ?? null,
        submittedById: context.session.user.id,
        status: "approved",
        reviewedById: context.session.user.id,
        reviewedAt: now,
        publishedAt: now,
      })
      .returning()
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateNewsPost = cmsProcedure
  .input(v.object({ id: newsPostIdSchema, ...newsPostFieldsSchema.entries }))
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(newsPost)
      .set({
        title: input.title,
        summary: input.summary ?? null,
        body: input.body,
        category: input.category ?? null,
        coverImageId: input.coverImageId ?? null,
      })
      .where(eq(newsPost.id, input.id))
      .returning({ id: newsPost.id })
      .get();

    if (!record) {
      throw new ORPCError("NOT_FOUND", { message: "News post not found" });
    }

    return { id: record.id };
  });

export const deleteNewsPost = cmsProcedure
  .input(v.object({ id: newsPostIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(newsPost)
      .where(eq(newsPost.id, input.id))
      .returning({ id: newsPost.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "News post not found" });
    }

    return { id: input.id };
  });
