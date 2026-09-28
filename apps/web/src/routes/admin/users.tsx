import {
  CmsButton,
  EmptyState,
  Field,
  FieldGrid,
  Notice,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import type { NoticeTone } from "@aloysius/ui/components/cms/cms-primitives";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { client, orpc } from "@/utils/orpc";

/**
 * Provisioning a club administrator.
 *
 * The account is the door: a club cannot submit content until it exists, and
 * the username is generated from the club configuration rather than typed, so
 * this page is a form with one decision in it - which club still needs an
 * account - and everything else is confirmation.
 */

const MIN_PASSWORD_LENGTH = 8;

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
  submitRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    marginBlockStart: space.md,
  },
  formNotice: {
    marginBlockStart: space.md,
  },
});

interface PageNotice {
  tone: NoticeTone;
  text: string;
}

interface ClubRow {
  id: string;
  name: string;
  adminUsername: string;
}

interface AccountRow {
  id: string;
  name: string;
  username: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
}

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

/* ---------------------------------------------------------- create panel */

const CreateAccountPanel = ({
  clubs,
  accounts,
  name,
  password,
  clubId,
  isPending,
  error,
  onName,
  onPassword,
  onClub,
  onSubmit,
}: {
  clubs: readonly ClubRow[];
  accounts: readonly AccountRow[];
  name: string;
  password: string;
  clubId: string;
  isPending: boolean;
  error: Error | null;
  onName: (next: string) => void;
  onPassword: (next: string) => void;
  onClub: (next: string) => void;
  onSubmit: () => void;
}) => {
  const hasAccount = (adminUsername: string) =>
    accounts.some((account) => account.username === adminUsername);

  const selectedClub = clubs.find((club) => club.id === clubId);
  // Provisioning twice is rejected by the API; catching it here means the
  // operator is told before they submit rather than after.
  const alreadyProvisioned = selectedClub
    ? hasAccount(selectedClub.adminUsername)
    : false;
  const canCreate =
    name.trim().length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    clubId.length > 0 &&
    !alreadyProvisioned;

  return (
    <Panel accent>
      <PanelHead
        note="Each club has exactly one administrator. The username is generated from the club and cannot be changed."
        title="Create a club administrator"
        titleId="create-account-heading"
      />

      <form
        aria-labelledby="create-account-heading"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <FieldGrid>
          <Field
            autoComplete="off"
            hint="Shown to the administrator on their first sign-in."
            label="Full name"
            onChange={onName}
            value={name}
          />
          <Field
            autoComplete="new-password"
            hint={`At least ${MIN_PASSWORD_LENGTH} characters. Share it with the administrator directly, not by email.`}
            kind="password"
            label="Initial password"
            onChange={onPassword}
            value={password}
          />
          <Field
            hint="Clubs that already have an administrator cannot be provisioned twice."
            kind="select"
            label="Club"
            onChange={onClub}
            options={[
              { label: "Select a club", value: "" },
              ...clubs.map((club) => ({
                label: hasAccount(club.adminUsername)
                  ? `${club.name} — account exists`
                  : `${club.name} — no account yet`,
                value: club.id,
              })),
            ]}
            value={clubId}
            wide
          />
        </FieldGrid>

        {alreadyProvisioned ? (
          <div {...stylex.props(styles.formNotice)}>
            <Notice tone="warning">
              {selectedClub?.name} already has an administrator. Reset that
              account&apos;s password below instead of creating a second one.
            </Notice>
          </div>
        ) : null}

        {error ? (
          <div {...stylex.props(styles.formNotice)}>
            <Notice tone="danger">
              {messageOf(error, "The account could not be created.")}
            </Notice>
          </div>
        ) : null}

        <div {...stylex.props(styles.submitRow)}>
          <CmsButton
            disabled={!canCreate || isPending}
            tone="primary"
            type="submit"
          >
            {isPending ? "Creating…" : "Create administrator"}
          </CmsButton>
        </div>
      </form>
    </Panel>
  );
};

/* ---------------------------------------------------------- rotate panel */

