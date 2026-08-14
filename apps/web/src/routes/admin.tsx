import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { AdminLayout } from "@/components-client/admin-layout";

const requireAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { isAuthenticated, sessionClaims } = await auth();

  if (!isAuthenticated) {
    throw redirect({ to: "/", hash: "signin" });
  }

  const role = (sessionClaims as any)?.metadata?.role;

  if (role !== "admin") {
    throw redirect({ to: "/" });
  }

  return { role };
});

export const Route = createFileRoute("/admin")({
  beforeLoad: () => requireAdmin(),
  component: AdminLayout,
});
