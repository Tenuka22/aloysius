import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getServerSession } from "@/utils/auth";
import { createDb } from "@aloysius-web/db";
import { activities, clubMembers } from "@aloysius-web/db/schema";
import { and, eq } from "drizzle-orm";
import { activityAdminEmail } from "@aloysius-web/auth";
import { ActivitiesAdminLayout } from "@/components-client/activities-admin-layout";

const requireClubAdmin = createServerFn({ method: "GET" })
  .validator((data: { activityId: string }) => data)
  .handler(async ({ data }) => {
    const session = await getServerSession();
    const currentUser = session?.user;

    if (!currentUser) {
      throw redirect({ to: "/auth/$path", params: { path: "sign-in" } });
    }

    const db = createDb();
    const email = currentUser.email?.toLowerCase() ?? null;

    const [activity, membership] = await Promise.all([
      db
        .select()
        .from(activities)
        .where(eq(activities.id, data.activityId))
        .get(),
      db
        .select()
        .from(clubMembers)
        .where(
          and(eq(clubMembers.activityId, data.activityId), eq(clubMembers.userId, currentUser.id)),
        )
        .get(),
    ]);

    if (!activity) {
      throw redirect({ to: "/clubs" });
    }

    const isAdminByMembership = membership?.role === "admin" && membership?.status === "approved";
    const isAdminByEmail =
      !!email &&
      (!!activity.adminEmail && email === activity.adminEmail.toLowerCase()) ||
      (!!email && !!activity.slug && email === activityAdminEmail(activity.slug));

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
