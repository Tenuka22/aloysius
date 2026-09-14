import { createFileRoute } from "@tanstack/react-router";

import { comingSoonRoute } from "./-coming-soon";

export const Route = createFileRoute("/contact")(
  comingSoonRoute("Contact", 70)
);
