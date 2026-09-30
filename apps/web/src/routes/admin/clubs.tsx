import {
  CmsButton,
  EmptyState,
  Field,
  Notice,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import type {
  NoticeTone,
  PillTone,
} from "@aloysius/ui/components/cms/cms-primitives";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import {
  describeActivity,
  describeAuditTarget,
  formatAuditTime,
  submissionOutcome,
} from "@/components/admin/audit";
import { authClient } from "@/lib/auth-client";
import { client, orpc } from "@/utils/orpc";

/**
 * One club's administrator account.
 *
 * Two roles land here. A club administrator sees only their own account and
 * can rotate their own password; a site administrator picks a club and manages
 * its credential. Both are the same screen because the work is the same - the
 * difference is only how wide the account scope is.
 */

interface CredentialState {
  generatedFor: string | null;
  generatedPassword: string | null;
  isGenerating: boolean;
  notice: { tone: NoticeTone; text: string } | null;
  rotatingUsername: string | null;
  copied: boolean;
}

const INITIAL_CREDENTIAL_STATE: CredentialState = {
  generatedFor: null,
  generatedPassword: null,
  isGenerating: false,
  notice: null,
  rotatingUsername: null,
  copied: false,
};

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
  block: {
    display: "grid",
    gap: space["2xs"],
    marginBlockStart: space.sm,
  },
  /*
   * A one-time secret. Heavier than a notice on purpose: it is the only thing
   * on this screen the operator has to write down before it is gone for good,
   * and a phrase they can retype is the whole reason it is a phrase.
   */
  generated: {
    display: "grid",
    justifyItems: "start",
    gap: space["2xs"],
    marginBlockStart: space.sm,
    padding: space.sm,
    backgroundColor: "rgba(255, 178, 3, 0.14)",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: "rgba(122, 84, 0, 0.35)",
  },
  generatedLabel: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: "#7a5400",
  },
  generatedValue: {
    margin: 0,
    overflowWrap: "anywhere",
    fontFamily: font.mono,
    fontSize: font.sizeXl,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    // A little tracking so four words and two digits read as groups rather
    // than as one run of characters.
    letterSpacing: "0.01em",
    color: color.onSurface,
    // Tabular figures and wrapping hyphenation: the digits are the part people
    // mistype, and the line has to be able to break on the hyphens.
    hyphens: "auto",
  },
  generatedHint: {
    margin: 0,
    maxWidth: "40ch",
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
  timestamp: {
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
    whiteSpace: "nowrap",
  },
});

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

interface AccountState {
  banned: boolean | null;
  provisioned?: boolean;
}

const accountState = ({
  banned,
  provisioned,
}: AccountState): { label: string; tone: PillTone } => {
  if (banned) {
    return { label: "Banned", tone: "danger" };
  }
  if (provisioned === false) {
    return { label: "No credential", tone: "warning" };
  }
  return { label: "Active", tone: "positive" };
};

/**
 * One button, and its label says which of the two things it is about to do.
 *
 * The API does both from the same call — it creates the account if there isn't
 * one and rotates the password if there is — so the label is the only place the
 * difference is visible, and it has to be honest about it. An operator should
 * be able to read the row and know what pressing it will do.
 */
const credentialActionLabel = (provisioned: boolean | undefined) => {
  if (!provisioned) {
    return "Create account";
  }
  return "Set new password";
};

const accountNoteFor = (isClubAdmin: boolean, hasSelection: boolean) => {
  if (isClubAdmin) {
    return "Your account is scoped to your club. Only a site administrator can see another club.";
  }
  if (hasSelection) {
    return "Account access is scoped to the selected club.";
  }
  return "Choose a club to see its administrator.";
};

/**
 * A club administrator's own account query returns one row, the site
 * administrator's returns every row for the selected club. Normalised to a
 * list here so the panel below has a single shape to render.
 */
const membersFor = (
  isClubAdmin: boolean,
  ownAccount: ClubAccountRow | undefined | null,
  clubAccounts: readonly ClubAccountRow[] | undefined
): ClubAccountRow[] => {
  if (isClubAdmin) {
    return ownAccount ? [ownAccount] : [];
  }
  return [...(clubAccounts ?? [])];
};

/* -------------------------------------------------------- account panel */

interface ClubAccountRow {
  id: string;
  name: string;
  username: string | null;
  role: string | null;
  banned: boolean | null;
  provisioned?: boolean;
}

