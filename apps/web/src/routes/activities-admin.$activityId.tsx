import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { createDb } from "@aloysius-web/db";
import { activities, clubMembers } from "@aloysius-web/db/schema";
import { and, eq } from "drizzle-orm";
import { ActivitiesAdminLayout } from "@/components-client/activities-admin-layout";

const requireClubAdmin = createServerFn({ method: "GET" })
  .validator((data: { activityId: string }) => data)
  .handler(async ({ data }) => {
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
  }

  const db = createDb();
  const [activity, membership] = await Promise.all([
    db
      .select()
      .from(activities)
      .where(eq(activities.id, data.activityId))
      .get(),
    db
      .select()
      .from(clubMembers)
      .where(and(eq(clubMembers.activityId, data.activityId), eq(clubMembers.userId, userId)))
      .get(),
  ]);

  if (!activity) {
    throw redirect({ to: "/clubs" });
  }

  const isAdminByMembership = membership?.role === "admin" && membership?.status === "approved";
  const isAdminByEmail = !!email && !!activity.adminEmail && email === activity.adminEmail.toLowerCase();

  if (!isAdminByMembership && !isAdminByEmail) {
    throw redirect({ to: "/clubs" });
  }

  return {
    activityId: activity.id,
    activityName: activity.name,
    activityType: activity.type,
  };
});

export const Route = createFileRoute("/activities-admin/$activityId")({
  loader: async ({ params }) => {
    await requireClubAdmin({ data: { activityId: params.activityId } });
  },
  component: ActivitiesAdminLayout,
});


