import { createFileRoute } from "@tanstack/react-router";

import { comingSoonRoute } from "./-coming-soon";

export const Route = createFileRoute("/news")(comingSoonRoute("News", 55));
