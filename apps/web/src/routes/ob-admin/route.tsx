import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { createDb } from "@aloysius-web/db";
import { obMembers, siteSettings } from "@aloysius-web/db/schema";
import { eq } from "drizzle-orm";
import { OBAdminLayout } from "@/components-client/ob-admin-layout";

const OB_ADMIN_EMAIL_KEY = "ob_admin_email";

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
  const setting = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, OB_ADMIN_EMAIL_KEY))
    .get();
  const adminEmail = setting?.value?.trim().toLowerCase();
  const isMatch = !!email && !!adminEmail && email === adminEmail;

  if (!isMatch) {
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
