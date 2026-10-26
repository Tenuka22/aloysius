/**
 * Sitemap contents, kept free of any database or request code so what the
 * sitemap lists can be tested directly.
 *
 * The rule: list only URLs that answer 200 and may be indexed. Private areas
 * (`/cms`, `/admin`, `/club-admin`, `/sign-in`, `/preview`) never appear, and
 * `/admissions` does not either - admissions lives on its own subdomain, so
 * that path on this host is a 404.
 */

import { absoluteUrl } from "@/lib/seo";

/**
 * A public page and the CMS `content_version.page` keys that feed it. A page's
 * `<lastmod>` is the newest publish among those keys; a page with no
 * published version yet simply gets no `<lastmod>` rather than an invented one.
 */
interface StaticPage {
  path: string;
  contentPages: readonly string[];
}

export const STATIC_PAGES: readonly StaticPage[] = [
  { contentPages: ["homepage", "principal"], path: "/" },
  { contentPages: ["about"], path: "/about" },
  { contentPages: ["academics"], path: "/academics" },
  { contentPages: ["results"], path: "/results" },
  { contentPages: ["alumni"], path: "/alumni" },
  { contentPages: ["students"], path: "/students" },
  { contentPages: ["news"], path: "/news" },
  { contentPages: ["media"], path: "/media" },
  { contentPages: ["contact"], path: "/contact" },
  { contentPages: ["galleries"], path: "/galleries" },
];

export interface SitemapEntry {
  path: string;
  lastmod?: Date;
}

export interface SitemapSources {
  /** Newest published `content_version` per CMS page key. */
  publishedAtByPage: ReadonlyMap<string, Date>;
  /** Newest `updated_at` among approved news posts, if any. */
  newsUpdatedAt?: Date | null;
  /** Approved galleries that `/galleries/:slug` will actually serve. */
  galleries: readonly { slug: string; updatedAt: Date }[];
}

const newest = (
  dates: readonly (Date | null | undefined)[]
): Date | undefined => {
  let latest: Date | undefined;
  for (const date of dates) {
    if (date && !Number.isNaN(date.getTime()) && (!latest || date > latest)) {
      latest = date;
    }
  }
  return latest;
};

export const buildSitemapEntries = ({
  publishedAtByPage,
  newsUpdatedAt,
  galleries,
}: SitemapSources): SitemapEntry[] => {
  const galleriesUpdatedAt = newest(galleries.map((row) => row.updatedAt));

  const pages = STATIC_PAGES.map(({ path, contentPages }) => {
    const stamps: (Date | null | undefined)[] = contentPages.map((key) =>
      publishedAtByPage.get(key)
    );
    if (path === "/news") {
      stamps.push(newsUpdatedAt);
    }
    if (path === "/galleries") {
      stamps.push(galleriesUpdatedAt);
    }
    return { lastmod: newest(stamps), path };
  });

  const galleryPages = galleries.map((row) => ({
    lastmod: newest([row.updatedAt]),
    path: `/galleries/${encodeURIComponent(row.slug)}`,
  }));

  return [...pages, ...galleryPages];
};

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
  "<": "&lt;",
  ">": "&gt;",
};
const XML_SPECIALS = /[&'"<>]/gu;

const escapeXml = (value: string): string =>
  value.replaceAll(XML_SPECIALS, (char) => XML_ESCAPES[char] ?? char);

const urlElement = ({ path, lastmod }: SitemapEntry): string => {
  const lines = [`    <loc>${escapeXml(absoluteUrl(path))}</loc>`];
  if (lastmod) {
    lines.push(`    <lastmod>${lastmod.toISOString()}</lastmod>`);
  }
  return `  <url>\n${lines.join("\n")}\n  </url>`;
};

export const renderSitemapXml = (entries: readonly SitemapEntry[]): string =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(urlElement)
    .join("\n")}\n</urlset>\n`;
