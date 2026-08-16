import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute("/activities-admin/$activityId/members")({
  component: ActivityAdminMembers,
});

