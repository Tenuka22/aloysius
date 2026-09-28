import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { Suspense } from "react";

import { WorkspaceShell } from "@/components/workspace-shell";
import { client } from "@/utils/orpc";

/**
 * The club administrator's workspace.
 *
 * A third surface alongside `/cms` and `/admin`, because a club administrator
 * belongs to neither: the CMS gate admits `admin` and `cms`, the admin gate
 * admits `admin` only. Before this existed a club administrator who signed in
 * was redirected straight back to the public homepage with no way in.
 *
 * Task order, not alphabetical: submit work, then watch what happened to it.
 * `My submissions` is last because it is the answer to "did that go through",
 * not a place to start.
 */
/**
 * Task order, not alphabetical: set up the club, write content, then watch what
 * happened to it. `My submissions` is last because it is the answer to "did that
 * go through", not a place to start.
 *
 * `Club profile` is first after the overview because it is the only screen that
 * changes how the club itself looks rather than what it has published - the
 * cover banner, which every other page then inherits.
 */
const CLUB_NAV_ITEMS = [
  { num: "01", label: "Overview", href: "/club" },
  { num: "02", label: "Club profile", href: "/club/profile" },
  { num: "03", label: "Galleries", href: "/club/galleries" },
  { num: "04", label: "Events", href: "/club/events" },
  { num: "05", label: "Achievements", href: "/club/achievements" },
  { num: "06", label: "Announcements", href: "/club/announcements" },
  { num: "07", label: "My submissions", href: "/club/submissions" },
  { num: "08", label: "My account", href: "/club/account" },
] as const;

const isCurrentSection = (pathname: string, href: string) =>
  href === "/" ? pathname === href : pathname.startsWith(href);

const ClubLayout = () => {
  const { user, club } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navItems = CLUB_NAV_ITEMS.map((item) => ({
    ...item,
    active: isCurrentSection(pathname, item.href),
  }));

  return (
    <WorkspaceShell
      brandName={club?.name ?? "Club"}
      brandSub="Club portal"
      eyebrow="Club"
      mainId="club-main"
      navItems={navItems}
      title={club?.name ?? "Club portal"}
      userName={user.name ?? user.username ?? "Club administrator"}
      userRole="Club administrator"
    >
      <Suspense fallback={<div>Loading…</div>}>
        <Outlet />
      </Suspense>
    </WorkspaceShell>
  );
};

export const Route = createFileRoute("/club")({
  /**
   * Gated on the server, like the other two workspaces: `beforeLoad` runs
   * before any child loader or render, on the server and on client navigation
   * alike, so an unauthorized visitor is turned away before the club shell ever
   * mounts - no "Checking permissions…" flash while the client catches up.
   */
  beforeLoad: async () => {
    const session = await client.getSession();
    if (session?.user?.role !== "club-admin") {
      throw redirect({ to: "/" });
    }
    return { user: session.user };
  },
  loader: async ({ context }) => {
    // The club is resolved from the signed-in username, never from a param, so
    // this cannot be pointed at another club. A failure here is a layout that
    // still renders - the nav is right and the pages report the error - rather
    // than a blank screen.
    const club = await client.clubs.myClub().catch(() => null);
    return { club, user: context.user };
  },
  head: () => ({
    meta: [
      { title: "Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ClubLayout,
});
