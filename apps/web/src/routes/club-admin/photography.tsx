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

import { titleFromPayload } from "@/components/club/format";
import { ClubAdminPanel } from "@/components/club/review";
import { ActivityTable } from "@/components/tables/activity-table";
import { CredentialPanel } from "@/components/tables/credential-panel";
import { toQueueRow } from "@/components/tables/list-types";
import { activitySearch, queueSearch } from "@/components/tables/queue-search";
import { QueueTable } from "@/components/tables/queue-table";
import { useTableCallbacks } from "@/components/tables/use-list-state";
import { orpc } from "@/utils/orpc";

/**
 * The Photography Club's own review page, at `/club-admin/photography` - a
 * *static* route, hand-typed into the file tree rather than derived from a
 * `$slug` parameter.
 *
 * The general queue at /cms/clubs stays the place where every club's work is
 * reviewed together; this page is the same decisions, scoped to the one club
 * the school has charged with its photography. The club id and name are
 * constants here on purpose - the page exists because the club exists, and a
 * dynamic route would make "the photography page" an address someone could
 * guess for a club that has no page.
 *
 * Everything the CMS can do about this club is on this screen, in task order:
 * see what is waiting, decide it, then manage the account that sent it. Both
 * lists are URL-state tables backed by the same shared kit, so a deep link to
 * "page 2 of the photography queue, newest first" is a link that works.
 *
 * Every future club's admin page is the same shape, at `/club-admin/<slug>`:
 * copy this file, swap `CLUB_ID` and `CLUB_NAME`, rename the file to the
 * club's slug.
 */

const CLUB_ID = "club-photography";
const CLUB_NAME = "Photography Club";

const PhotographyClubPage = () => {
  const [message, setMessage] = useState<string | null>(null);
  const queue = queueSearch.parse(Route.useSearch());
  const activity = activitySearch.parse(Route.useSearch());

  const queueWriter = queueSearch.write();
  const activityWriter = activitySearch.write();

  const queueCallbacks = useTableCallbacks({
    search: queue,
    writeSearch: queueWriter,
  });
  const activityCallbacks = useTableCallbacks({
    search: activity,
    writeSearch: activityWriter,
  });

  const pendingQuery = useQuery(
    orpc.adminClubs.pendingClub.queryOptions({
      input: { ...queueSearch.toListInput(queue), clubId: CLUB_ID },
      placeholderData: keepPreviousData,
    })
  );
  const globalQuery = useQuery(
    orpc.adminClubs.pendingGlobal.queryOptions({
      input: queueSearch.toListInput(queue),
      placeholderData: keepPreviousData,
    })
  );
  const activityQuery = useQuery(
    orpc.adminClubs.activity.queryOptions({
      input: { ...activitySearch.toListInput(activity), clubId: CLUB_ID },
      placeholderData: keepPreviousData,
    })
  );
  const adminQuery = useQuery(
    orpc.adminClubs.admin.queryOptions({ input: { clubId: CLUB_ID } })
  );

  /*
   * Both queues are listed, but each row is filtered to this club: the club
   * queue by its `clubId`, the global queue by `submittedByClubId`. A global
   * row with a null club was sent by a signed-out CMS editor and never by this
   * club, so it is excluded rather than shown.
   */
  const rows = [
    ...(pendingQuery.data?.rows ?? []).map((row) => toQueueRow(row, "club")),
    ...(globalQuery.data?.rows ?? [])
      .filter((row) => row.clubId === CLUB_ID)
      .map((row) => toQueueRow(row, "global")),
  ];
  const total = rows.length;

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Clubs / Photography"
        heading="Photography Club"
        note="The club charged with the school's photography. It curates the school's galleries and may link them to any club's events and announcements — but nothing it sends is live until it is approved here, exactly like any other club."
      />

      {message ? <Notice tone="success">{message}</Notice> : null}

      <QueueTable
        emptyNote="When this club sends a gallery, event, achievement or notice it will appear here."
        emptyTitle="Nothing waiting for review."
        isError={pendingQuery.isError || globalQuery.isError}
        isFetching={pendingQuery.isFetching || globalQuery.isFetching}
        isLoading={pendingQuery.isPending || globalQuery.isPending}
        onDecided={setMessage}
        onPaginationChange={queueCallbacks.onPaginationChange}
        onSearchChange={queueCallbacks.onSearchChange}
        onSortingChange={queueCallbacks.onSortingChange}
        pagination={searchToPagination(queue)}
        refreshKeys={[
          orpc.adminClubs.pendingClub.key(),
          orpc.adminClubs.pendingGlobal.key(),
        ]}
        rows={rows}
        search={queue.q}
        sorting={searchToSorting(queue)}
        total={total}
      />

      <ClubAdminPanel
        clubId={CLUB_ID}
        clubName={CLUB_NAME}
        onDecided={setMessage}
      />

      <CredentialPanel adminQuery={adminQuery} onDecided={setMessage} />

      <ActivityTable
        emptyNote="Nothing has happened yet."
        emptyTitle="No administrator activity."
        isError={activityQuery.isError}
        isFetching={activityQuery.isFetching}
        isLoading={activityQuery.isPending}
        noun="entry"
        onPaginationChange={activityCallbacks.onPaginationChange}
        onSearchChange={activityCallbacks.onSearchChange}
        onSortingChange={activityCallbacks.onSortingChange}
        pagination={searchToPagination(activity)}
        rows={activityQuery.data?.rows ?? []}
        search={activity.q}
        sorting={searchToSorting(activity)}
        titleOf={(entry) => titleFromPayload(entry.metadata ?? '""')}
        total={activityQuery.data?.total ?? 0}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/club-admin/photography")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...queueSearch.routeSearch(search),
    ...activitySearch.routeSearch(search),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        orpc.adminClubs.pendingClub.queryOptions({
          input: {
            ...queueSearch.toListInput(queueSearch.parse(deps)),
            clubId: CLUB_ID,
          },
        })
      ),
      context.queryClient.ensureQueryData(
        orpc.adminClubs.pendingGlobal.queryOptions({
          input: queueSearch.toListInput(queueSearch.parse(deps)),
        })
      ),
      context.queryClient.ensureQueryData(
        orpc.adminClubs.activity.queryOptions({
          input: {
            ...activitySearch.toListInput(activitySearch.parse(deps)),
            clubId: CLUB_ID,
          },
        })
      ),
      context.queryClient.ensureQueryData(
        orpc.adminClubs.admin.queryOptions({ input: { clubId: CLUB_ID } })
      ),
    ]),
  head: () => ({
    meta: [
      { title: "Photography Club — Admin — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PhotographyClubPage,
});
