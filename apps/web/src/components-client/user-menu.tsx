"use client";

import { useQuery } from "@tanstack/react-query";
import { Show, useAuth } from "@clerk/tanstack-react-start";
import { IconSettings, IconShieldCheck, IconUserShield, IconUsers } from "@tabler/icons-react";
import { client } from "@/utils/orpc";

/** Shared pill style for navbar admin / membership links on the dark-green header. */
const pillClass =
  "inline-flex items-center gap-1.5 rounded-md border border-gold/40 text-gold px-3 py-1.5 text-[12px] font-bold tracking-wider transition-colors hover:bg-gold hover:text-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-green-dark active:scale-[0.97]";

function AdminLink() {
  const { sessionClaims } = useAuth();
  const role = sessionClaims?.metadata?.role;

  if (role !== "admin") return null;

  return (
    <a href="/admin" title="Site admin panel" className={pillClass}>
      <IconSettings className="size-3.5" aria-hidden="true" />
      Admin
    </a>
  );
}

/** Shown in the navbar when the signed-in user belongs to one or more clubs.
 *  If they are a club admin (of one or more clubs) the link is labeled
 *  "Club Admin" so they know /clubs is their management entry point. */
function MyClubsLink() {
  const { isSignedIn } = useAuth();

  const { data } = useQuery({
    queryKey: ["clubs", "my"],
    queryFn: () => client.clubs.myClubs(),
    enabled: isSignedIn,
    staleTime: 60_000,
  });

  if (!isSignedIn || !data || data.length === 0) return null;

  const isClubAdmin = data.some((c) => c.membership.isAdmin === true);

  return (
    <a
      href="/clubs"
      title={isClubAdmin ? "Manage your club(s) as admin" : "Your clubs"}
      className={pillClass}
    >
      {isClubAdmin ? (
        <IconShieldCheck className="size-3.5" aria-hidden="true" />
      ) : (
        <IconUsers className="size-3.5" aria-hidden="true" />
      )}
      {isClubAdmin ? "Club Admin" : "My Clubs"}
    </a>
  );
}

/** Shown in the navbar when the signed-in user is the designated OB admin.
 *  Links to the OB admin panel (/ob-admin). */
function OBAdminLink() {
  const { isSignedIn } = useAuth();

  const { data } = useQuery({
    queryKey: ["ob-my-membership"],
    queryFn: () => client.ob.obMembers.myMembership(),
    enabled: isSignedIn,
    staleTime: 60_000,
  });

  if (!isSignedIn || data?.isAdmin !== true) return null;

  return (
    <a href="/ob-admin" title="Old Boys' admin panel" className={pillClass}>
      <IconUserShield className="size-3.5" aria-hidden="true" />
      OB
    </a>
  );
}

export function UserMenu() {
  return (
    <Show when="signed-in">
      <div className="flex items-center gap-2">
        <MyClubsLink />
        <OBAdminLink />
        <AdminLink />
      </div>
    </Show>
  );
}
