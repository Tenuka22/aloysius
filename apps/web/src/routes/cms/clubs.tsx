import { Notice } from "@aloysius/ui/components/cms/cms-primitives";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import {
  searchToPagination,
  searchToSorting,
} from "@aloysius/ui/components/data-table/list-search";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { toQueueRow } from "@/components/tables/list-types";
import { queueSearch } from "@/components/tables/queue-search";
import { QueueTable } from "@/components/tables/queue-table";
import { useTableCallbacks } from "@/components/tables/use-list-state";
import { orpc } from "@/utils/orpc";

/**
 * The reviewer's queue, as a table.
 *
 * The list state — what is searched, in what order, which page — is the URL, and
 * the loader fetches the page on the server before the HTML is sent, so a
 * refresh, a shared link and the Back button all arrive with the right rows
 * already in them. The validated params are clamped and stripped of their
 * defaults by the contract module; the page re-runs the same parser over what it
 * is handed, so a hand-typed URL and a link written by this page arrive as one
 * type.
 *
 * Both queues are read with the same input and merged: to a reviewer they are
 * one queue, and paging one but not the other would hide rows the reviewer
 * cannot find anywhere else. The scope tag on each row is what routes the
 * decision to the right table.
 */
const CmsClubsPage = () => {
  const [message, setMessage] = useState<string | null>(null);
  const search = queueSearch.parse(Route.useSearch());
  const writeSearch = queueSearch.write();

  const { onSearchChange, onSortingChange, onPaginationChange } =
    useTableCallbacks({ search, writeSearch });

  const pendingQuery = useQuery(
    orpc.adminClubs.pendingClub.queryOptions({
      input: queueSearch.toListInput(search),
      placeholderData: keepPreviousData,
    })
  );
  const globalQuery = useQuery(
    orpc.adminClubs.pendingGlobal.queryOptions({
      input: queueSearch.toListInput(search),
      placeholderData: keepPreviousData,
    })
  );

  const rows = [
    ...(pendingQuery.data?.rows ?? []).map((row) => toQueueRow(row, "club")),
    ...(globalQuery.data?.rows ?? []).map((row) => toQueueRow(row, "global")),
  ];
  const total =
    (pendingQuery.data?.total ?? 0) + (globalQuery.data?.total ?? 0);

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Clubs / Approvals"
        heading="Club approvals"
        note="Nothing a club sends reaches the website without a decision here. Approve it, or reject it with a reason the club can act on."
      />

      {message ? <Notice tone="success">{message}</Notice> : null}

      <QueueTable
        emptyNote="When a club sends a gallery, event, achievement or notice it will appear here."
        emptyTitle="Nothing waiting for review."
        isError={pendingQuery.isError || globalQuery.isError}
        isFetching={pendingQuery.isFetching || globalQuery.isFetching}
        isLoading={pendingQuery.isPending || globalQuery.isPending}
        onDecided={setMessage}
        onPaginationChange={onPaginationChange}
        onSearchChange={onSearchChange}
        onSortingChange={onSortingChange}
        pagination={searchToPagination(search)}
        refreshKeys={[
          orpc.adminClubs.pendingClub.key(),
          orpc.adminClubs.pendingGlobal.key(),
        ]}
        rows={rows}
        search={search.q}
        sorting={searchToSorting(search)}
        total={total}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/cms/clubs")({
  validateSearch: queueSearch.routeSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        orpc.adminClubs.pendingClub.queryOptions({
          input: queueSearch.toListInput(queueSearch.parse(deps)),
        })
      ),
      context.queryClient.ensureQueryData(
        orpc.adminClubs.pendingGlobal.queryOptions({
          input: queueSearch.toListInput(queueSearch.parse(deps)),
        })
      ),
    ]),
  head: () => ({
    meta: [
      { title: "Club approvals — Content Manager — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CmsClubsPage,
});
