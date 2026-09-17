import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { client } from "@/utils/orpc";

const TeacherLayout = () => {
  const { user } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const navItems = [
    {
      num: "01",
      label: "Dashboard",
      href: "/teacher",
      active: pathname === "/teacher",
    },
    {
      num: "02",
      label: "My Classes",
      href: "/teacher/classes",
      active: pathname.startsWith("/teacher/classes"),
    },
    {
      num: "03",
      label: "Enter Marks",
      href: "/teacher/marks",
      active: pathname.startsWith("/teacher/marks"),
    },
  ];

  return (
    <AdminShell
      navItems={navItems}
      title="Teacher"
      userName={user.username ?? "User"}
      userRole={user.role ?? "user"}
    >
      <Suspense fallback={<div>Loading…</div>}>
        <Outlet />
      </Suspense>
    </AdminShell>
  );
};

export const Route = createFileRoute("/teacher")({
  beforeLoad: async () => {
    const session = await client.getSession();
    const role = session?.user?.role;
    const isAllowed = role === "admin" || role === "teacher";
    if (!session || !isAllowed) {
      throw redirect({ to: "/" });
    }
    return { user: session.user };
  },
  loader: ({ context }) => ({ user: context.user }),
  component: TeacherLayout,
});
