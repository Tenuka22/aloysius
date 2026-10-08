import { clubPhoto } from "@aloysius/db/schema/club-photos";
import { desc, eq } from "drizzle-orm";

import { requireClubPermission } from "../../index";

/**
 * The submitting account's own queue: pending, approved and rejected rows,
 * newest first — this is the only feedback channel a club gets (a rejection's
 * `reviewNote` is readable here, the same "pull, not push" shape as the
 * qualification-document review flow).
 */
export const listMyPhotos = requireClubPermission("read").handler(
  async ({ context }) => {
    const rows = await context.db
      .select({
        id: clubPhoto.id,
        club: clubPhoto.club,
        fileId: clubPhoto.fileId,
        caption: clubPhoto.caption,
        altText: clubPhoto.altText,
        albumUrl: clubPhoto.albumUrl,
        status: clubPhoto.status,
        submittedAt: clubPhoto.submittedAt,
        reviewedAt: clubPhoto.reviewedAt,
        reviewNote: clubPhoto.reviewNote,
      })
      .from(clubPhoto)
      .where(eq(clubPhoto.submittedById, context.session.user.id))
      .orderBy(desc(clubPhoto.submittedAt))
      .all();

    return rows.map((row) => ({
      ...row,
      submittedAt: row.submittedAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    }));
  }
);
