import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";

import { WorkspaceShell } from "@/components/workspace-shell";
import { client } from "@/utils/orpc";

/**
 * Order is task order, not feature order: see the state of the estate, then
 * edit content, then act on an account.
 *
 * There used to be a fourth page, `Set up an account`, for provisioning the
 * club administrator that does not exist yet. It is gone because `/admin/clubs`
 * already covers both directions: `adminClubs.rotatePassword` creates the
 * account when there is none and rotates it when there is, so the second screen
 * was the same work with a second set of rules - and worse, it decided whether a
 * club needed an account by listing accounts *by role*, so a username that
 * existed under any other role read as "no account yet" and the submit failed
 * with "a user with that username already exists". One screen, one source of
 * truth for whether an account exists.
 */
const ADMIN_NAV_ITEMS = [
  { num: "01", label: "Overview", href: "/admin" },
  { num: "02", label: "Content", href: "/cms" },
  { num: "03", label: "Club accounts", href: "/admin/clubs" },
] as const;

const isCurrentSection = (pathname: string, href: string) =>
  href === "/" ? pathname === href : pathname.startsWith(href);

const AdminContent = () => {
  const { user } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navItems = ADMIN_NAV_ITEMS.map((item) => ({
    ...item,
    active: isCurrentSection(pathname, item.href),
  }));

  return (
    <WorkspaceShell
      brandName="Admin"
      mainId="admin-main"
      navItems={navItems}
      title="Admin Panel"
      eyebrow="Administration"
      userName={user.name ?? user.username ?? "Admin"}
      userRole={user.role ?? "admin"}
    >
      <Outlet />
    </WorkspaceShell>
  );
};

export const Route = createFileRoute("/admin")({
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
      { title: "Admin — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminContent,
});
