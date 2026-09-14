import {
  createFileRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { authClient } from "@/lib/auth-client";

const AdminLayout = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();
  const userName = session.data?.user?.username ?? "User";
  const userRole = session.data?.user?.role ?? "user";

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
      title="Admin"
      navItems={navItems}
      userName={userName}
      userRole={userRole}
    >
      <Suspense fallback={<div>Loading…</div>}>
        <Outlet />
      </Suspense>
    </AdminShell>
  );
};

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});
