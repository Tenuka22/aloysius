import { announcement } from "@aloysius/db/schema/announcements";
import { clubSlugSchema } from "@aloysius/db/schema/club-photos";
import { ORPCError } from "@orpc/server";
import * as v from "valibot";

import { requireClubPermission } from "../../index";

const slugify = (title: string, id: string) =>
  `${title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/(?<edgeDash>^-|-$)/gu, "")
    .slice(0, 60)}-${id.slice(0, 8)}`;

/**
 * Submit an announcement to the queue. Starts `pending`; only
 * `club.reviewAnnouncement` moves it to `approved`, and `listApprovedAnnouncements`
 * (the public notices query) is the only reader that is allowed to show it.
 */
export const submitAnnouncement = requireClubPermission("submit")
  .input(
    v.object({
      club: clubSlugSchema,
      title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      body: v.pipe(v.string(), v.minLength(1), v.maxLength(4000)),
    })
  )
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();
    const record = await context.db
      .insert(announcement)
      .values({
        id,
        club: input.club,
        slug: slugify(input.title, id),
        title: input.title,
        body: input.body,
        authorId: context.session.user.id,
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
