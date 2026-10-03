import { Notice } from "@aloysius/ui/components/cms/cms-primitives";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useMatch } from "@tanstack/react-router";

import {
  ANY_FILTER,
  hasClubListFilters,
  parseClubListSearch,
  toClubListInput,
  toClubListParams,
  useClubListSearchWriter,
} from "@/components/admin/club-list-search";
import { ClubsTable } from "@/components/admin/clubs-table";
import { useTableCallbacks } from "@/components/tables/use-list-state";
import { orpc } from "@/utils/orpc";

/**
 * The club accounts table.
 *
 * Search, both filters, the order and the page are the URL, and the loader reads
 * the page on the server before the HTML is sent — so the first paint is the
 * answered question rather than a spinner, and a refresh, a shared link and the
 * Back button all arrive on the same page of rows. The validated params are
 * clamped and stripped of their defaults by the contract module; the page re-runs
 * the same parser over what it is handed, so a hand-typed URL and a link written
 * here arrive as one type.
 *
 * Each row opens that club's own screen, which is where its password, its access
 * and its actions live. One screen per club rather than an expandable row: the
 * controls are a second page's worth of state, and a table row that grows a
 * password field is a row with two jobs.
 *
 * There is no `beforeLoad` here. The `/admin` layout already refuses anyone whose
 * role is not `admin`, and it runs first — a second guard in the child could only
 * ever agree with it.
 *
 * This route is also the *parent* of `clubs.$clubId`, because the file router
 * nests a `clubs.$clubId.tsx` under a `clubs.tsx`. A parent that draws its own
 * screen and never renders `<Outlet />` hides the child completely, which is how
 * a club URL can show the table it was opened from. So the table yields whenever
 * the child has matched: one screen in the viewport, not two stacked.
 */
const AdminClubsPage = () => {
  const search = parseClubListSearch(Route.useSearch());
  const writeSearch = useClubListSearchWriter();
  const isClubDetail = Boolean(
    useMatch({ from: "/admin/clubs/$clubId", shouldThrow: false })
  );

  const { onSearchChange, onSortingChange, onPaginationChange } =
    useTableCallbacks({ search, writeSearch });

  const query = useQuery(
    orpc.adminClubs.clubAccounts.queryOptions({
      input: toClubListInput(search),
      placeholderData: keepPreviousData,
    })
  );

  /*
   * A club's own screen is this route's child, so it draws where the child slot
   * is drawn — and here the slot would sit underneath the table. Yield first:
   * the child owns the viewport for as long as its URL is open, and the table
   * comes back untouched when the URL leaves it. Every hook above still runs so
   * the order stays identical whether the child is open or not.
   */
  if (isClubDetail) {
    return <Outlet />;
  }

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Clubs / Accounts"
        heading="Club accounts"
        note="Every club runs on one administrator account. Open a club to issue or rotate its password, block or restore its sign-in, and read everything it has done."
      />

      {/*
        A failed read is named here as well as in the table, because the table's
        own error state replaces the table body — and an administrator who has
        just pressed a filter deserves to be told the filter is what failed.
      */}
      {query.isError ? (
        <Notice tone="danger">
          {query.error instanceof Error
            ? query.error.message
            : "The club list could not be loaded."}
        </Notice>
      ) : null}

      <ClubsTable
        hasFilters={hasClubListFilters(search)}
        isError={query.isError}
        isFetching={query.isFetching}
        isLoading={query.isPending}
        onAccountChange={(account) => {
          writeSearch({ account, page: 1 });
        }}
        onPaginationChange={onPaginationChange}
        onResetFilters={() => {
          writeSearch({
            q: "",
            status: ANY_FILTER,
            account: ANY_FILTER,
            page: 1,
          });
        }}
        onSearchChange={onSearchChange}
        onSortingChange={onSortingChange}
        onStatusChange={(status) => {
          writeSearch({ status, page: 1 });
        }}
        rows={query.data?.rows ?? []}
        search={search}
        total={query.data?.total ?? 0}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/admin/clubs")({
  validateSearch: (search) => toClubListParams(parseClubListSearch(search)),
  /*
   * `deps` is the route's own validated type — every default omitted — so it is
   * re-parsed here before it becomes a server input. Same parser, idempotent, and
   * the one place that guarantees a bare URL and a hand-typed one cannot ask the
   * server for two different things.
   */
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      orpc.adminClubs.clubAccounts.queryOptions({
        input: toClubListInput(parseClubListSearch(deps)),
      })
    ),
  head: () => ({
    meta: [
      { title: "Club accounts — Admin — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminClubsPage,
});
