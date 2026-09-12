import { createFileRoute } from "@tanstack/react-router";

import { auth, ensureServerBootstrap } from "../../../services";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await ensureServerBootstrap();
        return auth.handler(request);
      },
      POST: async ({ request }) => {
        await ensureServerBootstrap();
        return auth.handler(request);
      },
    },
  },
});
