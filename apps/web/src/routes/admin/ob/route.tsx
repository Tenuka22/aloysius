"use client";

import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ob")({
  component: AdminOBLayout,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin/ob" || location.pathname === "/admin/ob/") {
      throw redirect({ to: "/admin/ob/members" });
    }
  },
});

function AdminOBLayout() {
  return <Outlet />;
}
