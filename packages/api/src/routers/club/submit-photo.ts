import { clubPhoto, clubSlugSchema } from "@aloysius/db/schema/club-photos";
import { fileIdSchema, files } from "@aloysius/db/schema/files";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import * as v from "valibot";

import { requireClubPermission } from "../../index";

/**
 * Submit a photo to the club's gallery queue. The row starts `pending` and
 * stays invisible to the public until a CMS reviewer approves it
 * (`reviewPhoto.ts`) — this handler never writes anything a visitor can see.
 *
 * `fileId` must already exist and belong to the caller: the photo is
 * uploaded through `/api/files/upload` first (same route and re-encode
 * pipeline as every other image in this app), and only the resulting id is
 * submitted here. A `fileId` that was never uploaded, or was uploaded by
 * someone else, is refused rather than silently accepted and left dangling.
 */
export const submitPhoto = requireClubPermission("submit")
  .input(
    v.object({
      club: clubSlugSchema,
      fileId: fileIdSchema,
      caption: v.pipe(v.string(), v.minLength(1), v.maxLength(280)),
      altText: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      albumUrl: v.optional(
        v.pipe(v.string(), v.url(), v.regex(/^https?:\/\//u))
      ),
    })
  )
  .handler(async ({ input, context }) => {
    const file = await context.db
      .select({ id: files.id, userId: files.userId })
      .from(files)
      .where(eq(files.id, input.fileId))
      .limit(1)
      .get();

    if (!file) {
      throw new ORPCError("NOT_FOUND", { message: "File not found" });
    }
    if (file.userId !== context.session.user.id) {
      throw new ORPCError("FORBIDDEN", {
        message: "That file was not uploaded by this account",
      });
    }

    const existingPending = await context.db
      .select({ id: clubPhoto.id })
      .from(clubPhoto)
      .where(
        and(eq(clubPhoto.fileId, input.fileId), eq(clubPhoto.status, "pending"))
      )
      .limit(1)
      .get();
    if (existingPending) {
      throw new ORPCError("CONFLICT", {
        message: "This photo already has a pending submission",
      });
    }

    const id = crypto.randomUUID();
    const record = await context.db
      .insert(clubPhoto)
      .values({
        id,
        club: input.club,
        fileId: input.fileId,
        caption: input.caption,
        altText: input.altText,
        albumUrl: input.albumUrl,
        submittedById: context.session.user.id,
      })
      .returning()
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return {
      id: record.id,
      club: record.club,
      fileId: record.fileId,
      caption: record.caption,
      altText: record.altText,
      albumUrl: record.albumUrl,
      status: record.status,
      submittedAt: record.submittedAt.toISOString(),
    };
  });
