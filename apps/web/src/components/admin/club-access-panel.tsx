import {
  CmsButton,
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
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { formatAuditTime } from "@/components/admin/audit";
import type { ClubDetail } from "@/components/tables/list-types";
import { client, orpc } from "@/utils/orpc";

/**
 * One club's administrator account, and the three things an administrator can do
 * to it.
 *
 * ## Create and rotate are one button because they are one call
 *
 * `adminClubs.rotatePassword` creates the account when there is none and rotates
 * the password when there is. Two buttons would have meant the caller deciding
 * which of the two it was about to do, from data the server has already decided;
 * one button whose *label* says which is about to happen is the honest version,
 * and the label is derived from the row the server sent.
 *
 * ## The password stays on screen until it is dismissed
 *
 * Regenerating used to replace it silently: press the button twice and the
 * password already copied or written down stops working, with nothing on the
 * page saying so. The block below only leaves when the operator says it has.
 *
 * ## Why the imperative client rather than `useMutation`
 *
 * The response carries a one-time secret. A mutation's result is written into the
 * query cache, and a password sitting in a cache is a password that survives the
 * component, the navigation and the Back button. So this calls the client
 * directly and keeps the secret in component state.
 */

const styles = stylex.create({
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    marginBlockStart: space.sm,
  },
  /*
   * A one-time secret. Heavier than a notice on purpose: it is the only thing on
   * this screen the operator has to write down before it is gone for good, and a
   * phrase they can retype is the whole reason it is a phrase.
   */
  secret: {
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
  secretLabel: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: "#7a5400",
  },
  secretValue: {
    margin: 0,
    overflowWrap: "anywhere",
    fontFamily: font.mono,
    fontSize: font.sizeXl,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    // A little tracking so four words and two digits read as groups rather than
    // as one run of characters.
    letterSpacing: "0.01em",
    color: color.onSurface,
    // Tabular figures and wrapping hyphenation: the digits are the part people
    // mistype, and the line has to be able to break on the hyphens.
    hyphens: "auto",
  },
  secretHint: {
    margin: 0,
    maxWidth: "44ch",
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
});

interface Secret {
  password: string;
  isCopied: boolean;
}

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const accountState = (club: ClubDetail): { label: string; tone: PillTone } => {
  if (club.banned) {
    return { label: "Banned", tone: "danger" };
  }
  if (!club.provisioned) {
    return { label: "No account yet", tone: "warning" };
  }
  return { label: "Can sign in", tone: "positive" };
};

/**
 * The one button, and its label says which of the two things it is about to do.
 *
 * The API does both from the same call, so the label is the only place the
 * difference is visible, and it has to be honest about it: an operator should be
 * able to read the row and know what pressing it will do.
 */
const credentialActionLabel = (provisioned: boolean) =>
  provisioned ? "Set new password" : "Create account";

const accountMeta = (club: ClubDetail) => {
  const created = club.accountCreatedAt
    ? `created ${formatAuditTime(club.accountCreatedAt)}`
    : "never created";

  return (
    <>
      <span>@{club.adminUsername}</span>
      <span aria-hidden="true">·</span>
      <span>account {created}</span>
      {club.banned && club.banReason ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{club.banReason}</span>
        </>
      ) : null}
    </>
  );
};

export interface ClubAccessPanelProps {
  club: ClubDetail;
  /**
   * Called after a change that alters the account row, so the page can re-read
   * the club. Banning and provisioning both change facts the row is built from,
   * and a table row that says "banned" over a still-active account is the exact
   * kind of disagreement this page exists to prevent.
   */
  onChanged: () => Promise<void> | void;
}

