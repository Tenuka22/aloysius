import { createFileRoute } from "@tanstack/react-router";

import { getStorage } from "../../../services";

export const Route = createFileRoute("/api/files/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = decodeURIComponent(
          url.pathname.replace(/^\/api\/files\//u, "")
        );
        if (!key) {
          return new Response("Not found", { status: 404 });
        }

        let stored: Awaited<ReturnType<ReturnType<typeof getStorage>["get"]>>;
        try {
          stored = await getStorage().get(key);
        } catch {
          return new Response("Not found", { status: 404 });
        }

        if (!stored) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(new Uint8Array(stored.data), {
          headers: {
            "Content-Type": stored.contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
