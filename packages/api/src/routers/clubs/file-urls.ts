import type { Database } from "@aloysius/db";
import { files } from "@aloysius/db/schema/files";
import { inArray } from "drizzle-orm";

/**
 * Turning a `fileId` into something an `<img>` can load.
 *
 * A content row references storage by id and never by URL, so the extension - and
 * therefore the URL - is only knowable by looking the row up. Two reasons that
 * lookup is a function rather than an inline join everywhere:
 *
 * - The extension lives in the storage key, not the id, so a client cannot build
 *   the URL from `fileId` alone. Serving it from here keeps the bucket, the key
 *   prefix and this route a server-side detail: if any of them change, it is one
 *   function in one place.
 * - A presentation image that cannot be resolved returns `null` rather than a
 *   broken URL. Every caller already has a placeholder path, and a `src` that 404s
 *   is worse than an `<img>` that was never rendered.
 */

const FILE_ROUTE = "/api/files";

/** The public URL for one storage key. */
export const fileUrl = (key: string): string => `${FILE_ROUTE}/${key}`;

/** The minimal database surface these lookups need. */
export type ReadableDb = Pick<Database, "select">;

/**
 * Resolve many file ids to public URLs in one query.
 *
 * `ids` are de-duplicated by the `inArray` and mapped back with a `Map`, so this
 * is one indexed lookup however many rows call it - including the common case of
 * a list where several rows share the same cover image.
 *
 * Ids with no `files` row map to `null`. A dangling `fileId` should not happen
 * (`onDelete: "cascade"` clears the item) but the alternative - throwing - would
 * take down a whole gallery listing over one bad row.
 */
export const resolveFileUrls = async (
  db: ReadableDb,
  ids: readonly string[]
): Promise<Map<string, string>> => {
  const wanted = [...new Set(ids.filter((id) => id !== ""))];
  if (wanted.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({ id: files.id, key: files.key })
    .from(files)
    .where(inArray(files.id, wanted))
    .all();

  return new Map(rows.map((row) => [row.id, fileUrl(row.key)]));
};

/**
 * Attach an `imageUrl` to each row that carries a `fileId`.
 *
 * Done as a second lookup rather than a join so the caller's row shape stays
 * exactly the table shape plus one field. The set of `fileId` keys is read off
 * the rows themselves, so a caller with a differently-named column passes
 * `fileKey` explicitly.
 */
export const withImageUrls = async <T extends Record<string, unknown>>(
  db: ReadableDb,
  rows: readonly T[],
  fileKey: keyof T & string = "fileId" as keyof T & string
): Promise<(T & { imageUrl: string | null })[]> => {
  if (rows.length === 0) {
    return [];
  }

  const urlById = await resolveFileUrls(
    db,
    rows.map((row) => String(row[fileKey] ?? ""))
  );

  return rows.map((row) => {
    const id = String(row[fileKey] ?? "");
    return { ...row, imageUrl: id === "" ? null : (urlById.get(id) ?? null) };
  });
};
