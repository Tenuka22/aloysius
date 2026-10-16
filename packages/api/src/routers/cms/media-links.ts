import { fileIdSchema } from "@aloysius/db/schema/files";
import {
  MEDIA_LINK_KINDS,
  mediaLink,
  mediaLinkIdSchema,
} from "@aloysius/db/schema/media-link";
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/**
 * The "Magazines & Reports" and "In the Press" tabs on `/media`. Replaces
 * `MEDIA_PUBLICATIONS`/`MEDIA_PRESS`, two constants in
 * `packages/ui/src/content/media.ts` that were always `[]` - there was no
 * admin path to a row, ever. One table backs both tabs (`kind` tells them
 * apart), the same shape `achievement.category` and `alumni_notable.category`
 * already use for a small fixed set of tab/section ids.
 *
 * A row points at either an uploaded PDF (`fileId`) or a plain URL (`href`) -
 * see `media-link.ts` for why both exist. `listMediaLinks` returns every
 * published row, undifferentiated by `kind`, the same way `listAchievements`
 * returns every category and leaves the split to the caller: the public page
 * already needs to bucket by `kind` into two tab lists, so a second
 * server-side filter would just be the same split done twice.
 */

const mediaLinkFieldsEntries = {
  kind: v.picklist(MEDIA_LINK_KINDS),
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  meta: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200)))),
  href: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2000)))),
  fileId: v.optional(v.nullable(fileIdSchema)),
  sortOrder: v.optional(v.number(), 0),
};

const mediaLinkFieldsSchema = v.pipe(
  v.object(mediaLinkFieldsEntries),
  v.check(
    (input) => Boolean(input.fileId) || Boolean(input.href?.trim()),
    "Either an uploaded file or a link is required"
  )
);

/**
 * Published links, grouped by `kind` then display order, with an uploaded
 * file resolved to a URL when one is set.
 */
export const listMediaLinks = publicProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select()
    .from(mediaLink)
    .orderBy(asc(mediaLink.kind), asc(mediaLink.sortOrder))
    .all();

  const published = rows.filter((row) => row.publishedAt !== null);
  const urls = await resolveFileUrls(
    context.db,
    published.flatMap((row) => (row.fileId ? [row.fileId] : []))
  );

  return published.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    meta: row.meta,
    href: row.fileId
      ? (urls.get(row.fileId) ?? row.href ?? "")
      : (row.href ?? ""),
    sortOrder: row.sortOrder,
  }));
});

/**
 * CMS staff adding a magazine or a press mention directly - no club, no
 * review queue. See `academic-heads.ts`'s `createAcademicHead` for why
 * `publishedAt` is set on create: this is published by the College's own
 * office, so there is nothing here for a second person to check.
 */
export const createMediaLink = cmsProcedure
  .input(mediaLinkFieldsSchema)
  .handler(async ({ input, context }) => {
    const record = await context.db
      .insert(mediaLink)
      .values({
        id: crypto.randomUUID(),
        kind: input.kind,
        title: input.title,
        meta: input.meta ?? null,
        href: input.href?.trim() || null,
        fileId: input.fileId ?? null,
        sortOrder: input.sortOrder ?? 0,
        publishedAt: new Date(),
      })
      .returning({ id: mediaLink.id })
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateMediaLink = cmsProcedure
  .input(
    v.pipe(
      v.object({
        id: mediaLinkIdSchema,
        ...mediaLinkFieldsEntries,
      }),
      v.check(
        (input) => Boolean(input.fileId) || Boolean(input.href?.trim()),
        "Either an uploaded file or a link is required"
      )
    )
  )
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(mediaLink)
      .set({
        kind: input.kind,
        title: input.title,
        meta: input.meta ?? null,
        href: input.href?.trim() || null,
        fileId: input.fileId ?? null,
        sortOrder: input.sortOrder ?? 0,
      })
      .where(eq(mediaLink.id, input.id))
      .returning({ id: mediaLink.id })
      .get();

    if (!record) {
      throw new ORPCError("NOT_FOUND", { message: "Media link not found" });
    }

    return { id: record.id };
  });

export const deleteMediaLink = cmsProcedure
  .input(v.object({ id: mediaLinkIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(mediaLink)
      .where(eq(mediaLink.id, input.id))
      .returning({ id: mediaLink.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Media link not found" });
    }

    return { id: input.id };
  });
