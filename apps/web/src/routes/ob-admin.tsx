import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { createDb } from "@aloysius-web/db";
import { obMembers } from "@aloysius-web/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { OBAdminLayout } from "@/components-client/ob-admin-layout";

const requireOBAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated) {
    throw redirect({ to: "/", hash: "signin" });
  }

  if (!userId) {
    throw redirect({ to: "/" });
  }

  let email: string | null = null;
  try {
    const user = await clerkClient().users.getUser(userId);
    email =
      user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? null;
    email = email?.toLowerCase() ?? null;
  } catch {
    // fall through to the redirect below
  }

  const db = createDb();
  const adminMatch = email
    ? await db
        .select({ id: obMembers.id })
        .from(obMembers)
        .where(
          and(eq(obMembers.status, "approved"), sql`lower(${obMembers.adminEmail}) = ${email}`),
        )
        .limit(1)
        .get()
    : undefined;

  if (!adminMatch) {
    throw redirect({ to: "/ob" });
  }

  const row = await db.select().from(obMembers).where(eq(obMembers.userId, userId)).get();
  return { name: row?.name ?? "", year: row?.year ?? "" };
});

export const Route = createFileRoute("/ob-admin")({
  beforeLoad: async () => {
    await requireOBAdmin();
  },
  component: OBAdminLayout,
});
