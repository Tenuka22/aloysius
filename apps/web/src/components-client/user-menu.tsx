"use client";

import { useQuery } from "@tanstack/react-query";
import { Show, useAuth } from "@clerk/tanstack-react-start";
import { IconSettings, IconShieldCheck, IconUserShield, IconUsers } from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";

/** Shared pill style for navbar admin / membership links on the dark-green header.
 *  Icon-only by design: with up to 8 nav links plus Admissions, spelling out
 *  "Admin"/"OB"/"My Clubs" here would overflow narrower widths. The icon +
 *  title/aria-label carries the meaning instead. */
const pillClass =
  "inline-flex size-9 items-center justify-center rounded-md border border-gold/40 text-gold transition-colors hover:bg-gold hover:text-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-green-dark active:scale-[0.97]";

function AdminLink() {
  const { sessionClaims } = useAuth();
  const role = sessionClaims?.metadata?.role;

  if (role !== "admin") return null;

  return (
    <a href="/admin" title="Site admin panel" aria-label="Site admin panel" className={pillClass}>
      <IconSettings className="size-4" aria-hidden="true" />
    </a>
  );
}

/** Shown in the navbar when the signed-in user belongs to one or more clubs.
 *  If they are a club admin (of one or more clubs) the icon and tooltip change
 *  so they know /activities-admin is their management entry point. */
function MyClubsLink() {
  const { isSignedIn } = useAuth();

  const { data } = useQuery(
    orpc.clubs.myClubs.queryOptions({
      enabled: isSignedIn,
      staleTime: 60_000,
    }),
  );

  if (!isSignedIn || !data || data.length === 0) return null;

  const isClubAdmin = data.some((c) => c.membership.isAdmin === true);
  const label = isClubAdmin ? "Manage your club(s) as admin" : "Your clubs";

  return (
    <a href="/activities-admin" title={label} aria-label={label} className={pillClass}>
      {isClubAdmin ? (
        <IconShieldCheck className="size-4" aria-hidden="true" />
      ) : (
        <IconUsers className="size-4" aria-hidden="true" />
      )}
    </a>
  );
}

/** Shown in the navbar when the signed-in user is the designated OB admin.
 *  Links to the OB admin panel (/ob-admin). */
function OBAdminLink() {
  const { isSignedIn } = useAuth();

  const { data } = useQuery(
    orpc.ob.obMembers.myMembership.queryOptions({
      enabled: isSignedIn,
      staleTime: 60_000,
    }),
  );

  if (!isSignedIn || data?.isAdmin !== true) return null;

  return (
    <a
      href="/ob-admin"
      title="Old Boys' admin panel"
      aria-label="Old Boys' admin panel"
      className={pillClass}
    >
      <IconUserShield className="size-4" aria-hidden="true" />
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
