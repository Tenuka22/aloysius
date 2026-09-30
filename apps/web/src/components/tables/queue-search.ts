import {
  readDirection,
  readOneOf,
  readPage,
  readPageSize,
  readString,
} from "@aloysius/ui/components/data-table/list-search";
import { useListSearchWriter } from "@aloysius/ui/components/data-table/use-list-search-writer";
import type { RouteSearch } from "@aloysius/ui/components/data-table/list-search";

import {
  QUEUE_SORT_KEYS,
  SUBMISSION_SORT_KEYS,
  ACTIVITY_SORT_KEYS,
  ACCOUNT_SORT_KEYS,
} from "./list-types";

/**
 * The list contract shared by every table-backed queue in this app.
 *
 * Each surface writes its own defaults and its own sort keys, and the parsing
 * is one function per surface built from the same five readers — because the
 * shape of the URL (`q`, `sort`, `dir`, `page`, `size`) is the same everywhere,
 * while what each list sorts by is a fact about that list.
 *
 * The route's `validateSearch` declares the *stripped* type (defaults omitted),
 * the page re-runs the full parser over what it is handed, and the loader turns
 * the parsed object into the server input. One parser, idempotent, three uses.
 */

/** The page sizes every table offers. The URL may only name one of these. */
export const LIST_PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 50;

export interface ListSearch<TSortKey extends string> {
  /** Free text, matched by the server against the row's own fields. */
  q: string;
  sort: TSortKey;
  dir: "asc" | "desc";
  /** One-based, because a URL is read by people. */
  page: number;
  size: number;
}

/** The four list kinds, and the sort key each one orders by. */
type ListKind = "queue" | "submission" | "activity" | "account";

type SortKeyFor<TKind extends ListKind> = (typeof KEYS)[TKind][number];

const KEYS = {
  queue: QUEUE_SORT_KEYS,
  submission: SUBMISSION_SORT_KEYS,
  activity: ACTIVITY_SORT_KEYS,
  account: ACCOUNT_SORT_KEYS,
} as const;

const DEFAULT_SORT = {
  queue: "submittedAt",
  submission: "submittedAt",
  activity: "createdAt",
  account: "name",
} as const;

/**
 * The parser for one list, parameterised by which kind it is.
 *
 * Generic over the sort-key union so each surface's `validateSearch` returns its
 * own narrow type while sharing every line of clamping logic. An unknown sort
 * key in a hand-edited URL falls back to the list's default rather than reaching
 * the server as something its `sortBy` check does not name.
 */
export const makeListSearchParser = <TKind extends ListKind>(
  kind: TKind
) => {
  const parse = (
    search: Record<string, unknown>
  ): ListSearch<SortKeyFor<TKind>> => ({
    q: readString(search.q),
    sort: (readOneOf(search.sort, KEYS[kind]) ??
      DEFAULT_SORT[kind]) as SortKeyFor<TKind>,
    dir: readDirection(search.dir),
    page: readPage(search.page),
    size: readPageSize(search.size, LIST_PAGE_SIZES, DEFAULT_PAGE_SIZE),
  });

  /**
   * The filled value back to query params, every default left off.
   *
   * **Runs after validation, not before, and that ordering is load-bearing.**
   * The router serialises `validateSearch`'s return value back into the address
   * bar, so a validator that returns the *filled* object puts every default on
   * the URL — `?q=&sort=submittedAt&dir=desc&page=1&size=50`, five params of
   * which none narrowed anything.
   */
  const toParams = (
    search: ListSearch<SortKeyFor<TKind>>
  ): RouteSearch<ListSearch<SortKeyFor<TKind>>> => {
    const params: RouteSearch<ListSearch<SortKeyFor<TKind>>> = {};
    const defaultSort = DEFAULT_SORT[kind];

    if (search.q !== "") {
      params.q = search.q;
    }
    if (search.sort !== defaultSort) {
      params.sort = search.sort;
    }
    if (search.dir !== "desc") {
      params.dir = search.dir;
    }
    if (search.page !== 1) {
      params.page = search.page;
    }
    if (search.size !== DEFAULT_PAGE_SIZE) {
      params.size = search.size;
    }

    return params;
  };

  /** What the route declares: clamped, then stripped of its defaults. */
  const routeSearch = (
    search: Record<string, unknown>
  ): RouteSearch<ListSearch<SortKeyFor<TKind>>> => toParams(parse(search));

  /** What the server is asked, for a URL. The one bridge between the two. */
  const toListInput = (search: ListSearch<SortKeyFor<TKind>>) => ({
    q: search.q || undefined,
    sortBy: search.sort,
    sortDirection: search.dir,
    page: search.page,
    pageSize: search.size,
  });

  /**
   * The URL writer, as a hook.
   *
   * It is a hook rather than a plain function because it closes over the
   * router's `navigate`, and a component that calls it re-renders when the URL
   * changes — which is exactly the cycle a list wants: state written, URL
   * updated, loader re-run, rows replaced.
   */
  const useWrite = () =>
    useListSearchWriter(
      parse as (raw: Record<string, unknown>) => ListSearch<SortKeyFor<TKind>>,
      toParams as (search: ListSearch<SortKeyFor<TKind>>) => RouteSearch<
        ListSearch<SortKeyFor<TKind>>
      >
    );

  return {
    parse,
    toParams,
    routeSearch,
    toListInput,
    /** Written as `write` at the call site: `const write = x.write();` */
    write: useWrite,
  };
};

/**
 * The four lists that exist today, each named once.
 *
 * A surface imports its own — `queueSearch` for the pending queues, and so on —
 * and everything the surface needs (parse, route contract, server input, URL
 * writer) is on that one object. Adding a fifth list is one line here and one
 * route file there, and the parsing can never drift between them because it is
 * literally the same function.
 */
export const queueSearch = makeListSearchParser("queue");
export const submissionSearch = makeListSearchParser("submission");
export const activitySearch = makeListSearchParser("activity");
export const accountSearch = makeListSearchParser("account");
