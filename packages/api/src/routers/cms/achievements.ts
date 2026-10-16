import { fileIdSchema } from "@aloysius/db/schema/files";
import {
  achievement,
  achievementIdSchema,
  achievementInsertSchema,
} from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/**
 * Category pills on the public achievements section - see
 * `packages/ui/src/content/home.ts`'s `ACHIEVEMENT_CATEGORIES`, minus `"All"`,
 * which is a client-side "show everything" filter, not a real category a row
 * can hold. Kept in sync with that list by hand, the same way
 * `news-posts.ts`'s `NEWS_POST_CATEGORIES` mirrors its own filter pills.
 */
const ACHIEVEMENT_CATEGORIES = [
  "Academic",
  "Sports",
  "Innovation",
  "Arts",
  "Leadership",
  "National",
  "International",
] as const;

const achievementFieldsSchema = v.object({
  ...v.pick(achievementInsertSchema, ["title", "detail"]).entries,
  category: v.picklist(ACHIEVEMENT_CATEGORIES),
  imageId: v.optional(v.nullable(fileIdSchema)),
});

/**
 * Every achievement, publicly readable like `listNewsPosts`/`listEvents` -
 * there is no draft state here, a row is live the moment it exists. Backs
 * both the public pages' achievement sections and the "link this gallery
 * to..." picker on the gallery review screen (`club.setGalleryLink`).
 */
export const listAchievements = publicProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select({
      id: achievement.id,
      title: achievement.title,
      category: achievement.category,
      detail: achievement.detail,
      imageId: achievement.imageId,
      publishedAt: achievement.publishedAt,
    })
    .from(achievement)
    .orderBy(desc(achievement.publishedAt))
    .all();

  const urls = await resolveFileUrls(
    context.db,
    rows.flatMap((row) => (row.imageId ? [row.imageId] : []))
  );

  return rows.map((row) => ({
    ...row,
    imageUrl: row.imageId ? (urls.get(row.imageId) ?? null) : null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  }));
});

/**
 * CMS staff writing an achievement directly - no club, no review queue. See
 * `academic-heads.ts`'s `createAcademicHead` for why `publishedAt` is set on
 * create: this is published by the College's own office, so there is nothing
 * here for a second person to check.
 */
export const createAchievement = cmsProcedure
  .input(achievementFieldsSchema)
  .handler(async ({ input, context }) => {
    const record = await context.db
      .insert(achievement)
      .values({
        id: crypto.randomUUID(),
        category: input.category,
        title: input.title,
        detail: input.detail,
        imageId: input.imageId ?? null,
        publishedAt: new Date(),
      })
      .returning({ id: achievement.id })
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateAchievement = cmsProcedure
  .input(
    v.object({ id: achievementIdSchema, ...achievementFieldsSchema.entries })
  )
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(achievement)
      .set({
        category: input.category,
        title: input.title,
        detail: input.detail,
        imageId: input.imageId ?? null,
      })
      .where(eq(achievement.id, input.id))
      .returning({ id: achievement.id })
      .get();

    if (!record) {
      throw new ORPCError("NOT_FOUND", { message: "Achievement not found" });
    }

    return { id: record.id };
  });

export const deleteAchievement = cmsProcedure
  .input(v.object({ id: achievementIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(achievement)
      .where(eq(achievement.id, input.id))
      .returning({ id: achievement.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Achievement not found" });
    }

    return { id: input.id };
  });
