import { clubPhoto, gallery } from "@aloysius/db/schema/club-photos";
import { clubSlugSchema } from "@aloysius/db/schema/clubs";
import { fileIdSchema } from "@aloysius/db/schema/files";
import { ORPCError } from "@orpc/server";
import * as v from "valibot";

import { requireClubPermission } from "../../index";

const slugify = (title: string, id: string) =>
  `${title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/(?<edgeDash>^-|-$)/gu, "")
    .slice(0, 60)}-${id.slice(0, 8)}`;

const photoSchema = v.object({
  fileId: fileIdSchema,
  caption: v.pipe(v.string(), v.minLength(1), v.maxLength(280)),
  altText: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
});

/**
 * Submit a gallery - a title plus a batch of photos - to the review queue.
 * Starts `pending`; only `club.reviewGallery` moves the whole thing to
 * `approved`, which is what `listApprovedGalleries` (the public read)
 * selects on. One insert for the gallery, one per photo, so a photo can
 * never exist without the gallery it belongs to.
 */
export const createGallery = requireClubPermission("submit")
  .input(
    v.object({
      club: clubSlugSchema,
      title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      description: v.optional(
        v.nullable(v.pipe(v.string(), v.maxLength(2000)))
      ),
      albumUrl: v.optional(
        v.nullable(
          v.pipe(
            v.string(),
            v.url(),
            v.regex(/^https?:\/\//u, "Must be an http or https URL")
          )
        )
      ),
      coverImageId: v.optional(v.nullable(fileIdSchema)),
      photos: v.pipe(v.array(photoSchema), v.minLength(1), v.maxLength(5)),
    })
  )
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();

    const record = await context.db
      .insert(gallery)
      .values({
        id,
        club: input.club,
        slug: slugify(input.title, id),
        title: input.title,
        description: input.description ?? null,
        albumUrl: input.albumUrl ?? null,
        coverImageId: input.coverImageId ?? null,
        createdById: context.session.user.id,
      })
      .returning()
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    await context.db.insert(clubPhoto).values(
      input.photos.map((photo) => ({
        id: crypto.randomUUID(),
        galleryId: record.id,
        fileId: photo.fileId,
        caption: photo.caption,
        altText: photo.altText,
        submittedById: context.session.user.id,
      }))
    );

    return {
      id: record.id,
      status: record.status,
      submittedAt: record.createdAt.toISOString(),
    };
  });
