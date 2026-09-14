import { createFileRoute } from "@tanstack/react-router";

import { comingSoonRoute } from "./-coming-soon";

export const Route = createFileRoute("/students")(
  comingSoonRoute("Student Life", 35)
);
