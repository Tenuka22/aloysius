import {
  createFileRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";

const CmsLayout = () => {
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
  ];

  return (
    <AdminShell
      title="Content Manager"
      navItems={navItems}
      userName="A. Perera"
      userRole="Editor — Media Unit"
    >
      <Suspense fallback={<div>Loading…</div>}>
        <Outlet />
      </Suspense>
    </AdminShell>
  );
};

export const Route = createFileRoute("/cms")({
  component: CmsLayout,
});
