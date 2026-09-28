import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";

import { WorkspaceShell } from "@/components/workspace-shell";
import { client } from "@/utils/orpc";

/**
 * Order is task order, not feature order: see the state of the estate, edit
 * content, then act on an account. `Club accounts` and `Set up an account` are
 * both about the same club administrator but from opposite ends - the first
 * works with an account that exists, the second creates the one that does not.
 */
const ADMIN_NAV_ITEMS = [
  { num: "01", label: "Overview", href: "/admin" },
  { num: "02", label: "Content", href: "/cms" },
  { num: "03", label: "Club accounts", href: "/admin/clubs" },
  { num: "04", label: "Set up an account", href: "/admin/users" },
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
