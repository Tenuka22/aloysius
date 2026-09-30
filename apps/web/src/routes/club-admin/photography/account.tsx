import {
  CmsButton,
  Notice,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ClubPage } from "@/components/club/page-parts";
import { client } from "@/utils/orpc";

/**
 * The club administrator's own credential.
 *
 * The rotate-or-create decision is one button, and the label says which of the
 * two it is about to do — the same call either way, because the API creates the
 * account if there isn't one and rotates it if there is. The only thing that
 * differs is what the operator should expect afterwards, and that belongs on
 * the button rather than behind a second confirmation step they have to
 * remember to look for.
 *
 * The generated password stays on screen until it is explicitly dismissed.
 * Regenerating used to replace it silently, so a password already copied or
 * written down stopped working with nothing on the page saying so.
 */

const styles = stylex.create({
  block: {
    display: "grid",
    justifyItems: "start",
    gap: space["2xs"],
    marginBlockStart: space.md,
  },
  inline: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
  },
  secret: {
    display: "grid",
    justifyItems: "start",
    gap: space["2xs"],
    marginBlockStart: space.md,
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
    letterSpacing: "0.01em",
    color: color.onSurface,
  },
  hint: {
    margin: 0,
    maxWidth: "40ch",
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
});

const AccountPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "success" | "danger" | "warning";
    text: string;
  } | null>(null);

  const issuePassword = async () => {
    setIsGenerating(true);
    setNotice(null);
    try {
      const result = await client.adminClubs.rotateMyPassword({});
      setPassword(result.password);
      setIsCopied(false);
    } catch (error) {
      setNotice({
        tone: "danger",
        text:
          error instanceof Error
            ? error.message
            : "A new password could not be issued.",
      });
    }
    setIsGenerating(false);
  };

  const copyPassword = async () => {
    if (!password) {
      return;
    }
    try {
      await navigator.clipboard.writeText(password);
      setIsCopied(true);
    } catch {
      setNotice({
        tone: "warning",
        text: "The browser blocked clipboard access. Select the password and copy it by hand.",
      });
    }
  };

  return (
    <ClubPage
      eyebrow="Club / Account"
      note="Your sign-in details for the club portal. There is one administrator per club, and this is it."
      title="My account"
    >
      <Panel accent>
        <PanelHead
          eyebrow="Access"
          note="A new password signs you out of every device and cannot be undone."
          title="Your password"
        />

        <RecordList label="Account">
          <RecordRow
            actions={<Pill tone="positive">Active</Pill>}
            key="self"
            meta={
              <span>
                You can create and edit your own club&apos;s content, and
                nothing else.
              </span>
            }
            name="Club administrator"
          />
        </RecordList>

        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

        {password ? (
          <div {...stylex.props(styles.secret)}>
            <p {...stylex.props(styles.secretLabel)}>Copy this password now</p>
            <code {...stylex.props(styles.secretValue)}>{password}</code>
            <p {...stylex.props(styles.hint)}>
              Four words and two digits, so it can be written down and typed
              back in. Shown once — if it is lost, set a new one.
            </p>
            <div {...stylex.props(styles.inline)}>
              <CmsButton
                onClick={() => {
                  void copyPassword();
                }}
                tone="primary"
              >
                {isCopied ? "Copied" : "Copy password"}
              </CmsButton>
              <CmsButton
                onClick={() => {
                  setPassword(null);
                  setIsCopied(false);
                }}
                tone="quiet"
              >
                Done
              </CmsButton>
            </div>
          </div>
        ) : (
          <div {...stylex.props(styles.block)}>
            <CmsButton
              disabled={isGenerating}
              onClick={() => {
                void issuePassword();
              }}
              tone="primary"
            >
              {isGenerating ? "Generating…" : "Set new password"}
            </CmsButton>
          </div>
        )}
      </Panel>
    </ClubPage>
  );
};

export const Route = createFileRoute("/club-admin/photography/account")({
  head: () => ({
    meta: [
      { title: "My account — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountPage,
});
