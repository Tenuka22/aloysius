import {
  CmsButton,
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
import { SecretDialog } from "@aloysius/ui/components/dialog";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { WorkspaceShell } from "@/components/workspace-shell";
import { client, orpc } from "@/utils/orpc";

interface GeneratedPassword {
  label: string;
  password: string;
  sessionsRevoked: number;
}

const SeatRow = ({
  seat,
  onGenerated,
}: {
  seat: {
    username: string;
    label: string;
    role: string | null;
    exists: boolean;
  };
  onGenerated: (generated: GeneratedPassword) => void;
}) => {
  const [error, setError] = useState<string | null>(null);

  const setPasswordMutation = useMutation(
    orpc.admin.setSeatPassword.mutationOptions({
      onSuccess: (data) => {
        setError(null);
        onGenerated({
          label: seat.label,
          password: data.newPassword,
          sessionsRevoked: data.sessionsRevoked,
        });
      },
      onError: (mutationError) => {
        setError(mutationError.message);
      },
    })
  );

  return (
    <RecordRow
      actions={
        <CmsButton
          disabled={!seat.exists || setPasswordMutation.isPending}
          onClick={() =>
            setPasswordMutation.mutate({ username: seat.username })
          }
        >
          {setPasswordMutation.isPending
            ? "Generating…"
            : "Generate new password"}
        </CmsButton>
      }
      meta={
        <>
          {seat.username}
          {seat.role ? ` · role: ${seat.role}` : ""}
          {!seat.exists && " · not created yet"}
          {error && (
            <span className="block text-red-700" role="alert">
              {error}
            </span>
          )}
        </>
      }
      name={seat.label}
    />
  );
};

const AdminContent = () => {
  const { user } = Route.useLoaderData();
  const { data: seats } = useSuspenseQuery(
    orpc.admin.listSeatAccounts.queryOptions()
  );
  const [generated, setGenerated] = useState<GeneratedPassword | null>(null);

  return (
    <WorkspaceShell
      brandName="Admin"
      mainId="admin-main"
      navItems={[
        {
          num: "01",
          href: "/admin",
          label: "Club & Seat Accounts",
          active: true,
        },
      ]}
      title="Administration"
      userName={user.username ?? "User"}
      userRole={user.role ?? "user"}
    >
      <ScreenWrap>
        <ScreenHead eyebrow="Administration" heading="Club & seat accounts" />
        <Panel>
          <PanelHead
            note="Generating a password replaces the seat's password immediately and signs it out everywhere. There is no field to type one in — every password here is generated, shown once, and never stored in the clear."
            title="Seats"
          />
          {seats.length === 0 ? (
            <Notice>No club seats are configured.</Notice>
          ) : (
            <RecordList label="Club accounts">
              {seats.map((seat) => (
                <SeatRow
                  key={seat.username}
                  onGenerated={setGenerated}
                  seat={seat}
                />
              ))}
            </RecordList>
          )}
        </Panel>
        <SecretDialog
          hint={
            generated
              ? `${generated.sessionsRevoked} session(s) were signed out. The seat now signs in with this password.`
              : undefined
          }
          onClose={() => setGenerated(null)}
          open={generated !== null}
          secret={generated?.password ?? ""}
          title={
            generated ? `New password for ${generated.label}` : "New password"
          }
        />
      </ScreenWrap>
    </WorkspaceShell>
  );
};

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    const session = await client.getSession();
    if (!session || session.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
    return { user: session.user };
  },
  loader: ({ context }) => ({ user: context.user }),
  component: AdminContent,
});
