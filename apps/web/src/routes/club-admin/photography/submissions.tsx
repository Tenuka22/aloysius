import {
  searchToPagination,
  searchToSorting,
} from "@aloysius/ui/components/data-table/list-search";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ClubPage } from "@/components/club/page-parts";
import { submissionSearch } from "@/components/tables/queue-search";
import { SubmissionsTable } from "@/components/tables/submissions-table";
import { useTableCallbacks } from "@/components/tables/use-list-state";
import { orpc } from "@/utils/orpc";

/**
 * Everything this club has sent, across every screen, in one list.
 *
 * The per-screen queues (Events, Galleries, Achievements, Announcements) each
 * show only their own target; this is the same server list with no `target`
 * filter, so it answers "did I send *anything* that's still waiting" without
 * having to check six other pages. Search, sort and paging are the server's,
 * same as everywhere else this table appears.
 */
const SubmissionsPage = () => {
  const search = submissionSearch.parse(Route.useSearch());
  const writeSearch = submissionSearch.write();
  const { onSearchChange, onSortingChange, onPaginationChange } =
    useTableCallbacks({ search, writeSearch });

  const query = useQuery(
    orpc.clubs.listMySubmissions.queryOptions({
      input: submissionSearch.toListInput(search),
      placeholderData: keepPreviousData,
    })
  );

  return (
    <ClubPage
      eyebrow="Club / Submissions"
      note="Everything your club has sent that has not yet been approved or rejected. Once a CMS editor has decided, the item leaves this list."
      title="My submissions"
    >
      <SubmissionsTable
        emptyNote="Galleries, events, achievements and notices you send will appear here until a CMS editor has looked at them."
        emptyTitle="Nothing waiting for review."
        isError={query.isError}
        isFetching={query.isFetching}
        isLoading={query.isPending}
        onPaginationChange={onPaginationChange}
        onSearchChange={onSearchChange}
        onSortingChange={onSortingChange}
        pagination={searchToPagination(search)}
        rows={query.data?.rows ?? []}
        search={search.q}
        sorting={searchToSorting(search)}
        total={query.data?.total ?? 0}
      />
    </ClubPage>
  );
};

export const Route = createFileRoute("/club-admin/photography/submissions")({
  validateSearch: (search: Record<string, unknown>) =>
    submissionSearch.routeSearch(search),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      orpc.clubs.listMySubmissions.queryOptions({
        input: submissionSearch.toListInput(submissionSearch.parse(deps)),
      })
    ),
  head: () => ({
    meta: [
      { title: "My submissions — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SubmissionsPage,
});
