import { SmoothScroll } from "@aloysius/ui/components/smooth-scroll";
import { LoadingScreen } from "@aloysius/ui/components/status/loading-screen";
import { NotFoundPage } from "@aloysius/ui/components/status/not-found-page";
import { ServerErrorPage } from "@aloysius/ui/components/status/server-error-page";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import type { orpc } from "@/utils/orpc";

import { AppToaster } from "../components/app-toaster";
import { DevStyleXInject } from "../components/dev-stylex-inject";
import {
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  siteJsonLdScripts,
} from "../lib/seo";

import appCss from "../index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

/**
 * Correlation id shown on the 500 screen. Server-thrown errors that already
 * carry a `digest` (React's server-error hash) reuse it so the value matches
 * the server log; anything else degrades to the error name, which is still
 * more useful to support than nothing. The message itself is never shown - it
 * can contain internals.
 */
const errorReference = (error: unknown): string | undefined => {
  if (error instanceof Error) {
    // Hide generic ReferenceError names from the UI
    if (error.name === "ReferenceError") {
      return undefined;
    }
    const { digest } = error as Error & { digest?: string };
    return digest ?? error.name;
  }
  return undefined;
};

const RootDocument = () => (
  <html lang="en">
    <head>
      <HeadContent />
      <DevStyleXInject cssHref={appCss} />
      {/* The splash is dismissed by script; without JS it would cover the page for good. */}
      <noscript>
        <style>{"[data-loading-screen]{display:none !important}"}</style>
      </noscript>
    </head>
    <body>
      <LoadingScreen />
      <Outlet />
      <SmoothScroll />
      {/*
        Mounted here rather than inside the workspace shells so a failed query
        is announced on a public page too. It renders an empty, live-region list
        until something is actually raised, which is why it is unconditional:
        gating it on the client would make the first client render differ from
        the server's.
      */}
      <AppToaster />
      {import.meta.env.DEV ? (
        <>
          <TanStackRouterDevtools position="bottom-left" />
          <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
        </>
      ) : null}
      <Scripts />
    </body>
  </html>
);

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: ({ matches }) => {
    // A not-found page answers 404; the tag keeps it out of the index too.
    const isNotFound = matches.some(
      (match) => match.status === "notFound" || match._notFound
    );

    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          // `viewport-fit=cover` lets the safe-area insets in index.css do their
          // job on notched phones and foldables.
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { title: isNotFound ? `Page not found | ${SITE_NAME}` : SITE_NAME },
        { name: "description", content: SITE_DESCRIPTION },
        {
          name: "robots",
          content: isNotFound
            ? "noindex, nofollow"
            : "index, follow, max-image-preview:large",
        },
        { name: "theme-color", content: "#013405" },
        { name: "color-scheme", content: "light" },
        { name: "format-detection", content: "telephone=no" },

        { property: "og:type", content: "website" },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:title", content: SITE_NAME },
        { property: "og:description", content: SITE_DESCRIPTION },
        { property: "og:url", content: `${SITE_URL}/` },
        { property: "og:locale", content: SITE_LOCALE },
        { property: "og:image", content: OG_IMAGE.url },
        { property: "og:image:width", content: String(OG_IMAGE.width) },
        { property: "og:image:height", content: String(OG_IMAGE.height) },
        { property: "og:image:alt", content: OG_IMAGE.alt },

        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: SITE_NAME },
        { name: "twitter:description", content: SITE_DESCRIPTION },
        { name: "twitter:image", content: OG_IMAGE.url },
        { name: "twitter:image:alt", content: OG_IMAGE.alt },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        /*
         * Google wants a favicon whose size is a multiple of 48px, and it
         * caches `/favicon.ico` for weeks - a stale copy of an old host's icon
         * can outlive the file. `/favicon-48.png` is a URL it has never seen,
         * so it is listed first as the icon to pick up.
         */
        {
          rel: "icon",
          type: "image/png",
          sizes: "48x48",
          href: "/favicon-48.png",
        },
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "192x192",
          href: "/icon-192.png",
        },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
      scripts: siteJsonLdScripts(),
    };
  },

  component: RootDocument,

  /*
   * Unmatched URLs. TanStack Start responds 404 for this branch, so the page is
   * a real not-found rather than a soft 404 that would keep dead URLs indexed.
   */
  notFoundComponent: () => <NotFoundPage />,

  /*
   * Uncaught render/loader failures. The boundary must not read router context
   * or query data - whatever failed may be exactly that - so the correlation id
   * comes from the error object alone and everything else is static.
   */
  errorComponent: ({ error }) => (
    <ServerErrorPage reference={errorReference(error)} />
  ),
});
