import { gallery } from "@aloysius/db/schema/club-photos";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { SITE_URL } from "@/lib/seo";
import { getDb } from "@/services";

/**
 * `/sitemap.xml` - every static public page, plus one `<url>` per approved
 * gallery. Rebuilt on every request rather than at build time: a gallery can
 * go live between deploys, and a stale sitemap missing it is worse than the
 * extra query. CMS editor screens and club-admin routes are excluded on
 * purpose - they are `noindex, nofollow` already, and a crawler has no
 * business finding them via a sitemap either.
 */

const STATIC_PATHS: readonly string[] = [
  "/",
  "/about",
  "/academics",
  "/admissions",
  "/alumni",
  "/students",
  "/news",
  "/media",
  "/contact",
  "/notices",
  "/events",
  "/galleries",
];

const urlEntry = (path: string): string =>
  `  <url>\n    <loc>${SITE_URL}${path}</loc>\n  </url>`;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const galleries = await getDb()
          .select({ slug: gallery.slug })
          .from(gallery)
          .where(eq(gallery.status, "approved"))
          .all();

        const urls = [
          ...STATIC_PATHS,
          ...galleries.map((row) => `/galleries/${row.slug}`),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map(urlEntry)
          .join("\n")}\n</urlset>`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml" },
        });
      },
    },
  },
});
