import { createFileRoute } from "@tanstack/react-router";

import { absoluteUrl } from "@/lib/seo";

/**
 * `/sitemaps.xml` (plural) is what the site owner typed into Search Console,
 * and it used to be a 404. A permanent redirect keeps one canonical sitemap
 * address; crawlers follow it and a submitted sitemap resolves.
 */
export const Route = createFileRoute("/sitemaps.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(null, {
          headers: { Location: absoluteUrl("/sitemap.xml") },
          status: 301,
        }),
    },
  },
});
