import {
  CmsLink,
  EmptyState,
  Notice,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import type { PillTone } from "@aloysius/ui/components/cms/cms-primitives";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  describeActivity,
  describeAuditTarget,
  formatAuditTime,
  submissionOutcome,
} from "@/components/admin/audit";
import { orpc } from "@/utils/orpc";

/**
 * The administration overview.
 *
 * `/admin/clubs` is scoped to one club at a time and will say nothing until a
 * club is picked, so it cannot answer "is anything unprovisioned?" on its own.
 * This page is the roll-up: every configured club, the state of its
 * administrator account, and the audit trail behind those states.
 */

const ACTIVITY_LIMIT = 10;

const styles = stylex.create({
  wrap: {
    display: "grid",
    gap: space.md,
    alignContent: "start",
  },
  lead: {
    display: "grid",
    gap: space["3xs"],
  },
  leadTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    textWrap: "balance",
  },
  leadNote: {
    margin: 0,
    maxWidth: "58ch",
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  /*
   * One figure, not a row of tiles. The only question this page has to answer
   * in its first second is "is anything unprovisioned", and a single number
   * leading a sentence settles it in one glance where a tile row would make the
   * operator read four of them.
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
  timestamp: {
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
    whiteSpace: "nowrap",
  },
  noticeStack: {
    display: "grid",
    gap: space["2xs"],
  },
  loading: {
    margin: 0,
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
});

/* ----------------------------------------------------------------- state */

type CoverageState = "provisioned" | "missing" | "banned";

const COVERAGE_STATE: Record<
  CoverageState,
  { label: string; tone: PillTone; note: string }
> = {
  provisioned: {
    label: "Provisioned",
    tone: "positive",
    note: "The administrator can sign in.",
  },
  missing: {
    label: "No account",
    tone: "warning",
    note: "No administrator has been created yet.",
  },
  banned: {
    label: "Banned",
    tone: "danger",
    note: "The account exists but cannot sign in.",
  },
};

interface ClubAccount {
  username: string | null;
  banned: boolean | null;
}

const coverageStateOf = (account: ClubAccount | undefined): CoverageState => {
  if (!account) {
    return "missing";
  }
  if (account.banned) {
    return "banned";
  }
  return "provisioned";
};

const errorText = (error: Error) =>
  `${error.message} Reload the page to try again.`;

const listNames = (names: readonly string[]) => {
  if (names.length <= 1) {
    return names[0] ?? "";
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
};

interface CoverageRow {
  club: { id: string; name: string; adminUsername: string };
  state: CoverageState;
}

interface CoverageSummary {
  rows: CoverageRow[];
  ready: number;
  gapNames: string[];
  /**
   * Club-admin accounts whose username matches no configured club. Config
   * drift, not a user mistake: they can sign in and then edit nothing.
   */
  orphanHandles: string[];
}

/**
 * The whole roll-up in one pass over each list. Every figure on this page comes
 * out of here, so "1 of 1 clubs has an account" can never disagree with the
 * ledger printed underneath it.
 */
const summarizeCoverage = (
  clubs: readonly { id: string; name: string; adminUsername: string }[],
  accounts: readonly ClubAccount[]
): CoverageSummary => {
  const rows: CoverageRow[] = [];
  const gapNames: string[] = [];
  const configured = new Set(clubs.map((club) => club.adminUsername));
  let ready = 0;

  // Indexed by username: one lookup per club instead of a scan of every
  // account, and the orphan pass below reuses the same key set.
  const byUsername = new Map<string, ClubAccount>();
  for (const account of accounts) {
    const { username } = account;
    if (username !== null) {
      byUsername.set(username, account);
    }
  }

  for (const club of clubs) {
    const state = coverageStateOf(byUsername.get(club.adminUsername));
    rows.push({ club, state });
    if (state === "provisioned") {
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

  return { rows, ready, gapNames, orphanHandles };
};

/* --------------------------------------------------------------- panels */

const CoveragePanel = ({
  clubs,
  loading,
  error,
  summary,
}: {
  clubs: readonly { id: string; name: string }[];
  loading: boolean;
  error: Error | null;
  summary: CoverageSummary;
}) => {
  const navigate = useNavigate();
  const { rows, ready, gapNames, orphanHandles } = summary;

  if (loading) {
    return (
      <Panel accent>
        <PanelHead eyebrow="Club access" title="Account coverage" />
        <p {...stylex.props(styles.loading)}>Loading club accounts…</p>
      </Panel>
    );
  }

  return (
    <Panel accent>
      <PanelHead
        eyebrow="Club access"
        note="A club can only submit content once its administrator account exists and is not banned."
        title="Account coverage"
      />

      {error ? <Notice tone="danger">{errorText(error)}</Notice> : null}

      <div {...stylex.props(styles.coverage)}>
        <p {...stylex.props(styles.coverageValue)}>{ready}</p>
        <p {...stylex.props(styles.coverageLabel)}>
          of {clubs.length} {clubs.length === 1 ? "club has" : "clubs have"} a
          working administrator account.
        </p>
      </div>

      <div {...stylex.props(styles.noticeStack)}>
        {gapNames.length === 0 ? (
          <Notice tone="success">
            Every configured club has an administrator account, and none of them
            are banned.
          </Notice>
        ) : (
          <Notice tone="warning">
            {listNames(gapNames)} {gapNames.length === 1 ? "needs" : "need"}{" "}
            attention before {gapNames.length === 1 ? "its" : "their"} editors
            can sign in.
          </Notice>
        )}

        {orphanHandles.length > 0 ? (
          <Notice tone="warning">
            {orphanHandles.length === 1
              ? "One account matches"
              : `${orphanHandles.length} accounts match`}{" "}
            no club in the configuration: {orphanHandles.join(", ")}.{" "}
            {orphanHandles.length === 1 ? "It" : "They"} can sign in but have
            nothing to edit.
          </Notice>
        ) : null}
      </div>

      <RecordList label="Club account coverage">
        {rows.map((row) => {
          const state = COVERAGE_STATE[row.state];
          const needsAccount = row.state === "missing";
          // Always `/admin/clubs`, including for a club with no account yet: the
          // issue-credential action there creates the account when there is none
          // and rotates it when there is, so there is nothing a separate
          // provisioning screen would have to add.
          const target = "/admin/clubs";

          return (
            <RecordRow
              actions={
                <>
                  <Pill tone={state.tone}>{state.label}</Pill>
                  <CmsLink
                    href={target}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate({ to: target });
                    }}
                    tone="quiet"
                  >
                    {needsAccount ? "Create account" : "Manage"}
                  </CmsLink>
                </>
              }
              key={row.club.id}
              meta={
                <>
                  <span>@{row.club.adminUsername}</span>
                  <span aria-hidden="true">·</span>
                  <span>{state.note}</span>
                </>
              }
              name={row.club.name}
            />
          );
        })}
      </RecordList>
    </Panel>
  );
};

const ActivityPanel = ({
  entries,
  loading,
  error,
}: {
  entries: readonly {
    id: string;
    action: string;
    targetType: string;
    targetId: string | null;
    actorUsername: string | null;
    createdAt: Date;
  }[];
  loading: boolean;
  error: Error | null;
}) => {
  let body = (
    <EmptyState
      note="Rotating a password, banning an account or reviewing a submission is recorded here."
      title="No administrative activity yet."
    />
  );

  if (loading) {
    body = <p {...stylex.props(styles.loading)}>Loading activity…</p>;
  } else if (entries.length > 0) {
    body = (
      <RecordList label="Recent administrative activity">
        {entries.map((entry) => {
          const outcome = submissionOutcome(entry.action);

          return (
            <RecordRow
              actions={
                <>
                  {outcome ? (
                    <Pill tone={outcome.tone}>{outcome.label}</Pill>
                  ) : null}
                  <time
                    dateTime={new Date(entry.createdAt).toISOString()}
                    {...stylex.props(styles.timestamp)}
                  >
                    {formatAuditTime(entry.createdAt)}
                  </time>
                </>
              }
              key={entry.id}
              meta={describeAuditTarget(entry)}
              name={describeActivity(entry.action)}
            />
          );
        })}
      </RecordList>
    );
  }

  return (
    <Panel>
      <PanelHead
        eyebrow="Audit trail"
        note="Credential rotations, bans and content decisions, newest first."
        title="Recent administrative activity"
      />

      {error ? <Notice tone="danger">{errorText(error)}</Notice> : null}

      {body}
    </Panel>
  );
};

/* ------------------------------------------------------------------ page */

const AdminOverviewPage = () => {
  const clubsQuery = useQuery(orpc.adminUsers.clubs.queryOptions());
  const accountsQuery = useQuery(
    orpc.adminUsers.list.queryOptions({ input: { pageSize: 200 } })
  );
  const activityQuery = useQuery(
    orpc.adminClubs.activity.queryOptions({ input: { limit: ACTIVITY_LIMIT } })
  );

  const clubs = clubsQuery.data ?? [];
  /*
   * `.rows`, not the response: both list handlers answer with a page envelope
   * (`rows` plus `total`) because they are paginated. One page is enough here —
   * the roll-up covers configured clubs, of which there are as many as fit on one
   * screen — and an account beyond the limit would show as a club with no
   * administrator, which is the one wrong answer this page must not give.
   */
  const accounts = accountsQuery.data?.rows ?? [];
  const summary = summarizeCoverage(clubs, accounts);

  return (
    <div {...stylex.props(styles.wrap)}>
      <div {...stylex.props(styles.lead)}>
        <h1 {...stylex.props(styles.leadTitle)}>Overview</h1>
        <p {...stylex.props(styles.leadNote)}>
          Every club runs on exactly one administrator account. This is where
          you see which clubs have theirs, and who last changed a credential.
        </p>
      </div>

      <CoveragePanel
        clubs={clubs}
        error={clubsQuery.error}
        loading={clubsQuery.isPending || accountsQuery.isPending}
        summary={summary}
      />

      <ActivityPanel
        entries={activityQuery.data?.rows ?? []}
        error={activityQuery.error}
        loading={activityQuery.isPending}
      />
    </div>
  );
};

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Overview — Admin — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminOverviewPage,
});
