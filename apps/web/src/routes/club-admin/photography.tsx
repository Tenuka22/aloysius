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
 * The Photography Club's own workspace - a *static* route, hand-typed into the
 * file tree rather than derived from a `$slug` parameter, for the same reason
 * `/admin/clubs/<slug>-club` used to be: a club's admin workspace exists
 * because someone wrote it, not because a dynamic route made every possible
 * slug an address someone could guess.
 *
 * This *is* the club portal that used to live at `/club` - merged here rather
 * than kept alongside it, because they were the same account doing the same
 * work at two different addresses. `/club` resolved "my club" from whoever
 * was signed in; this resolves it too, but then insists the answer is
 * `photography` specifically, which is the one guarantee a shared `/club`
 * route could never make: that this address is reachable by nobody except
 * this club's own administrator.
 *
 * Task order, not alphabetical: submit work, then watch what happened to it.
 * `My submissions` is last because it is the answer to "did that go through",
 * not a place to start. `Club profile` is first after the overview because it
 * is the only screen that changes how the club itself looks rather than what
 * it has published - the cover banner, which every other page then inherits.
 */
const CLUB_ADMIN_USERNAME = "photography-admin";

const NAV_ITEMS = [
  { num: "01", label: "Overview", href: "/club-admin/photography" },
  { num: "02", label: "Club profile", href: "/club-admin/photography/profile" },
  { num: "03", label: "Galleries", href: "/club-admin/photography/galleries" },
  { num: "04", label: "Events", href: "/club-admin/photography/events" },
  {
    num: "05",
    label: "Achievements",
    href: "/club-admin/photography/achievements",
  },
  {
    num: "06",
    label: "Announcements",
    href: "/club-admin/photography/announcements",
  },
  {
    num: "07",
    label: "My submissions",
    href: "/club-admin/photography/submissions",
  },
  { num: "08", label: "My account", href: "/club-admin/photography/account" },
] as const;

const isCurrentSection = (pathname: string, href: string) =>
  href === "/club-admin/photography"
    ? pathname === href
    : pathname.startsWith(href);

const PhotographyClubLayout = () => {
  const { user, club } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    active: isCurrentSection(pathname, item.href),
  }));

  return (
    <WorkspaceShell
      brandName={club?.name ?? "Photography Club"}
      brandSub="Club portal"
      eyebrow="Club"
      mainId="club-admin-main"
      navItems={navItems}
      title={club?.name ?? "Photography Club"}
      userName={user.name ?? user.username ?? "Club administrator"}
      userRole="Club administrator"
    >
      <Suspense fallback={<div>Loading…</div>}>
        <Outlet />
      </Suspense>
    </WorkspaceShell>
  );
};

export const Route = createFileRoute("/club-admin/photography")({
  /**
   * Two facts are checked, not one: signed in as *a* club administrator is
   * not the same fact as signed in as *this* club's administrator, and only
   * the second one earns this page. `MUST`: no other role, and no other
   * club's administrator, ever reaches this route - that is the whole reason
   * it moved off a URL a CMS admin could also open.
   */
  beforeLoad: async () => {
    const session = await client.getSession();
    if (
      session?.user?.role !== "club-admin" ||
      session.user.username !== CLUB_ADMIN_USERNAME
    ) {
      throw redirect({ to: "/" });
    }
    return { user: session.user };
  },
  loader: async ({ context }) => {
    const club = await client.clubs.myClub().catch(() => null);
    return { club, user: context.user };
  },
  head: () => ({
    meta: [
      { title: "Photography Club — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PhotographyClubLayout,
});