const AdministratorPanel = ({
  isClubAdmin,
  hasSelection,
  isLoading,
  error,
  members,
  credential,
  onIssue,
  onCopy,
  onDismiss,
}: {
  isClubAdmin: boolean;
  hasSelection: boolean;
  isLoading: boolean;
  error: Error | null;
  members: readonly ClubAccountRow[];
  credential: CredentialState;
  /** Issues a credential for this username: creates the account, or rotates. */
  onIssue: (username: string) => void;
  onCopy: () => void;
  /** Clears a password that has already been copied or written down. */
  onDismiss: () => void;
}) => {
  const accountNote = accountNoteFor(isClubAdmin, hasSelection);

  let body = (
    <EmptyState
      note={
        isClubAdmin
          ? "This account has no credential yet. Ask a site administrator to provision it."
          : "Pick a club above to see who administers it."
      }
      title="No administrator to show."
    />
  );

  if (isLoading) {
    body = <Notice tone="info">Loading the administrator…</Notice>;
  } else if (members.length > 0) {
    body = (
      <RecordList label="Club administrator">
        {members.map((member) => {
          const state = accountState(member);
          const { username } = member;
          const isWorking =
            credential.isGenerating && credential.rotatingUsername === username;

          return (
            <RecordRow
              actions={
                <>
                  <Pill tone={state.tone}>{state.label}</Pill>
                  {username ? (
                    <CmsButton
                      disabled={credential.isGenerating}
                      onClick={() => {
                        onIssue(username);
                      }}
                      tone="quiet"
                    >
                      {isWorking
                        ? "Working…"
                        : credentialActionLabel(member.provisioned)}
                    </CmsButton>
                  ) : null}
                </>
              }
              key={member.id}
              meta={
                <>
                  <span>@{username ?? "no username"}</span>
                  <span aria-hidden="true">·</span>
                  <span>{member.role ?? "user"}</span>
                </>
              }
              name={member.name}
            />
          );
        })}
      </RecordList>
    );
  }

  return (
    <Panel>
      <PanelHead
        eyebrow="Access"
        note={accountNote}
        title="Club administrator"
      />

      {error ? (
        <Notice tone="danger">
          {messageOf(error, "The club administrator could not be loaded.")}
        </Notice>
      ) : null}

      {body}

      {/*
       * The one-time secret. It stays on screen until it is explicitly
       * dismissed, because regenerating used to replace it silently: press the
       * button twice and the password already copied or written down stops
       * working, with nothing on the page saying so. The warning below is the
       * replacement for that surprise.
       */}
      {credential.generatedFor && credential.generatedPassword ? (
        <div {...stylex.props(styles.generated)}>
          <p {...stylex.props(styles.generatedLabel)}>
            Password for @{credential.generatedFor}
          </p>
          <code {...stylex.props(styles.generatedValue)}>
            {credential.generatedPassword}
          </code>
          <p {...stylex.props(styles.generatedHint)}>
            Four words and two digits, so it can be written down and typed back
            in. Shown once — if it is lost, set a new one.
          </p>
          <div {...stylex.props(styles.block)}>
            <CmsButton onClick={onCopy} tone="primary">
              {credential.copied ? "Copied" : "Copy password"}
            </CmsButton>
            <CmsButton onClick={onDismiss} tone="quiet">
              Done
            </CmsButton>
          </div>
        </div>
      ) : null}
    </Panel>
  );
};

/* ------------------------------------------------------- activity panel */

