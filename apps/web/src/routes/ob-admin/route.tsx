import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getServerSession } from "@/utils/auth";
import { createDb } from "@aloysius-web/db";
import { obMembers } from "@aloysius-web/db/schema";
import { eq } from "drizzle-orm";
import { OBAdminLayout } from "@/components-client/ob-admin-layout";

const OB_ADMIN_ROLE = "ob:admin";

const requireOBAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user) {
    throw redirect({ to: "/auth/$path", params: { path: "sign-in" } });
  }

  if (user.role !== OB_ADMIN_ROLE) {
    throw redirect({ to: "/ob" });
  }

  const db = createDb();
  const row = await db.select().from(obMembers).where(eq(obMembers.userId, user.id)).get();
  return { name: row?.name ?? "", year: row?.year ?? "" };
});

export const Route = createFileRoute("/ob-admin")({
  beforeLoad: async () => {
    await requireOBAdmin();
  },
  component: OBAdminLayout,
});
