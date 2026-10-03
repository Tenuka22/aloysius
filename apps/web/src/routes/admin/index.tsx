import {
  CmsLink,
  Notice,
  Panel,
  PanelHead,
} from "@aloysius/ui/components/cms/cms-primitives";
import { ScreenWrap } from "@aloysius/ui/components/cms/screen-head";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ActivityTable } from "@/components/admin/activity-table";
import { activitySearch } from "@/components/tables/queue-search";
import { useTableCallbacks } from "@/components/tables/use-list-state";
import { orpc } from "@/utils/orpc";

/**
 * The administration overview.
 *
 * ## What this page is, now that `/admin/clubs` is a table
 *
 * Two questions, kept deliberately apart. **"Is anything wrong with a club's
 * access?"** is a roll-up — one figure, two notices, no list to page through —
 * and it is answered here in full. **"Which club do I want to work on?"** is a
 * list, and it lives at `/admin/clubs`, where it can be searched and filtered and
 * every row opens that club's own screen. Duplicating the club list here would
 * have meant two places to keep the same answer.
 *
 * **"What has been done lately?"** is also a list, and it is the second thing on
 * this page as a table for the same reason: an audit trail that shows the last ten
 * rows and cannot say what the eleventh was is a list that stops silently at a
 * cap and reads as complete.
 */

const styles = stylex.create({
  wrap: {
    display: "grid",
    gap: space.md,
    alignContent: "start",
  },
  /*
   * One figure, not a row of tiles. The only question this page has to answer in
   * its first second is "is anything unprovisioned", and a single number leading a
   * sentence settles it in one glance where a tile row would make the operator
   * read four of them.
   */
  coverage: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: space["2xs"],
    marginBlockEnd: space.sm,
  },
  coverageValue: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: 1,
    color: color.onSurface,
    // The figure changes as accounts are created; tabular numerals stop it
    // shifting the sentence beside it every time it does.
    fontVariantNumeric: "tabular-nums",
  },
  coverageLabel: {
    margin: 0,
    maxWidth: "32ch",
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  noticeStack: {
    display: "grid",
    gap: space["2xs"],
  },
  backLink: {
    margin: 0,
    justifySelf: "start",
  },
});

/**
 * One clause naming several clubs.
 *
 * "Photography Club" reads as a list of one and "Photography Club and Robotics
 * Club" as a list of two; anything longer needs commas and an "and", and getting
 * that right in three places is exactly what this is for.
 */
