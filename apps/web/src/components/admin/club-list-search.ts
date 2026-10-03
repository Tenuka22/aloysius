import {
  CLUB_ACCOUNT_FILTERS,
  CLUB_STATUS_FILTERS,
} from "@aloysius/api/routers/admin-clubs";
import {
  readDirection,
  readOneOf,
  readPage,
  readPageSize,
  readString,
} from "@aloysius/ui/components/data-table/list-search";
import type { RouteSearch } from "@aloysius/ui/components/data-table/list-search";
import { useListSearchWriter } from "@aloysius/ui/components/data-table/use-list-search-writer";

import { CLUB_ACCOUNT_SORT_KEYS } from "@/components/tables/list-types";
import {
  DEFAULT_PAGE_SIZE,
  LIST_PAGE_SIZES,
} from "@/components/tables/queue-search";

/**
 * The club accounts table's URL contract: what a param is called, what it may
 * hold, and what it means to the server.
 *
 * ## Why this is its own file and not another `makeListSearchParser` kind
 *
 * The shared factory covers `q`, `sort`, `dir`, `page` and `size`, and this list
 * needs all five plus two filters the factory has no room for. Widening the
 * factory to take per-kind extras would put a `status` param on the pending
 * queues and an `account` param on the submissions list — both meaningless, both
 * still on the URL, both still something to keep in step. A surface that has its
 * own filters owns its own contract, and borrows the five readers it shares.
 *
 * ## Every value is clamped on the way in
 *
 * `?page=-4`, `?size=1000`, `?status=deleted`, `?account=;drop table` and
 * `?sort=whatever` are all read here and all become a valid default rather than a
 * 500 or an empty table that reads as a statement about the College. The server
 * validates again; this is the first gate, not the only one.
 */

/** The order the list is in when the URL names none: A to Z by club name. */
export const CLUB_LIST_DEFAULT_SORT = "name";

/** Ascending unless the URL says `desc`. */
export const CLUB_LIST_DEFAULT_DIR = "asc" as const;

/** The "no filter" value both selects offer, and the only one omitted from the URL. */
export const ANY_FILTER = "all";

export type ClubListSortKey = (typeof CLUB_ACCOUNT_SORT_KEYS)[number];
export type ClubStatusFilter =
  | typeof ANY_FILTER
  | (typeof CLUB_STATUS_FILTERS)[number];
export type ClubAccountFilter =
  | typeof ANY_FILTER
  | (typeof CLUB_ACCOUNT_FILTERS)[number];

/**
 * The three status values with the words the select shows.
 *
 * Values and labels are one list on purpose: a value the parser accepts and a
 * label a person reads are the same fact, and the day a fourth status reaches
 * `CLUB_STATUSES` and not here, the filter cannot offer it.
 */
export const CLUB_STATUS_OPTIONS = [
  { value: "all", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const satisfies readonly { value: ClubStatusFilter; label: string }[];

/**
 * The three account states with the words the select shows.
 *
 * "Has an account" deliberately excludes a banned account: a banned account
 * cannot sign in, so listing it as working would put a club in the filter's
 * result that its editor still cannot reach.
 */
export const CLUB_ACCOUNT_OPTIONS = [
  { value: "all", label: "Any account" },
  { value: "provisioned", label: "Can sign in" },
  { value: "unprovisioned", label: "No account yet" },
  { value: "banned", label: "Banned" },
] as const satisfies readonly { value: ClubAccountFilter; label: string }[];

/** What the table is showing, as the URL says. Every field is already valid. */
export interface ClubListSearch {
  /** Free text, matched by the server against the name, slug and handle. */
  q: string;
  status: ClubStatusFilter;
  account: ClubAccountFilter;
  sort: ClubListSortKey;
  dir: typeof CLUB_LIST_DEFAULT_DIR | "desc";
  /** One-based, because a URL is read by people. */
  page: number;
  size: number;
}

/**
 * Reads the club list out of any search object, valid or not.
 *
 * Both the route's `validateSearch` and the page's read of the URL, which is the
 * point: a value the route accepts and a value the table renders cannot come from
 * two lists of what is allowed. Idempotent, so the page may re-parse defensively.
 */
export const parseClubListSearch = (
  search: Record<string, unknown>
): ClubListSearch => ({
  q: readString(search.q),
  status:
    readOneOf<ClubStatusFilter>(search.status, [
      ANY_FILTER,
      ...CLUB_STATUS_FILTERS,
    ]) ?? ANY_FILTER,
  account:
    readOneOf<ClubAccountFilter>(search.account, [
      ANY_FILTER,
      ...CLUB_ACCOUNT_FILTERS,
    ]) ?? ANY_FILTER,
  sort:
    (readOneOf(search.sort, CLUB_ACCOUNT_SORT_KEYS) as ClubListSortKey) ??
    CLUB_LIST_DEFAULT_SORT,
  dir: readDirection(search.dir),
  page: readPage(search.page),
  size: readPageSize(search.size, LIST_PAGE_SIZES, DEFAULT_PAGE_SIZE),
});

/**
 * A `ClubListSearch` back into query-string values, every default left off.
 *
 * **Runs after validation, and that ordering is load-bearing.** A route's
 * `validateSearch` return value is what the router serialises into the address
 * bar, so returning the *filled* object puts `?q=&status=all&account=all&sort=name
 * &dir=asc&page=1&size=50` on every unfiltered list — seven params of which none
 * narrowed anything. Omission has to be the last thing that happens to a value.
 *
 * It is also what makes the params optional to a `<Link>`: every key is absent at
 * its default, so a link may carry none of them.
 */
export const toClubListParams = (
  search: ClubListSearch
): RouteSearch<ClubListSearch> => {
  const params: RouteSearch<ClubListSearch> = {};

  if (search.q !== "") {
    params.q = search.q;
  }
  if (search.status !== ANY_FILTER) {
    params.status = search.status;
  }
  if (search.account !== ANY_FILTER) {
    params.account = search.account;
  }
  if (search.sort !== CLUB_LIST_DEFAULT_SORT) {
    params.sort = search.sort;
  }
  if (search.dir !== CLUB_LIST_DEFAULT_DIR) {
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

/** What the route declares as its `validateSearch`: clamped, then stripped. */
export const validateClubListRouteSearch = (
  search: Record<string, unknown>
): RouteSearch<ClubListSearch> => toClubListParams(parseClubListSearch(search));

/** What the server is asked, for a URL. The one bridge between the two. */
export const toClubListInput = (search: ClubListSearch) => ({
  q: search.q || undefined,
  status: search.status === ANY_FILTER ? undefined : search.status,
  account: search.account === ANY_FILTER ? undefined : search.account,
  sortBy: search.sort,
  sortDirection: search.dir,
  page: search.page,
  pageSize: search.size,
});

/**
 * True when something is narrowing the list.
 *
 * Drives the "Clear filters" button, and is the difference between "no clubs
 * match" and "there are no clubs" — two sentences that must never be confused,
 * because the first invites an administrator to give up on a filter and the
 * second invites them to delete something.
 */
export const hasClubListFilters = (search: ClubListSearch): boolean =>
  search.q !== "" ||
  search.status !== ANY_FILTER ||
  search.account !== ANY_FILTER;

/**
 * The URL writer, as a hook.
 *
 * A hook because it closes over the router's `navigate`, and a component that
 * calls it re-renders when the URL changes — which is the cycle a list wants:
 * state written, URL updated, loader re-run, rows replaced.
 */
export const useClubListSearchWriter = () =>
  useListSearchWriter(parseClubListSearch, toClubListParams);
