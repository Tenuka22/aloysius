import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { client } from "@/utils/orpc";

const CmsLayout = () => {
  const { user } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const navItems = [
    {
      num: "01",
      label: "Dashboard",
      href: "/cms",
      active: pathname === "/cms",
    },
    {
      num: "02",
      label: "Homepage Editor",
      href: "/cms/homepage",
      active: pathname.startsWith("/cms/homepage"),
    },
    {
      num: "03",
      label: "Principal's Message",
      href: "/cms/principal",
      active: pathname.startsWith("/cms/principal"),
    },
    {
      num: "04",
      label: "About Editor",
      href: "/cms/about",
      active: pathname.startsWith("/cms/about"),
    },
    {
      num: "05",
      label: "News Editor",
      href: "/cms/news",
      active: pathname.startsWith("/cms/news"),
    },
    {
      num: "06",
      label: "Notices Editor",
      href: "/cms/notices",
      active: pathname.startsWith("/cms/notices"),
    },
    {
      num: "07",
      label: "Contact Editor",
      href: "/cms/contact",
      active: pathname.startsWith("/cms/contact"),
    },
    {
      num: "08",
      label: "Alumni Editor",
      href: "/cms/alumni",
      active: pathname.startsWith("/cms/alumni"),
    },
    {
      num: "09",
      label: "Media Editor",
      href: "/cms/media",
      active: pathname.startsWith("/cms/media"),
    },
    {
      num: "10",
      label: "Students Editor",
      href: "/cms/students",
      active: pathname.startsWith("/cms/students"),
    },
  ];

  return (
    <AdminShell
      navItems={navItems}
      title="Content Manager"
      userName={user.username ?? "User"}
      userRole={user.role ?? "user"}
    >
      <Suspense fallback={<div>Loading…</div>}>
        <Outlet />
      </Suspense>
    </AdminShell>
  );
};

export const Route = createFileRoute("/cms")({
  /**
   * Gated on the server: `beforeLoad` runs before any child loader or render,
   * both during SSR and on client-side navigation, so an unauthorized visitor
   * is redirected before the CMS shell ever mounts - no `authClient.useSession()`
   * polling, no "Checking permissions…" flash while the client catches up.
   */
  beforeLoad: async () => {
    const session = await client.getSession();
    const role = session?.user?.role;
    const isAllowed = role === "admin" || role === "cms";
    if (!session || !isAllowed) {
      throw redirect({ to: "/" });
    }
    return { user: session.user };
  },
  loader: ({ context }) => ({ user: context.user }),
  component: CmsLayout,
});