const listNames = (names: readonly string[]) => {
  if (names.length <= 1) {
    return names[0] ?? "";
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
};

interface ClubAccount {
  username: string | null;
  banned: boolean | null;
}

interface CoverageSummary {
  ready: number;
  total: number;
  gapNames: string[];
  /**
   * Club-admin accounts whose username matches no configured club. Config drift,
   * not a user mistake: they can sign in and then edit nothing.
   */
  orphanHandles: string[];
}

/**
 * The roll-up in one pass over each list.
 *
 * Every figure on this page comes out of here, so "1 of 1 clubs has an account"
 * can never disagree with the notices printed underneath it.
 */
const summarizeCoverage = (
  clubs: readonly { id: string; name: string; adminUsername: string }[],
  accounts: readonly ClubAccount[]
): CoverageSummary => {
  const configured = new Set(clubs.map((club) => club.adminUsername));
  const gapNames: string[] = [];
  let ready = 0;

  // Indexed by username: one lookup per club instead of a scan of every account,
  // and the orphan pass below reuses the same key set.
  const byUsername = new Map<string, ClubAccount>();
  for (const account of accounts) {
    const { username } = account;
    if (username !== null) {
      byUsername.set(username, account);
    }
  }

  for (const club of clubs) {
    const account = byUsername.get(club.adminUsername);
    // A banned account is not a working one: the club still cannot submit, which
    // is the whole question this figure answers.
    if (account && account.banned !== true) {
      ready += 1;
    } else {
      gapNames.push(club.name);
    }
  }

  const orphanHandles: string[] = [];
  for (const [username] of byUsername) {
    if (!configured.has(username)) {
      orphanHandles.push(`@${username}`);
    }
  }

  return { gapNames, orphanHandles, ready, total: clubs.length };
};

/**
 * The sentence the roll-up leads with.
 *
 * Nothing while the figure is still travelling, a success only when every
 * configured club is covered, and otherwise the named gaps - because a
 * bare count of clubs that cannot submit is not something an administrator
 * can act on.
 */
const coverageNote = (summary: CoverageSummary | null) => {
  if (!summary) {
    return null;
  }

  if (summary.gapNames.length === 0) {
    return (
      <Notice tone="success">
        Every configured club has an administrator account, and none of them are
        banned.
      </Notice>
    );
  }

  return (
    <Notice tone="warning">
      {listNames(summary.gapNames)}{" "}
      {summary.gapNames.length === 1 ? "needs" : "need"} attention before{" "}
      {summary.gapNames.length === 1 ? "its" : "their"} editors can sign in.
    </Notice>
  );
};

/**
 * The access roll-up.
 *
 * Loading is a sentence rather than an empty panel, because "no clubs have an
 * administrator" and "the figure has not arrived" are different facts and the
 * second one is what a reader would otherwise conclude from the first.
 */
const CoveragePanel = ({
  clubs,
  isLoading,
  error,
  summary,
}: {
  clubs: readonly { id: string; name: string }[];
  isLoading: boolean;
  error: Error | null;
  summary: CoverageSummary | null;
}) => {
  const summaryNote = (
    <div {...stylex.props(styles.noticeStack)}>
      {coverageNote(summary)}

      {summary && summary.orphanHandles.length > 0 ? (
        <Notice tone="warning">
          {summary.orphanHandles.length === 1
            ? "One account matches"
            : `${summary.orphanHandles.length} accounts match`}{" "}
          no club in the configuration: {summary.orphanHandles.join(", ")}.{" "}
          {summary.orphanHandles.length === 1 ? "It" : "They"} can sign in but
          have nothing to edit.
        </Notice>
      ) : null}
    </div>
  );

  return (
    <Panel accent>
      <PanelHead
        action={
          <CmsLink href="/admin/clubs" tone="quiet">
            Manage club accounts
          </CmsLink>
        }
        eyebrow="Club access"
        note="A club can only submit content once its administrator account exists and is not banned."
        title="Account coverage"
      />

      {error ? (
        <Notice tone="danger">
          {error.message} Reload the page to try again.
        </Notice>
      ) : null}

      {isLoading ? (
        <p {...stylex.props(styles.coverageLabel)}>Loading club accounts…</p>
      ) : (
        <div {...stylex.props(styles.coverage)}>
          <p {...stylex.props(styles.coverageValue)}>{summary?.ready ?? 0}</p>
          <p {...stylex.props(styles.coverageLabel)}>
            of {summary?.total ?? clubs.length}{" "}
            {(summary?.total ?? clubs.length) === 1 ? "club has" : "clubs have"}{" "}
            a working administrator account.
          </p>
        </div>
      )}

      {isLoading ? null : summaryNote}
    </Panel>
  );
};

const AdminOverviewPage = () => {
  const search = activitySearch.parse(Route.useSearch());
  const writeSearch = activitySearch.write();

  const { onSearchChange, onSortingChange, onPaginationChange } =
    useTableCallbacks({ search, writeSearch });

  const clubsQuery = useQuery(orpc.adminUsers.clubs.queryOptions());
  /*
   * `.rows`, not the response: both list handlers answer with a page envelope
   * (`rows` plus `total`) because they are paginated. One page is enough here —
   * the roll-up covers configured clubs, of which there are as many as fit on one
   * screen — and an account beyond the limit would show as a club with no
   * administrator, which is the one wrong answer this page must not give.
   */
  const accountsQuery = useQuery(
    orpc.adminUsers.list.queryOptions({ input: { pageSize: 200 } })
  );
  const activityQuery = useQuery(
    orpc.adminClubs.activity.queryOptions({
      input: activitySearch.toListInput(search),
      placeholderData: keepPreviousData,
    })
  );

  const clubs = clubsQuery.data ?? [];
  const summary =
    clubsQuery.isPending || accountsQuery.isPending
      ? null
      : summarizeCoverage(clubs, accountsQuery.data?.rows ?? []);

  return (
    <ScreenWrap>
      <div {...stylex.props(styles.wrap)}>
        <CoveragePanel
          clubs={clubs}
          error={clubsQuery.error ?? accountsQuery.error}
          isLoading={clubsQuery.isPending || accountsQuery.isPending}
          summary={summary}
        />

        <ActivityTable
          emptyNote="Rotating a password, banning an account or reviewing a submission is recorded here."
          emptyTitle="No administrative activity yet."
          isError={activityQuery.isError}
          isFetching={activityQuery.isFetching}
          isLoading={activityQuery.isPending}
          note="Every credential change, ban and content decision, newest first. Open a club to see only its own."
          onPaginationChange={onPaginationChange}
          onSearchChange={onSearchChange}
          onSortingChange={onSortingChange}
          rows={activityQuery.data?.rows ?? []}
          search={search}
          title="Recent administrative activity"
          total={activityQuery.data?.total ?? 0}
        />
      </div>
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/admin/")({
  validateSearch: activitySearch.routeSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(orpc.adminUsers.clubs.queryOptions()),
      context.queryClient.ensureQueryData(
        orpc.adminUsers.list.queryOptions({ input: { pageSize: 200 } })
      ),
      context.queryClient.ensureQueryData(
        orpc.adminClubs.activity.queryOptions({
          input: activitySearch.toListInput(activitySearch.parse(deps)),
        })
      ),
    ]),
  head: () => ({
    meta: [
      { title: "Overview — Admin — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminOverviewPage,
});
