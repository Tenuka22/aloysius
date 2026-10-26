import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";

import { canonicalRedirect, robotsHeader } from "@/lib/crawl-policy";

const MOVED_PERMANENTLY = 301;

/**
 * Applied to every request Start handles. See `lib/crawl-policy.ts` for what is
 * redirected and which responses are marked `noindex`.
 *
 * The host comes from `X-Forwarded-Host` when a proxy supplies it - behind the
 * reverse proxy the request URL's own host is the internal one.
 */
const crawlPolicyMiddleware = createMiddleware().server(
  async ({ request, pathname, next }) => {
    const url = new URL(request.url);
    const host =
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      url.host;

    const target = canonicalRedirect(url, host, request.method);
    if (target) {
      return new Response(null, {
        headers: { Location: target },
        status: MOVED_PERMANENTLY,
      });
    }

    // `next` is Start's middleware continuation, not a Node-style callback.
    // oxlint-disable-next-line node/callback-return
    const result = await next();
    const tag = robotsHeader(pathname, result.response.status);
    if (tag) {
      result.response.headers.set("X-Robots-Tag", tag);
    }
    return result;
  }
);

export const startInstance = createStart(() => ({
  requestMiddleware: [
    // Defining `start.ts` replaces Start's implicit server-function CSRF guard,
    // so it is installed explicitly.
    createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" }),
    crawlPolicyMiddleware,
  ],
}));
