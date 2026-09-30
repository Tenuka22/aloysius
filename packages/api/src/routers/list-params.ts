import * as v from "valibot";

/**
 * The list parameters every table-backed read accepts, and the one schema they
 * are parsed with.
 *
 * A table whose sorting, paging and search live in the URL needs a server that
 * takes exactly those six values, and every list taking a *different* spelling of
 * them is how a kit drifts: `?q=` here, `search=` there, `page` zero-based in one
 * handler and one-based in the next. One schema, one default each, and every list
 * reads the same shape.
 *
 * - `q` — free text, matched by the handler against whichever fields its rows
 *   are found by. Trimmed and capped so a pasted novel cannot become a parameter.
 * - `sortBy` / `sortDirection` — the URL's `sort` and `dir`. The *keys* a column
 *   may be ordered by are the handler's business, not this schema's: a list's
 *   contract file narrows `sortBy` itself, and the handler re-checks it, because
 *   the two lists of sortable keys are one fact the day either changes.
 * - `page` — one-based, because a URL is read by people. Clamped so `?page=-4`
 *   becomes page 1 rather than a negative offset.
 * - `pageSize` — the row count per page. Clamped to a ceiling so `?size=100000`
 *   is a big page, not an unbounded one.
 */
export const listParamsSchema = v.object({
  q: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(200)),
    ""
  ),
  /** One of the handler's own sortable keys; unknown values are ignored. */
  sortBy: v.optional(v.pipe(v.string(), v.maxLength(40))),
  sortDirection: v.optional(v.picklist(["asc", "desc"]), "asc"),
  page: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10_000)),
    1
  ),
  pageSize: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(200)),
    50
  ),
});

export type ListParams = v.InferOutput<typeof listParamsSchema>;

/** The offset a SQL `LIMIT ? OFFSET ?` pair wants, for a one-based page. */
export const listOffset = (params: ListParams): number =>
  (params.page - 1) * params.pageSize;

/**
 * True when the handler's `sortBy` is one its contract allows.
 *
 * Used as `sortByIs(params, "submittedAt")` inside a handler that has already
 * narrowed its own key union, so an unknown key in the URL falls back to the
 * handler's default rather than reaching a `case` that does not exist.
 */
export const sortByIs = (params: ListParams, key: string): boolean =>
  (params.sortBy ?? "") === key;

/** The direction, with the handler's own default already applied. */
export const sortDirectionOf = (
  params: ListParams,
  fallback: "asc" | "desc"
): "asc" | "desc" => (params.sortDirection ?? fallback) as "asc" | "desc";
