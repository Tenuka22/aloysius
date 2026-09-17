import { createFileRoute, redirect } from "@tanstack/react-router";

import { client } from "@/utils/orpc";

export const Route = createFileRoute("/student-officer")({
  beforeLoad: async () => {
    const session = await client.getSession();
    const role = session?.user?.role;
    const isAllowed = role === "admin" || role === "teacher";
    if (!session || !isAllowed) {
      throw redirect({ to: "/" });
    }
    // Redirect to new unified teacher dashboard
    throw redirect({ to: "/teacher" });
  },
});
