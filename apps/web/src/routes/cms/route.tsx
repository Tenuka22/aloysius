import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { Suspense, useEffect } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { authClient } from "@/lib/auth-client";

const CmsLayout = () => {
  const session = authClient.useSession();
  const role = session.data?.user?.role;
  const isAllowed = role === "admin" || role === "cms";

  useEffect(() => {
    if (!session.isPending && session.data && !isAllowed) {
      throw redirect({ to: "/" });
    }
  }, [isAllowed, session.data, session.isPending]);

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

  if (session.isPending || !session.data || !isAllowed) {
    return <div>Checking permissions…</div>;
  }

  return (
    <AdminShell
      title="Content Manager"
      navItems={navItems}
      userName={session.data.user.username ?? "User"}
      userRole={session.data.user.role ?? "user"}
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
