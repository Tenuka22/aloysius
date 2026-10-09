import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/club-admin/photography/")({
  beforeLoad: () => {
    throw redirect({ to: "/club-admin/photography/galleries" });
  },
});
