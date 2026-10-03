import {
  searchToPagination,
  searchToSorting,
} from "@aloysius/ui/components/data-table/list-search";
import { useListSearchWriter } from "@aloysius/ui/components/data-table/use-list-search-writer";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { functionalUpdate } from "@tanstack/react-table";
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useCallback } from "react";

import type { ListSearch } from "./queue-search";

/**
 * The bridge between a list's URL state and TanStack Table's two-word shape.
 *
 * The table receives sorting and pagination **as props** and reports changes
 * through callbacks that write the URL. That is the only arrangement in which
 * all three of these are true at once:
 *
 * - the server has been told (the route's `loader` turns the same params into
 *   the query input and fetches before the page is sent);
 * - the table cannot drift from the data (`manualSorting` and
 *   `manualPagination` mean a sorting state the table owned would reorder
 *   nothing — the rows arrive in the order the query asked for);
 * - the list survives a refresh, a shared link and the Back button.
 */
export const useListSearchWriterFor = <TSortKey extends string>(
  parse: (raw: Record<string, unknown>) => ListSearch<TSortKey>,
  toParams: (search: ListSearch<TSortKey>) => Record<string, unknown>
) =>
  useListSearchWriter(
    parse as (raw: Record<string, unknown>) => ListSearch<TSortKey>,
    toParams as never
  );

/**
 * The query for one list page, with the previous page kept on screen while the
 * next is fetched. Without `keepPreviousData`, a page change empties the table
 * for the length of a round trip, and "no submissions" is what an operator reads
 * in that gap.
 */
export const useListQuery = <TOutput>(
  key: readonly unknown[],
  fetcher: () => Promise<TOutput>
) =>
  useQuery({
    queryKey: key,
    queryFn: fetcher,
    placeholderData: keepPreviousData,
  });

/** The two callbacks a manual-mode table needs, both writing through the URL. */
export const useTableCallbacks = <TSortKey extends string>({
  search,
  writeSearch,
}: {
  search: ListSearch<TSortKey>;
  writeSearch: (
    patch: Partial<ListSearch<TSortKey>>,
    options?: { replace?: boolean }
  ) => void;
}) => {
  /**
   * Every change to *what is listed* returns to the first page. Changing the
   * search or the order makes the current page meaningless — page 6 of a search
   * that now matches four rows is an empty table, which reads as "nothing
   * matches" and is a statement about the work, not the filter.
   */
  const onSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const [column] = functionalUpdate(updater, searchToSorting(search));
      writeSearch({
        sort: (column?.id ?? search.sort) as TSortKey,
        dir: column?.desc ? "desc" : "asc",
        page: 1,
      });
    },
    [search, writeSearch]
  );

  const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
    (updater) => {
      const next = functionalUpdate(updater, searchToPagination(search));
      writeSearch(
        { page: next.pageIndex + 1, size: next.pageSize },
        { replace: false }
      );
    },
    [search, writeSearch]
  );

  const onSearchChange = useCallback(
    (value: string) => writeSearch({ q: value, page: 1 }),
    [writeSearch]
  );

  return { onSortingChange, onPaginationChange, onSearchChange };
};

/**
 * Partial invalidation for a list whose key is built from its input.
 *
 * A *partial* key, not one built from the input: a decision has to refresh the
 * page it was made from and every other page and filter combination in the
 * cache, and a full key would refresh only the one request that happened to be
 * in front of the operator.
 */
export const useListInvalidation = (key: readonly unknown[]) => {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    // The prefix that covers every filter combination of this one procedure.
    await queryClient.invalidateQueries({
      queryKey: key.slice(0, 2),
    });
  }, [key, queryClient]);
};
