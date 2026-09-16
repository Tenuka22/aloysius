import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { client } from "@/utils/orpc";

const StudentOfficerLayout = () => {
  const { user } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const navItems = [
    {
      num: "01",
      label: "Dashboard",
      href: "/student-officer",
      active: pathname === "/student-officer",
    },
    {
      num: "02",
      label: "Students",
      href: "/student-officer/students",
      active: pathname.startsWith("/student-officer/students"),
    },
    {
      num: "03",
      label: "Class Assignments",
      href: "/student-officer/assignments",
      active: pathname.startsWith("/student-officer/assignments"),
    },
  ];

  return (
    <AdminShell
      navItems={navItems}
      title="Student Officer"
      userName={user.username ?? "User"}
      userRole={user.role ?? "user"}
    >
      <Suspense fallback={<div>Loading…</div>}>
        <Outlet />
      </Suspense>
    </AdminShell>
  );
};

export const Route = createFileRoute("/student-officer")({
  beforeLoad: async () => {
    const session = await client.getSession();
    const role = session?.user?.role;
    const isAllowed = role === "admin" || role === "studentOfficer";
    if (!session || !isAllowed) {
      throw redirect({ to: "/" });
    }
    return { user: session.user };
  },
  loader: ({ context }) => ({ user: context.user }),
  component: StudentOfficerLayout,
});
