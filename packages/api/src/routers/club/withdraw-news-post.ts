import { newsPost, newsPostIdSchema } from "@aloysius/db/schema/news-posts";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import * as v from "valibot";

import { requireClubPermission } from "../../index";

/** Withdraw a still-pending news post. */
export const withdrawNewsPost = requireClubPermission("submit")
  .input(v.object({ id: newsPostIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(newsPost)
      .where(
        and(
          eq(newsPost.id, input.id),
          eq(newsPost.submittedById, context.session.user.id),
          eq(newsPost.status, "pending")
        )
      )
      .returning({ id: newsPost.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", {
        message: "No pending news post with that id belongs to this account",
      });
    }

    return { id: input.id };
  });
