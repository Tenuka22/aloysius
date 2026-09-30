import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { client } from "@/utils/orpc";

/**
 * The `/club-admin` namespace - a bare gate, not a shell.
 *
 * Every page under here is one club's own workspace, hand-typed at
 * `/club-admin/<slug>` the same way `photography.tsx` is: each one owns its
 * own nav and its own second check (signed in as *this* club's
 * administrator, not merely *a* club administrator). This layout exists only
 * to turn away every other role before any of those child routes load - the
 * coarse half of the gate, checked once here instead of once per club.
 */
export const Route = createFileRoute("/club-admin")({
  beforeLoad: async () => {
    const session = await client.getSession();
    if (session?.user?.role !== "club-admin") {
      throw redirect({ to: "/" });
    }
  },
  component: Outlet,
});
