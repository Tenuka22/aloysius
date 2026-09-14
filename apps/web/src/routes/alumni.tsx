import { createFileRoute } from "@tanstack/react-router";

import { comingSoonRoute } from "./-coming-soon";

export const Route = createFileRoute("/alumni")(comingSoonRoute("Alumni", 40));