const ActivityPanel = ({
  entries,
  isLoading,
  error,
  hasSelection,
}: {
  entries:
    | readonly {
        id: string;
        action: string;
        targetType: string;
        targetId: string | null;
        actorUsername: string | null;
        createdAt: Date;
      }[]
    | undefined;
  isLoading: boolean;
  error: Error | null;
  hasSelection: boolean;
}) => {
  let body = (
    <EmptyState
      note="Choose a club above to see who has changed its credentials."
      title="No club selected."
    />
  );

  if (isLoading) {
    body = <Notice tone="info">Loading activity…</Notice>;
  } else if (!hasSelection) {
    body = (
      <EmptyState
        note="Choose a club above to see who has changed its credentials."
        title="No club selected."
      />
    );
  } else if (entries && entries.length > 0) {
    body = (
      <RecordList label="Administrator activity">
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
  } else {
    body = (
      <EmptyState
        note="Rotating a password, banning an account or reviewing a submission is recorded here."
        title="No administrator activity yet."
      />
    );
  }

  return (
    <Panel>
      <PanelHead
        eyebrow="Audit trail"
        note="Credential changes, bans, unbans, and account actions are recorded here."
        title="Administrator activity"
      />

      {error ? (
        <Notice tone="danger">
          {messageOf(error, "The activity trail could not be loaded.")}
        </Notice>
      ) : null}

      {body}
    </Panel>
  );
};

/* ------------------------------------------------------------------ page */

const AdminClubsPage = () => {
  const navigate = useNavigate();
  const [clubId, setClubId] = useState("");
  const [credential, setCredential] = useState<CredentialState>(
    INITIAL_CREDENTIAL_STATE
  );
  const { data: session } = authClient.useSession();
  const isClubAdmin = session?.user?.role === "club-admin";
  const clubsQuery = useQuery(orpc.adminClubs.list.queryOptions());
  const adminQuery = useQuery(
    orpc.adminClubs.admin.queryOptions({
      input: { clubId },
      enabled: clubId.length > 0,
    })
  );
  const myAccountQuery = useQuery(
    orpc.adminClubs.myAccount.queryOptions({ enabled: isClubAdmin })
  );
  const activityQuery = useQuery(
    orpc.adminClubs.activity.queryOptions({
      input: { clubId: clubId || undefined, limit: 100 },
      enabled: !isClubAdmin && clubId.length > 0,
    })
  );
  const myActivityQuery = useQuery(
    orpc.adminClubs.myActivity.queryOptions({
      input: { limit: 100 },
      enabled: isClubAdmin,
    })
  );

  const accountQuery = isClubAdmin ? myAccountQuery : adminQuery;
  const activityQueryForRole = isClubAdmin ? myActivityQuery : activityQuery;
  const hasSelection = isClubAdmin || clubId.length > 0;
  const members = membersFor(isClubAdmin, myAccountQuery.data, adminQuery.data);

  /**
   * One call does the right thing for whichever state the account is in: the
   * API creates the credential when there is no account and rotates it when
   * there is, so the button above never has to branch.
   */
  const issueCredential = async (target: string) => {
    setCredential((current) => ({
      ...current,
      isGenerating: true,
      notice: null,
      rotatingUsername: target,
    }));
    try {
      const result = isClubAdmin
        ? await client.adminClubs.rotateMyPassword({})
        : await client.adminClubs.rotatePassword({ username: target });
      setCredential({
        generatedFor: target,
        generatedPassword: result.password,
        isGenerating: false,
        notice: {
          tone: "success",
          text: `New password issued for @${target}. Copy it now — it is not shown again.`,
        },
        rotatingUsername: null,
        copied: false,
      });
    } catch (error) {
      setCredential((current) => ({
        ...current,
        isGenerating: false,
        notice: {
          tone: "danger",
          text: messageOf(error, "A new password could not be issued."),
        },
        rotatingUsername: null,
      }));
    }
  };

  const copyPassword = async () => {
    const password = credential.generatedPassword;
    if (!password) {
      return;
    }
    try {
      await navigator.clipboard.writeText(password);
      setCredential((current) => ({ ...current, copied: true }));
    } catch {
      setCredential((current) => ({
        ...current,
        copied: false,
        notice: {
          tone: "warning",
          text: "The browser blocked clipboard access. Select the password and copy it by hand.",
        },
      }));
    }
  };

  return (
    <div {...stylex.props(styles.wrap)}>
      <div {...stylex.props(styles.lead)}>
        <h1 {...stylex.props(styles.leadTitle)}>Club accounts</h1>
        <p {...stylex.props(styles.leadNote)}>
          Issue and rotate the credentials a club administrator signs in with.
          Every rotation is written to the audit trail below.
        </p>
      </div>

      {isClubAdmin ? null : (
        <Panel>
          <PanelHead
            eyebrow="Dedicated pages"
            note="Per-club review pages, hand-typed routes rather than a dynamic parameter, so a club has no page until one is written for it."
            title="Photography Club"
          />
          <CmsButton
            onClick={() => {
              void navigate({ to: "/club-admin/photography" });
            }}
            tone="primary"
          >
            Open /club-admin/photography
          </CmsButton>
        </Panel>
      )}

      <Panel accent>
        <PanelHead
          eyebrow="Club administration"
          note={
            isClubAdmin
              ? "Your account is scoped to your club. Only a site administrator can see another club."
              : "Manage the single administrator account for a club."
          }
          title={isClubAdmin ? "Your account" : "Choose a club"}
        />
        {isClubAdmin ? null : (
          <Field
            hint="Everything below is scoped to this club."
            kind="select"
            label="Club"
            onChange={(next) => {
              setClubId(next);
              setCredential(INITIAL_CREDENTIAL_STATE);
            }}
            options={[
              { label: "Select a club", value: "" },
              ...(clubsQuery.data?.map((club) => ({
                label: club.name,
                value: club.id,
              })) ?? []),
            ]}
            value={clubId}
          />
        )}
        {credential.notice ? (
          <Notice tone={credential.notice.tone}>
            {credential.notice.text}
          </Notice>
        ) : null}
      </Panel>

      <AdministratorPanel
        credential={credential}
        error={accountQuery.error}
        hasSelection={hasSelection}
        isClubAdmin={isClubAdmin}
        isLoading={accountQuery.isPending && hasSelection}
        members={members}
        onCopy={() => {
          void copyPassword();
        }}
        onDismiss={() => {
          setCredential(INITIAL_CREDENTIAL_STATE);
        }}
        onIssue={(username) => {
          void issueCredential(username);
        }}
      />

      <ActivityPanel
        entries={activityQueryForRole.data}
        error={activityQueryForRole.error}
        hasSelection={hasSelection}
        isLoading={activityQueryForRole.isPending && hasSelection}
      />
    </div>
  );
};

export const Route = createFileRoute("/admin/clubs")({
  beforeLoad: async () => {
    const session = await client.getSession();
    if (
      session?.user?.role !== "admin" &&
      session?.user?.role !== "club-admin"
    ) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Club accounts — Admin — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminClubsPage,
});