const RotatePasswordPanel = ({
  username,
  password,
  isSaving,
  onPassword,
  onSubmit,
  onCancel,
}: {
  username: string;
  password: string;
  isSaving: boolean;
  onPassword: (next: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) => (
  <Panel accent>
    <PanelHead
      note="The new password takes effect immediately. There is no confirmation step, so copy it before you close this panel."
      title={`Set a new password for @${username}`}
    />
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <FieldGrid>
        <Field
          autoComplete="new-password"
          autoFocus
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          kind="password"
          label="New password"
          onChange={onPassword}
          value={password}
          wide
        />
      </FieldGrid>
      <div {...stylex.props(styles.submitRow)}>
        <CmsButton
          disabled={isSaving || password.length < MIN_PASSWORD_LENGTH}
          tone="primary"
          type="submit"
        >
          {isSaving ? "Saving…" : "Save password"}
        </CmsButton>
        <CmsButton onClick={onCancel} tone="quiet">
          Cancel
        </CmsButton>
      </div>
    </form>
  </Panel>
);

/* --------------------------------------------------------- accounts panel */

const AccountsPanel = ({
  accounts,
  isLoading,
  error,
  rotating,
  onRotate,
}: {
  accounts: readonly AccountRow[];
  isLoading: boolean;
  error: Error | null;
  rotating: string | null;
  onRotate: (username: string) => void;
}) => {
  let body = (
    <EmptyState
      note="Pick a club above and create its administrator. Until then that club cannot sign in."
      title="No club accounts yet."
    />
  );

  if (isLoading) {
    body = <Notice tone="info">Loading accounts…</Notice>;
  } else if (accounts.length > 0) {
    body = (
      <RecordList label="Club accounts">
        {accounts.map((account) => {
          const { username } = account;

          return (
            <RecordRow
              actions={
                <>
                  <Pill tone={account.banned ? "danger" : "positive"}>
                    {account.banned ? "Banned" : "Active"}
                  </Pill>
                  {username ? (
                    <CmsButton
                      onClick={() => {
                        onRotate(username);
                      }}
                      tone="quiet"
                    >
                      Set password
                    </CmsButton>
                  ) : null}
                </>
              }
              key={account.id}
              meta={
                <>
                  <span>@{username ?? "no username"}</span>
                  <span aria-hidden="true">·</span>
                  <span>{account.role ?? "user"}</span>
                  {account.banReason ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{account.banReason}</span>
                    </>
                  ) : null}
                </>
              }
              name={account.name}
            />
          );
        })}
      </RecordList>
    );
  }

  const isRotatingMissing =
    rotating !== null &&
    !accounts.some((account) => account.username === rotating);

  return (
    <Panel>
      <PanelHead
        eyebrow="Accounts"
        note="Every club administrator that currently exists."
        title="Existing accounts"
      />

      {error ? (
        <Notice tone="danger">
          {messageOf(error, "The accounts could not be loaded.")}
        </Notice>
      ) : null}

      {body}

      {isRotatingMissing ? (
        <div {...stylex.props(styles.formNotice)}>
          <Notice tone="danger">
            That account is no longer in the list. Close the password panel
            above and reload the page.
          </Notice>
        </div>
      ) : null}
    </Panel>
  );
};

/* ------------------------------------------------------------------ page */

const UsersPage = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [clubId, setClubId] = useState("");
  const [rotating, setRotating] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isRotating, setIsRotating] = useState(false);
  const [notice, setNotice] = useState<PageNotice | null>(null);

  const clubsQuery = useQuery(orpc.adminUsers.clubs.queryOptions());
  const usersQuery = useQuery(orpc.adminUsers.list.queryOptions());
  const clubs = clubsQuery.data ?? [];
  const accounts = usersQuery.data ?? [];

  const createMutation = useMutation(
    orpc.adminUsers.create.mutationOptions({
      onSuccess: async (created) => {
        setName("");
        setPassword("");
        setClubId("");
        setNotice({
          tone: "success",
          text: `Administrator created. Sign in with @${created.username}.`,
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.adminUsers.list.key(),
        });
      },
    })
  );

  const rotatePassword = async () => {
    if (!rotating || newPassword.length < MIN_PASSWORD_LENGTH) {
      return;
    }
    setIsRotating(true);
    try {
      await client.adminUsers.rotatePassword({
        password: newPassword,
        username: rotating,
      });
      setNotice({
        tone: "success",
        text: `Password updated for @${rotating}.`,
      });
      setRotating(null);
      setNewPassword("");
      setIsRotating(false);
    } catch (error) {
      setNotice({
        tone: "danger",
        text: messageOf(error, "The password could not be updated."),
      });
      setIsRotating(false);
    }
  };

  return (
    <div {...stylex.props(styles.wrap)}>
      <div {...stylex.props(styles.lead)}>
        <h1 {...stylex.props(styles.leadTitle)}>Club accounts</h1>
        <p {...stylex.props(styles.leadNote)}>
          A club cannot submit content until it has an administrator. Create
          that account here, and reset its password whenever someone leaves.
        </p>
      </div>

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <CreateAccountPanel
        accounts={accounts}
        clubId={clubId}
        clubs={clubs}
        error={createMutation.error}
        isPending={createMutation.isPending}
        name={name}
        onClub={setClubId}
        onName={setName}
        onPassword={setPassword}
        onSubmit={() => {
          setNotice(null);
          createMutation.mutate({ clubId, name: name.trim(), password });
        }}
        password={password}
      />

      {rotating ? (
        <RotatePasswordPanel
          isSaving={isRotating}
          onCancel={() => {
            setRotating(null);
            setNewPassword("");
          }}
          onPassword={setNewPassword}
          onSubmit={() => {
            void rotatePassword();
          }}
          password={newPassword}
          username={rotating}
        />
      ) : null}

      <AccountsPanel
        accounts={accounts}
        error={usersQuery.error}
        isLoading={usersQuery.isPending}
        onRotate={(username) => {
          setNotice(null);
          setNewPassword("");
          setRotating(username);
        }}
        rotating={rotating}
      />
    </div>
  );
};

export const Route = createFileRoute("/admin/users")({
  beforeLoad: async () => {
    const session = await client.getSession();
    if (session?.user?.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Club accounts — Admin — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: UsersPage,
});
