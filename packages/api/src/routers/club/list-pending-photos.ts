import { clubPhoto } from "@aloysius/db/schema/club-photos";
import { asc, eq } from "drizzle-orm";

import { clubReviewerProcedure } from "../../index";

/**
 * The reviewer's queue: every pending submission, oldest first — so the
 * longest-waiting club photo is reviewed first, the same ordering as the
 * staff-number and teacher-request queues.
 */
export const listPendingPhotos = clubReviewerProcedure.handler(
  async ({ context }) => {
    const rows = await context.db
      .select({
        id: clubPhoto.id,
        club: clubPhoto.club,
        fileId: clubPhoto.fileId,
        caption: clubPhoto.caption,
        altText: clubPhoto.altText,
        albumUrl: clubPhoto.albumUrl,
        submittedById: clubPhoto.submittedById,
        submittedAt: clubPhoto.submittedAt,
      })
      .from(clubPhoto)
      .where(eq(clubPhoto.status, "pending"))
      .orderBy(asc(clubPhoto.submittedAt))
      .all();

    return rows.map((row) => ({
      ...row,
      submittedAt: row.submittedAt.toISOString(),
    }));
  }
);
