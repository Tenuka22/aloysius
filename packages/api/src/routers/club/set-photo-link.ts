import {
  clubPhoto,
  clubPhotoIdSchema,
  clubPhotoLinkKindSchema,
} from "@aloysius/db/schema/club-photos";
import { newsPost } from "@aloysius/db/schema/news-posts";
import { achievement, event } from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as v from "valibot";

import { clubReviewerProcedure } from "../../index";

const LINKED_TABLES = { achievement, event, news: newsPost } as const;

/**
 * Attach (or clear) one related piece of content on a photo - a news post,
 * an event, or an achievement - for a CMS reviewer managing the gallery.
 * Separate from `reviewPhoto` because a link can be set, changed or cleared
 * at any time, not only at the moment a photo is approved or rejected.
 *
 * `linkedKind: null` clears the link; otherwise `linkedId` must name an
 * existing row of that kind, and only the matching one of
 * `linkedNewsId`/`linkedEventId`/`linkedAchievementId` is populated - the
 * others are always written back to `null` in the same `set()` call so
 * `club_photo_linked_fields_paired` can never be tripped by a stale value
 * from a previous link.
 */
export const setPhotoLink = clubReviewerProcedure
  .input(
    v.object({
      id: clubPhotoIdSchema,
      linkedKind: v.nullable(clubPhotoLinkKindSchema),
      linkedId: v.nullable(v.pipe(v.string(), v.minLength(1))),
    })
  )
  .handler(async ({ input, context }) => {
    const existing = await context.db
      .select({ id: clubPhoto.id })
      .from(clubPhoto)
      .where(eq(clubPhoto.id, input.id))
      .limit(1)
      .get();

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Submission not found" });
    }

    if (input.linkedKind === null) {
      await context.db
        .update(clubPhoto)
        .set({
          linkedKind: null,
          linkedNewsId: null,
          linkedEventId: null,
          linkedAchievementId: null,
        })
        .where(eq(clubPhoto.id, input.id))
        .run();

      return { id: input.id, linkedKind: null };
    }

    if (!input.linkedId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "linkedId is required when linkedKind is set",
      });
    }

    const table = LINKED_TABLES[input.linkedKind];
    const target = await context.db
      .select({ id: table.id })
      .from(table)
      .where(eq(table.id, input.linkedId))
      .limit(1)
      .get();

    if (!target) {
      throw new ORPCError("NOT_FOUND", {
        message: `No ${input.linkedKind} with that id`,
      });
    }

    await context.db
      .update(clubPhoto)
      .set({
        linkedKind: input.linkedKind,
        linkedNewsId: input.linkedKind === "news" ? input.linkedId : null,
        linkedEventId: input.linkedKind === "event" ? input.linkedId : null,
        linkedAchievementId:
          input.linkedKind === "achievement" ? input.linkedId : null,
      })
      .where(eq(clubPhoto.id, input.id))
      .run();

    return { id: input.id, linkedKind: input.linkedKind };
  });
