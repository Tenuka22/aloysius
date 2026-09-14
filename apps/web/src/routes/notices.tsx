import { createFileRoute } from "@tanstack/react-router";

import { comingSoonRoute } from "./-coming-soon";

export const Route = createFileRoute("/notices")(
  comingSoonRoute("Notices", 45)
);
