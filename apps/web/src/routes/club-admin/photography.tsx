import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { Suspense } from "react";

import Loader from "@/components/loader";
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
 * One section: submit photos straight into the review queue (`@aloysius/api`'s
 * `club` router - `createGallery` and its `listMyGalleries`/`withdrawGallery`
 * counterparts). Announcements, events and news posts are no longer
 * club-submitted content - they're created directly by the CMS
 * (`cms.createAnnouncement`/`createEvent`/`createNewsPost`), so this
 * club-admin workspace has nothing left to do for them. There is no
 * combined "my submissions" queue and no club-profile editor here any
 * more - galleries own their own screen and their own queue, the same
 * shape the CMS review side (`cms/galleries`) already reads.
 */
const CLUB_ADMIN_USERNAME = "photography-admin";

const BASE = "/club-admin/photography";

const BASE_NAV_ITEMS = [
  { num: "01", label: "Galleries", href: `${BASE}/galleries` },
] as const;

const PhotographyClubLayout = () => {
  const { user } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navItems = BASE_NAV_ITEMS.map((item) => ({
    ...item,
    active: pathname.startsWith(item.href),
  }));

  return (
    <WorkspaceShell
      brandName="Photography Club"
      brandSub="Club portal"
      eyebrow="Club"
      mainId="club-admin-main"
      navItems={navItems}
      title="Photography Club"
      userName={user.name ?? user.username ?? "Club administrator"}
      userRole="Club administrator"
    >
      <Suspense fallback={<Loader />}>
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
  loader: ({ context }) => ({ user: context.user }),
  head: () => ({
    meta: [
      { title: "Photography Club — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PhotographyClubLayout,
});
