import { achievement } from "@aloysius/db/schema/root-content";
import { desc } from "drizzle-orm";

import { publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

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
