import { files } from "@aloysius/db/schema/files";
import { and, eq, inArray } from "drizzle-orm";
import * as v from "valibot";

import { protectedProcedure } from "../../index";
import { resolveFileUrls } from "./file-urls";

/** How many ids one call may resolve. */
const MAX_IDS = 200;

/**
 * The public URL for each of the caller's own uploads.
 *
 * ## Why this exists
 *
 * A content row references storage by id and never by URL - the extension lives
 * in the storage key, so a client cannot build a URL from an id alone. Server-side
 * readers get that lookup for free (`resolveFileUrls`), but the *browser* had no
 * way to ask: `listFiles` is `adminProcedure`, so a club administrator could not
 * resolve anything they had uploaded.
 *
 * That is what made image uploads look broken. `FileUploader` uploads, stores the
 * returned `fileId` as its value, releases the local object URL on the grounds
 * that "the stored image is the thing to show now" - and then had nothing to show,
 * because no URL for a stored image existed on the client. The frame went blank at
 * the exact moment the upload succeeded. The CMS editors did not hit it because
 * they store block content by URL rather than by id.
 *
 * ## Scoped to the caller's own uploads
 *
 * Reads of *published* images are deliberately open - they are on a public site.
 * But this answers a different question: "what did I just upload, and is it still
 * there". An id for an unpublished image is effectively a bearer reference, so only
 * the uploader may resolve one, and only for rows their own session created. The
 * check is in the query rather than applied afterwards, because the ids come from
 * the client and that is the only place it cannot be bypassed.
 *
 * Ids that do not resolve are simply absent from the map rather than an error: "the
 * photograph attached to this pending submission has been deleted" is a state the
 * reviewer and the club both have to be able to render, not a request that should
 * fail.
 */
export const resolveUrls = protectedProcedure
  .input(
    v.object({
      ids: v.pipe(
        v.array(v.pipe(v.string(), v.minLength(1))),
        v.maxLength(MAX_IDS)
      ),
    })
  )
  .handler(async ({ input, context }) => {
    const wanted = [...new Set(input.ids)];
    if (wanted.length === 0) {
      return { urls: {} };
    }

    const owned = await context.db
      .select({ id: files.id })
      .from(files)
      .where(
        and(
          inArray(files.id, wanted),
          eq(files.userId, context.session.user.id)
        )
      )
      .all();

    if (owned.length === 0) {
      return { urls: {} };
    }

    const urls = await resolveFileUrls(
      context.db,
      owned.map((row) => row.id)
    );

    return { urls: Object.fromEntries(urls) };
  });
