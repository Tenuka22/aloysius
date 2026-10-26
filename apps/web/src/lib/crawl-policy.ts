/**
 * What crawlers are told at the HTTP layer, independent of any page's markup.
 * `start.ts` applies these to every request.
 *
 * - One canonical address per page: `www.` and trailing-slash variants answer
 *   a 301 to the bare, slash-less URL on the apex host. (The router's own
 *   trailing-slash handling is a 307, which Search Console reports as "Page with
 *   redirect"; a permanent redirect consolidates the URLs instead.)
 * - `X-Robots-Tag: noindex` on every private area and every 404, so a URL that
 *   is not a real public page can never be indexed even when its HTML is not an
 *   HTML page at all (JSON, text, an image).
 */

import { SITE_URL } from "@/lib/seo";

const CANONICAL_HOST = new URL(SITE_URL).host;

/** Path prefixes that are never public pages. Kept in step with `robots.txt`. */
export const PRIVATE_PATH_PREFIXES = [
  "/admin",
  "/cms",
  "/club-admin",
  "/sign-in",
  "/preview",
  "/api/rpc",
  "/api/auth",
] as const;

/** Prefixes whose URLs are not pages, so no slash/host redirect applies. */
const NON_PAGE_PREFIXES = ["/api/", "/_serverFn/", "/assets/"] as const;

const isUnder = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const isPrivatePath = (pathname: string): boolean =>
  PRIVATE_PATH_PREFIXES.some((prefix) => isUnder(pathname, prefix));

const LOWER_WWW = /^www\./iu;
const TRAILING_SLASHES = /\/+$/u;

/**
 * The canonical URL this request should be redirected to, or `null` when it is
 * already canonical. Only GET/HEAD are ever redirected - a 301 would turn a POST
 * into a GET.
 */
export const canonicalRedirect = (
  requestUrl: URL,
  host: string,
  method: string
): string | null => {
  if (method !== "GET" && method !== "HEAD") {
    return null;
  }
  const { pathname, search } = requestUrl;
  if (NON_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const wrongHost =
    LOWER_WWW.test(host) && host.replace(LOWER_WWW, "") === CANONICAL_HOST;
  const hasTrailingSlash = pathname.length > 1 && pathname.endsWith("/");
  if (!wrongHost && !hasTrailingSlash) {
    return null;
  }

  const cleanPath = hasTrailingSlash
    ? pathname.replace(TRAILING_SLASHES, "") || "/"
    : pathname;
  // A wrong host must leave for the canonical origin. A slash-only fix stays on
  // whichever origin the client used (a relative `Location` is valid), so local
  // and staging servers are not bounced to production.
  return `${wrongHost ? SITE_URL : ""}${cleanPath}${search}`;
};

/** The `X-Robots-Tag` value for a response, or `null` to leave indexing alone. */
export const robotsHeader = (
  pathname: string,
  status: number
): string | null => {
  if (isPrivatePath(pathname)) {
    return "noindex, nofollow";
  }
  if (status === 404 || status === 410) {
    return "noindex, nofollow";
  }
  return null;
};
