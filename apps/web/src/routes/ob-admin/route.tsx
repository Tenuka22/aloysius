import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getServerSession } from "@/utils/auth";
import { createDb } from "@aloysius-web/db";
import { obMembers, siteSettings } from "@aloysius-web/db/schema";
import { eq } from "drizzle-orm";
import { OBAdminLayout } from "@/components-client/ob-admin-layout";

const OB_ADMIN_EMAIL_KEY = "ob_admin_email";

const requireOBAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user) {
    throw redirect({ to: "/auth/$path", params: { path: "sign-in" } });
  }

  const email = user.email?.toLowerCase() ?? null;

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

  const row = await db.select().from(obMembers).where(eq(obMembers.userId, user.id)).get();
  return { name: row?.name ?? "", year: row?.year ?? "" };
});

export const Route = createFileRoute("/ob-admin")({
  beforeLoad: async () => {
    await requireOBAdmin();
  },
  component: OBAdminLayout,
});
