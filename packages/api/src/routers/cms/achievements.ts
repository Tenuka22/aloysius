import { achievement } from "@aloysius/db/schema/root-content";
import { desc } from "drizzle-orm";

import { cmsProcedure } from "../../index";

/**
 * Every achievement, for the "link this photo to..." picker on the photo
 * review screen (`club.setPhotoLink`). CMS-only: there is no public reader
 * for the raw list, only the picker that needs titles to choose from.
 */
export const listAchievements = cmsProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select({
      id: achievement.id,
      title: achievement.title,
      category: achievement.category,
    })
    .from(achievement)
    .orderBy(desc(achievement.publishedAt))
    .all();

  return rows;
});
