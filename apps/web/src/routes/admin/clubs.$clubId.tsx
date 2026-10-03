import {
  CmsLink,
  Notice,
  Panel,
  PanelHead,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";

import { ActivityTable } from "@/components/admin/activity-table";
import { ClubAccessPanel } from "@/components/admin/club-access-panel";
import { activitySearch } from "@/components/tables/queue-search";
import { useTableCallbacks } from "@/components/tables/use-list-state";
import { orpc } from "@/utils/orpc";

/**
 * One club, and everything an administrator can do to it.
 *
 * ## Three panels, in the order they are read
 *
 * What the club *is* (the registry facts), what may be done to its account (the
 * password and the ban), and what it has already done (the audit trail). The last
 * one is a table and not a list because a club's trail is a question an
 * administrator asks with filters — "just the credential changes", "just this
 * month" — and a list that cannot be filtered answers it by scrolling.
 *
 * ## No approval controls here, on purpose
 *
 * Submissions are reviewed in Content, in one queue, by one role. A club page
 * that could also approve would be a second queue with a second set of rules and
 * a second place to look when a decision is disputed. So the trail below is
 * strictly a record: the table has no action column and no way to add one.
 *
 * ## Both queries are URL-driven and server-fetched
 *
 * The club and its first page of actions are fetched in the loader, before the
 * HTML is sent, so the page arrives with its facts and its trail already in it.
 * Changing the search, the order or the page rewrites the URL and re-runs that
 * loader; the trail keeps the previous page on screen while the next arrives, so
 * changing page three does not read as "this club has done nothing".
 */

const AdminClubPage = () => {
  const { clubId } = Route.useParams();
  const search = activitySearch.parse(Route.useSearch());
  const writeSearch = activitySearch.write();

  const { onSearchChange, onSortingChange, onPaginationChange } =
    useTableCallbacks({ search, writeSearch });

  const clubQuery = useQuery(
    orpc.adminClubs.club.queryOptions({
      input: { clubId },
      placeholderData: keepPreviousData,
    })
  );
  const activityQuery = useQuery(
    orpc.adminClubs.activity.queryOptions({
      input: { ...activitySearch.toListInput(search), clubId },
      placeholderData: keepPreviousData,
    })
  );

  /**
   * After a change to the account, re-read the club itself.
   *
   * Not an invalidation of the whole list: the table on the other page is stale
   * for one row, and this page has to be right — a panel that says "No account
   * yet" above a button that has just created one is worse than no refresh.
   */
  const refetchClub = useCallback(async () => {
    await clubQuery.refetch();
  }, [clubQuery]);

  const club = clubQuery.data;

  if (clubQuery.isError) {
    return (
      <ScreenWrap>
        <ScreenHead
          eyebrow="Club accounts"
          heading="Club not found"
          note="That club is not in the configuration, so there is nothing here to manage."
        />
        <Notice tone="danger">
          {clubQuery.error instanceof Error
            ? clubQuery.error.message
            : "The club could not be loaded."}
        </Notice>
        <p>
          <CmsLink href="/admin/clubs" tone="quiet">
            Back to club accounts
          </CmsLink>
        </p>
      </ScreenWrap>
    );
  }

  return (
    <ScreenWrap>
      <p>
        <CmsLink href="/admin/clubs" tone="quiet">
          ← All clubs
        </CmsLink>
      </p>

      <ScreenHead
        actions={
          club?.status === "archived" ? (
            <Notice tone="warning">This club is archived.</Notice>
          ) : null
        }
        eyebrow="Club accounts"
        heading={club ? club.name : "Club"}
        note={
          club
            ? `/${club.slug} · one administrator account · ${club.totalSubmissions} ${club.totalSubmissions === 1 ? "submission" : "submissions"} sent`
            : "Loading the club…"
        }
      />

      {club ? (
        <Panel>
          <PanelHead
            eyebrow="Registry"
            note="Read from the club configuration, not from the database."
            title="Configuration"
          />
          <RecordList label="Club configuration">
            <RecordRow
              key="slug"
              meta={<span>Used in the website&apos;s club addresses.</span>}
              name={`/${club.slug}`}
            />
            <RecordRow
              key="admin"
              meta={
                <span>
                  The only account with access to this club&apos;s portal.
                </span>
              }
              name={`@${club.adminUsername}`}
            />
            <RecordRow
              key="galleries"
              meta={
                <span>
                  {club.managesSchoolGalleries
                    ? "Also curates the school's own top-level galleries."
                    : "Its galleries appear only under this club."}
                </span>
              }
              name="School galleries"
            />
          </RecordList>
        </Panel>
      ) : null}

      {club ? <ClubAccessPanel club={club} onChanged={refetchClub} /> : null}

      <ActivityTable
        emptyNote="Rotating this club's password, banning its administrator, or anything it sends for review is recorded here."
        emptyTitle="Nothing recorded for this club yet."
        isError={activityQuery.isError}
        isFetching={activityQuery.isFetching}
        isLoading={activityQuery.isPending}
        note="Everything this club's administrator has done, newest first. Read-only — decisions are made in Content."
        onPaginationChange={onPaginationChange}
        onSearchChange={onSearchChange}
        onSortingChange={onSortingChange}
        rows={activityQuery.data?.rows ?? []}
        search={search}
        title="What this club has done"
        total={activityQuery.data?.total ?? 0}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/admin/clubs/$clubId")({
  validateSearch: activitySearch.routeSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        orpc.adminClubs.club.queryOptions({
          input: { clubId: params.clubId },
        })
      ),
      context.queryClient.ensureQueryData(
        orpc.adminClubs.activity.queryOptions({
          input: {
            ...activitySearch.toListInput(activitySearch.parse(deps)),
            clubId: params.clubId,
          },
        })
      ),
    ]),
  head: () => ({
    meta: [
      { title: "Club account — Admin — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminClubPage,
});
