import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { client } from "@/utils/orpc";

const TeacherOfficerLayout = () => {
  const { user } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const navItems = [
    {
      num: "01",
      label: "Dashboard",
      href: "/teacher-officer",
      active: pathname === "/teacher-officer",
    },
    {
      num: "02",
      label: "My Class",
      href: "/teacher-officer/class",
      active: pathname.startsWith("/teacher-officer/class"),
    },
    {
      num: "03",
      label: "Enter Marks",
      href: "/teacher-officer/marks",
      active: pathname.startsWith("/teacher-officer/marks"),
    },
  ];

  return (
    <AdminShell
      navItems={navItems}
      title="Teacher Officer"
      userName={user.username ?? "User"}
      userRole={user.role ?? "user"}
    >
      <Suspense fallback={<div>Loading…</div>}>
        <Outlet />
      </Suspense>
    </AdminShell>
  );
};

export const Route = createFileRoute("/teacher-officer")({
  beforeLoad: async () => {
    const session = await client.getSession();
    const role = session?.user?.role;
    const isAllowed = role === "admin" || role === "teacherOfficer";
    if (!session || !isAllowed) {
      throw redirect({ to: "/" });
    }
    return { user: session.user };
  },
  loader: ({ context }) => ({ user: context.user }),
  component: TeacherOfficerLayout,
});
