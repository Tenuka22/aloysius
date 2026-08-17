import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getServerSession } from "@/utils/auth";
import { AdminLayout } from "@/components-client/admin-layout";

const requireAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user) {
    throw redirect({ to: "/auth/$path", params: { path: "sign-in" } });
  }

  if (user.role !== "admin") {
    throw redirect({ to: "/" });
  }

  return { role: user.role };
});

export const Route = createFileRoute("/admin")({
  beforeLoad: () => requireAdmin(),
  component: AdminLayout,
});
