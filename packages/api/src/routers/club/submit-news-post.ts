import { clubSlugSchema } from "@aloysius/db/schema/club-photos";
import { fileIdSchema } from "@aloysius/db/schema/files";
import { NEWS_POST_CATEGORIES, newsPost } from "@aloysius/db/schema/news-posts";
import { ORPCError } from "@orpc/server";
import * as v from "valibot";

import { requireClubPermission } from "../../index";

const slugify = (title: string, id: string) =>
  `${title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/(?<edgeDash>^-|-$)/gu, "")
    .slice(0, 60)}-${id.slice(0, 8)}`;

/** Submit a news post to the queue. Starts `pending`; only
 * `reviewNewsPost` moves it to `approved`, which is the only state
 * `listApprovedNewsPosts` selects. */
export const submitNewsPost = requireClubPermission("submit")
  .input(
    v.object({
      club: clubSlugSchema,
      title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      summary: v.optional(v.pipe(v.string(), v.maxLength(400))),
      body: v.pipe(v.string(), v.minLength(1), v.maxLength(10_000)),
      category: v.optional(v.picklist(NEWS_POST_CATEGORIES)),
      coverImageId: v.optional(fileIdSchema),
    })
  )
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();
    const record = await context.db
      .insert(newsPost)
      .values({
        id,
        club: input.club,
        slug: slugify(input.title, id),
        title: input.title,
        summary: input.summary,
        body: input.body,
        category: input.category,
        coverImageId: input.coverImageId,
        submittedById: context.session.user.id,
      })
      .returning()
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return {
      id: record.id,
      status: record.status,
      submittedAt: record.createdAt.toISOString(),
    };
  });
