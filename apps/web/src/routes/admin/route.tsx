import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { client } from "@/utils/orpc";

const AdminLayout = () => {
  const { user } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const navItems = [
    {
      num: "01",
      label: "Dashboard",
      href: "/admin",
      active: pathname === "/admin",
    },
    {
      num: "02",
      label: "Staff",
      href: "/admin/staff",
      active: pathname.startsWith("/admin/staff"),
    },
  ];

  return (
    <AdminShell
      navItems={navItems}
      title="Admin"
      userName={user.username ?? "User"}
      userRole={user.role ?? "user"}
    >
      <Suspense fallback={<div>Loading…</div>}>
        <Outlet />
      </Suspense>
    </AdminShell>
  );
};

export const Route = createFileRoute("/admin")({
  /**
   * Gated on the server, same as `/cms`: `beforeLoad` runs before any child
   * loader or render, so an unauthorized visitor is redirected before the
   * admin shell ever mounts.
   */
  beforeLoad: async () => {
    const session = await client.getSession();
    if (!session || session.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
    return { user: session.user };
  },
  loader: ({ context }) => ({ user: context.user }),
  component: AdminLayout,
});
