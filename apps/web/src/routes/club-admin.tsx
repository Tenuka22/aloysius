import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";

import { WorkspaceShell } from "@/components/workspace-shell";
import { client } from "@/utils/orpc";

/**
 * The shell around every per-club admin page.
 *
 * `/admin/clubs` is the queue every club is reviewed through together; a page
 * under here is the same review, scoped to one club that the school has
 * charged with something beyond its own content - the club id and the nav
 * entry below both exist because someone wrote the page, not because a
 * dynamic parameter matched a slug. Adding the next one is a nav entry here
 * and a file next to `club-admin/photography.tsx`.
 *
 * Gated the same way `/admin` is, and on purpose: everything on these pages is
 * a CMS decision (approve, reject, manage the club's own account), so the
 * guard is the CMS editor's role, not the club's.
 */
const CLUB_ADMIN_NAV_ITEMS = [
  { num: "01", label: "Photography Club", href: "/club-admin/photography" },
] as const;

const isCurrentSection = (pathname: string, href: string) =>
  pathname.startsWith(href);

const ClubAdminContent = () => {
  const { user } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navItems = CLUB_ADMIN_NAV_ITEMS.map((item) => ({
    ...item,
    active: isCurrentSection(pathname, item.href),
  }));

  return (
    <WorkspaceShell
      brandName="Club admin"
      brandSub="Per-club review"
      eyebrow="Administration"
      mainId="club-admin-main"
      navItems={navItems}
      title="Club Admin"
      userName={user.name ?? user.username ?? "Admin"}
      userRole={user.role ?? "admin"}
    >
      <Outlet />
    </WorkspaceShell>
  );
};

export const Route = createFileRoute("/club-admin")({
  beforeLoad: async () => {
    const session = await client.getSession();
    if (session?.user?.role !== "admin") {
      throw redirect({ to: "/" });
    }
    return { user: session.user };
  },
  loader: ({ context }) => ({ user: context.user }),
  head: () => ({
    meta: [
      { title: "Club Admin — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ClubAdminContent,
});
