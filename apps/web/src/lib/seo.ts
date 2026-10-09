/**
 * Per-page SEO/GEO head: canonical link, and the Open Graph/Twitter tags a
 * page-specific `{ title, content }` meta pair alone does not cover.
 *
 * `__root.tsx` sets site-wide defaults for all of these (including a
 * generic `og:image`); TanStack Router dedupes `meta` tags by `name`/
 * `property`, preferring the last (most-nested) occurrence, so a route that
 * calls this just overrides the generic default with its own page's title
 * and description. `links` are not deduped, which is why the root route
 * does not set its own canonical - only ever one page sets it, this one.
 */

export const SITE_URL = "https://aloysiuscollege.lk";

export interface PageHeadOptions {
  /** Path only, e.g. "/academics" - joined to `SITE_URL` for canonical/og:url. */
  path: string;
  title: string;
  description: string;
  /** Absolute URL. Omit to inherit the root route's generic crest image. */
  image?: string;
}

export const pageHead = ({
  path,
  title,
  description,
  image,
}: PageHeadOptions) => {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      ...(image ? [{ property: "og:image", content: image }] : []),
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...(image ? [{ name: "twitter:image", content: image }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
  };
};
