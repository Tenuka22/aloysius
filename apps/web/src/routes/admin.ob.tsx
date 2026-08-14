"use client";

import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ob")({
  component: AdminOBLayout,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin/ob" || location.pathname === "/admin/ob/") {
      throw new Navigate({ to: "/admin/ob/members" });
    }
  },
});

function AdminOBLayout() {
  return <Outlet />;
}
