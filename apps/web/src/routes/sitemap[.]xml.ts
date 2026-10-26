import { gallery } from "@aloysius/db/schema/club-photos";
import { contentVersion } from "@aloysius/db/schema/cms";
import { newsPost } from "@aloysius/db/schema/news-posts";
import { createFileRoute } from "@tanstack/react-router";
import { and, eq, isNull, max, or } from "drizzle-orm";

import { buildSitemapEntries, renderSitemapXml } from "@/lib/sitemap";
import { getDb } from "@/services";

/**
 * `/sitemap.xml` - the public pages plus one `<url>` per gallery that
 * `/galleries/:slug` will serve, each with a `<lastmod>` taken from the CMS
 * publish history or the row's own `updated_at`. Rebuilt on every request
 * rather than at build time: a gallery can go live between deploys, and a stale
 * sitemap missing it is worse than three small queries.
 *
 * The gallery filter is the same one the page's loader applies (the
 * photography club's galleries plus club-less ones, approved only). Listing
 * any other approved gallery would hand crawlers a URL that answers 404.
 * `/sitemaps.xml` (the plural a site owner is likely to type into Search
 * Console) redirects here.
 */

const GALLERY_CLUB = "photography";
const CACHE_CONTROL = "public, max-age=3600";

const toDate = (value: Date | number | null): Date | null =>
  value === null ? null : new Date(value);

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const db = getDb();

        const [publishedPages, [news], galleries] = await Promise.all([
          db
            .select({
              at: max(contentVersion.createdAt),
              page: contentVersion.page,
            })
            .from(contentVersion)
            .where(eq(contentVersion.published, true))
            .groupBy(contentVersion.page)
            .all(),
          db
            .select({ at: max(newsPost.updatedAt) })
            .from(newsPost)
            .where(eq(newsPost.status, "approved"))
            .all(),
          db
            .select({ slug: gallery.slug, updatedAt: gallery.updatedAt })
            .from(gallery)
            .where(
              and(
                eq(gallery.status, "approved"),
                or(eq(gallery.club, GALLERY_CLUB), isNull(gallery.club))
              )
            )
            .all(),
        ]);

        const publishedAtByPage = new Map<string, Date>();
        for (const row of publishedPages) {
          const at = toDate(row.at);
          if (at) {
            publishedAtByPage.set(row.page, at);
          }
        }

        const xml = renderSitemapXml(
          buildSitemapEntries({
            galleries: galleries.map((row) => ({
              slug: row.slug,
              updatedAt: new Date(row.updatedAt),
            })),
            newsUpdatedAt: toDate(news?.at ?? null),
            publishedAtByPage,
          })
        );

        return new Response(xml, {
          headers: {
            "Cache-Control": CACHE_CONTROL,
            "Content-Type": "application/xml; charset=utf-8",
          },
        });
      },
    },
  },
});
