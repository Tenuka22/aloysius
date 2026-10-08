import { files, filesInsertSchema } from "@aloysius/db/schema/files";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { pick } from "valibot";

import { protectedProcedure } from "../../index";

/**
 * Must match `KEY_PATTERN` in `apps/web/src/routes/api/files/$.ts`.
 *
 * The PUT route already refuses any key that is not `admin/<uuid>.<ext>`, so
 * this is the same shape asserted a second time, on the other half of the
 * upload. It was missing, and the two halves disagreed about what a key is:
 * `completeUpload` derived the row's id from `key.split("/").pop().split(".")[0]`
 * and inserted it, so a client could register a file for any key at all -
 * `evil/../../etc/passwd` became a row called `passwd` pointing outside the
 * bucket, and a bare `nodots` became a row with a null-ish key. The object was
 * never written (the PUT refused it), but the database claimed a file existed
 * that no image on the site could ever resolve, and every screen that lists
 * media offered it to an editor.
 */
const KEY_PATTERN = /^admin\/[0-9a-f-]{36}\.[a-z0-9]{1,10}$/u;

/** The id a key names, or null when the key does not name one. */
const idFromKey = (key: string): string | null => {
  if (!KEY_PATTERN.test(key)) {
    return null;
  }
  const name = key.slice("admin/".length);
  const extension = name.lastIndexOf(".");
  return extension === -1 ? null : name.slice(0, extension);
};

export const completeUpload = protectedProcedure
  .input(pick(filesInsertSchema, ["key", "name", "type", "size"]))
  .handler(async ({ input, context }) => {
    const id = idFromKey(input.key);

    if (!id) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "That is not an upload key. Ask files/getUploadUrl for one before uploading.",
      });
    }

    /*
     * A second `completeUpload` for a key that is already registered is a client
     * retry, not a new file. The insert used to run regardless and failed on the
     * primary key, which surfaced as a bare 500 from the driver - so a retried
     * upload looked like a server fault instead of an already-completed one.
     */
    const existing = await context.db
      .select({ id: files.id })
      .from(files)
      .where(eq(files.id, id))
      .get();

    if (existing) {
      throw new ORPCError("CONFLICT", {
        message: "That file has already been uploaded.",
      });
    }

    const record = await context.db
      .insert(files)
      .values({
        id,
        name: input.name,
        size: input.size,
        type: input.type,
        key: input.key,
        userId: context.session.user.id,
      })
      .returning()
      .get();

    return {
      id: record.id,
      name: record.name,
      size: record.size,
      type: record.type,
      url: `/api/files/${record.key}`,
      createdAt: record.createdAt.toISOString(),
    };
  });
