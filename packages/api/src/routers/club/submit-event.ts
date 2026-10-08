import { clubSlugSchema } from "@aloysius/db/schema/club-photos";
import { event } from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import * as v from "valibot";

import { requireClubPermission } from "../../index";

const slugify = (title: string, id: string) =>
  `${title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/(?<edgeDash>^-|-$)/gu, "")
    .slice(0, 60)}-${id.slice(0, 8)}`;

/** Submit an event to the queue. Starts `pending`; only `reviewEvent` moves
 * it to `approved`, which is the only state `listApprovedEvents` selects. */
export const submitEvent = requireClubPermission("submit")
  .input(
    v.object({
      club: clubSlugSchema,
      title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      description: v.optional(v.pipe(v.string(), v.maxLength(4000))),
      location: v.optional(v.pipe(v.string(), v.maxLength(200))),
      startsAt: v.pipe(v.string(), v.isoTimestamp()),
      endsAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
    })
  )
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();
    const record = await context.db
      .insert(event)
      .values({
        id,
        club: input.club,
        slug: slugify(input.title, id),
        title: input.title,
        description: input.description,
        location: input.location,
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
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
