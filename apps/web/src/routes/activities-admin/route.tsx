import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { createDb } from "@aloysius-web/db";
import { activities, clubMembers } from "@aloysius-web/db/schema";
import { eq, sql } from "drizzle-orm";

const requireAnyClubAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    throw redirect({ to: "/", hash: "signin" });
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

  const membershipRows = await db
    .select()
    .from(clubMembers)
    .where(eq(clubMembers.userId, userId))
    .all();

  const activityIds = membershipRows.map((r) => r.activityId);
  const allActivities =
    activityIds.length > 0
      ? await db.select().from(activities).where(sql`${activities.id} IN ${activityIds}`).all()
      : [];

  const activityMap = new Map(allActivities.map((a) => [a.id, a]));

  if (email) {
    const adminActivities = await db
      .select()
      .from(activities)
      .where(sql`lower(${activities.adminEmail}) = ${email}`)
      .all();
    for (const a of adminActivities) {
      if (activityMap.has(a.id)) continue;
      activityMap.set(a.id, a);
    }
  }

  const adminActivities = [...activityMap.values()].filter((a) => {
    const membership = membershipRows.find((r) => r.activityId === a.id);
    const isAdminByMembership = membership?.role === "admin" && membership?.status === "approved";
    const isAdminByEmail = !!email && !!a.adminEmail && email === a.adminEmail.toLowerCase();
    return isAdminByMembership || isAdminByEmail;
  });

  if (adminActivities.length === 0) {
    throw redirect({ to: "/clubs" });
  }

  const sorted = adminActivities.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  throw redirect({ to: "/activities-admin/$activityId", params: { activityId: sorted[0].id } });
});

export const Route = createFileRoute("/activities-admin")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/activities-admin" || location.pathname === "/activities-admin/") {
      await requireAnyClubAdmin();
    }
  },
});
