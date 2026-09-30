import {
  CmsButton,
  EmptyState,
  Notice,
  Panel,
  PanelHead,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { client } from "@/utils/orpc";

/**
 * Issuing and rotating one club administrator's credential.
 *
 * Extracted from the photography page so the page body reads as the task order
 * (queue, access, history) rather than as three panels of form state. The
 * password is shown once and copied from here; the warning that it is not
 * shown again is the reason the copy button sits beside the value rather than
 * in a menu.
 */

const CLUB_SLUG = "photography";

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const styles = stylex.create({
  generated: {
    display: "grid",
    justifyItems: "start",
    gap: space["2xs"],
    marginBlockStart: space.sm,
    padding: space.sm,
    borderRadius: "8px",
    backgroundColor: color.surfaceRaised,
  },
  generatedLabel: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeSm,
    fontWeight: font.weightSemibold,
    color: color.onSurface,
  },
  generatedValue: {
    fontFamily: font.mono,
    fontSize: font.sizeLg,
    color: color.onSurface,
    wordBreak: "break-all",
  },
});

export const CredentialPanel = ({
  adminQuery,
  onDecided,
}: {
  adminQuery: {
    data:
      | readonly {
          id: string;
          name: string;
          username: string | null;
          banned: boolean | null;
          banReason: string | null;
        }[]
      | undefined;
    error: Error | null;
  };
  onDecided: (message: string) => void;
}) => {
  const [generated, setGenerated] = useState<{
    password: string | null;
    username: string | null;
  }>({ password: null, username: null });

  const rotate = useMutation({
    mutationFn: () =>
      client.adminClubs.rotatePassword({
        username: `${CLUB_SLUG}-admin`,
      }),
    onSuccess: (result) => {
      setGenerated({
        password: result.password,
        username: `${CLUB_SLUG}-admin`,
      });
      onDecided("New password issued. Copy it now — it is not shown again.");
    },
    onError: (error) => {
      onDecided(messageOf(error, "A new password could not be issued."));
    },
  });

  const administrator = adminQuery.data?.[0];

  return (
    <Panel>
      <PanelHead
        eyebrow="Access"
        note="Four words and two digits, so it can be written down and typed back in. Shown once — if it is lost, set a new one."
        title="Administrator credential"
      />

      {adminQuery.error ? (
        <Notice tone="danger">
          {messageOf(
            adminQuery.error,
            "The club administrator could not be loaded."
          )}
        </Notice>
      ) : null}

      {administrator ? (
        <RecordList label="Administrator account">
          <RecordRow
            key={administrator.id}
            meta={
              <>
                <span>@{administrator.username ?? "no username"}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {administrator.banned
                    ? `banned — ${administrator.banReason ?? "no reason recorded"}`
                    : "in good standing"}
                </span>
              </>
            }
            name={administrator.name}
          />
        </RecordList>
      ) : (
        <EmptyState
          note="No account has been provisioned yet. Issue a password to create it."
          title="No administrator yet."
        />
      )}

      <div style={{ marginBlockStart: "0.75rem" }}>
        <CmsButton
          disabled={rotate.isPending}
          onClick={() => {
            rotate.mutate();
          }}
          tone="primary"
        >
          {rotate.isPending
            ? "Issuing…"
            : administrator
              ? "Set a new password"
              : "Issue the first password"}
        </CmsButton>
      </div>

      {generated.password && generated.username ? (
        <div {...stylex.props(styles.generated)}>
          <p {...stylex.props(styles.generatedLabel)}>
            Password for @{generated.username}
          </p>
          <code {...stylex.props(styles.generatedValue)}>
            {generated.password}
          </code>
        </div>
      ) : null}
    </Panel>
  );
};
