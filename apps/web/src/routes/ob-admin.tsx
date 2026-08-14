import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { createDb } from "@aloysius-web/db";
import { obMembers } from "@aloysius-web/db/schema";
import { eq } from "drizzle-orm";
import { OBAdminLayout } from "@/components-client/ob-admin-layout";

const requireOBAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated) {
    throw redirect({ to: "/", hash: "signin" });
  }

  if (!userId) {
    throw redirect({ to: "/" });
  }

  // Only an approved OB member whose row carries the admin email is an OB admin.
  const db = createDb();
  const row = await db.select().from(obMembers).where(eq(obMembers.userId, userId)).get();
  if (!row || row.status !== "approved" || !row.adminEmail) {
    throw redirect({ to: "/ob" });
  }

  return { name: row.name, year: row.year };
});

export const Route = createFileRoute("/ob-admin")({
  beforeLoad: async ({ location }) => {
    await requireOBAdmin();
    if (location.pathname === "/ob-admin" || location.pathname === "/ob-admin/") {
      throw redirect({ to: "/ob-admin/members" });
    }
  },
  component: OBAdminLayout,
});