export const ClubAccessPanel = ({ club, onChanged }: ClubAccessPanelProps) => {
  const queryClient = useQueryClient();
  const [banReason, setBanReason] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<{
    tone: NoticeTone;
    text: string;
  } | null>(null);
  const [secret, setSecret] = useState<Secret | null>(null);

  const state = accountState(club);

  /** Both reads the page makes after a change, so nothing on it goes stale. */
  const refresh = async () => {
    // The path prefix, not the full key: a rotation changes the row this club is
    // on and the count on every page of the table it came from.
    await queryClient.invalidateQueries({
      queryKey: orpc.adminClubs.clubAccounts.key().slice(0, 1),
    });
    await onChanged();
  };

  const issueCredential = async () => {
    setIsBusy(true);
    setNotice(null);
    try {
      const result = await client.adminClubs.rotatePassword({
        username: club.adminUsername,
      });
      setSecret({ isCopied: false, password: result.password });
      setNotice({
        tone: "success",
        text: club.provisioned
          ? `New password issued for @${club.adminUsername}.`
          : `Account created for @${club.adminUsername}.`,
      });
      await refresh();
    } catch (error) {
      setNotice({
        tone: "danger",
        text: messageOf(error, "A new password could not be issued."),
      });
    }
    setIsBusy(false);
  };

  const copyPassword = async () => {
    if (!secret) {
      return;
    }
    try {
      await navigator.clipboard.writeText(secret.password);
      setSecret({ ...secret, isCopied: true });
    } catch {
      setSecret({ ...secret, isCopied: false });
      setNotice({
        tone: "warning",
        text: "The browser blocked clipboard access. Select the password and copy it by hand.",
      });
    }
  };

  const setBanned = async (banned: boolean) => {
    setIsBusy(true);
    setNotice(null);
    try {
      const request = banned
        ? client.adminClubs.ban({
            clubId: club.id,
            reason: banReason.trim() || undefined,
          })
        : client.adminClubs.unban({ clubId: club.id });
      await request;
      setBanReason("");
      setNotice({
        tone: "success",
        text: banned
          ? `@${club.adminUsername} can no longer sign in.`
          : `@${club.adminUsername} can sign in again.`,
      });
      await refresh();
    } catch (error) {
      setNotice({
        tone: "danger",
        text: messageOf(
          error,
          banned
            ? "The account could not be banned."
            : "The ban could not be lifted."
        ),
      });
    }
    setIsBusy(false);
  };

  return (
    <Panel accent>
      <PanelHead
        eyebrow="Access"
        note="One administrator per club. Everything here is written to the audit trail below."
        title="Administrator account"
      />

      <RecordList label="Club administrator">
        <RecordRow
          actions={<Pill tone={state.tone}>{state.label}</Pill>}
          key={club.id}
          meta={accountMeta(club)}
          name={`${club.name} administrator`}
        />
      </RecordList>

      <Field
        hint="Kept with the ban in the audit trail, so the reason is readable later."
        label="Reason for a ban"
        onChange={setBanReason}
        value={banReason}
        wide
      />

      <div {...stylex.props(styles.actions)}>
        <CmsButton
          disabled={isBusy}
          onClick={() => {
            void issueCredential();
          }}
          tone="primary"
        >
          {isBusy ? "Working…" : credentialActionLabel(club.provisioned)}
        </CmsButton>

        {club.banned ? (
          <CmsButton
            disabled={isBusy}
            onClick={() => {
              void setBanned(false);
            }}
            tone="primary"
          >
            Let them sign in again
          </CmsButton>
        ) : (
          <CmsButton
            disabled={isBusy || !club.provisioned}
            onClick={() => {
              void setBanned(true);
            }}
            tone="danger"
          >
            Ban from signing in
          </CmsButton>
        )}
      </div>

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      {secret ? (
        <div {...stylex.props(styles.secret)}>
          <p {...stylex.props(styles.secretLabel)}>
            Password for @{club.adminUsername}
          </p>
          <code {...stylex.props(styles.secretValue)}>{secret.password}</code>
          <p {...stylex.props(styles.secretHint)}>
            Four words and two digits, so it can be written down and typed back
            in. Shown once — if it is lost, set a new one.
          </p>
          <div {...stylex.props(styles.actions)}>
            <CmsButton
              onClick={() => {
                void copyPassword();
              }}
              tone="primary"
            >
              {secret.isCopied ? "Copied" : "Copy password"}
            </CmsButton>
            <CmsButton onClick={() => setSecret(null)} tone="quiet">
              Done
            </CmsButton>
          </div>
        </div>
      ) : null}
    </Panel>
  );
};
