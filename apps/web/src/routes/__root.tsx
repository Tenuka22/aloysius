/*
 * `react/no-danger` is disabled for this file: the single use is the JSON-LD
 * block below, serialised from constants declared in this file.
 */
// oxlint-disable react/no-danger
import { SmoothScroll } from "@aloysius/ui/components/smooth-scroll";
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

import { DevStyleXInject } from "../components/dev-stylex-inject";

import appCss from "../index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

const SITE_URL = "https://aloysiuscollege.lk";
const SITE_NAME = "St. Aloysius' College, Galle";
const SITE_DESCRIPTION =
  "Official website of St. Aloysius' College, Galle, Sri Lanka - a Catholic boys' college founded in 1862. Admissions, academics, student life, news and the Old Boys' Association.";

/**
 * `EducationalOrganization` structured data. Search engines use this for the
 * knowledge panel; without it a school homepage is just an untyped document.
 */
const structuredData = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "St. Aloysius' College",
  alternateName: "St. Aloysius' College, Galle",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  foundingDate: "1862",
  slogan: "Certa Viriliter",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Galle",
    addressCountry: "LK",
  },
});

const RootDocument = () => (
  <html lang="en">
    <head>
      <HeadContent />
      <DevStyleXInject cssHref={appCss} />
      <script
        dangerouslySetInnerHTML={{ __html: structuredData }}
        type="application/ld+json"
      />
    </head>
    <body>
      <Outlet />
      <SmoothScroll />
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        // `viewport-fit=cover` lets the safe-area insets in index.css do their
        // job on notched phones and foldables.
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: SITE_NAME },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "theme-color", content: "#013405" },
      { name: "color-scheme", content: "light" },
      { name: "format-detection", content: "telephone=no" },

      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: SITE_NAME },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:url", content: SITE_URL },
      { property: "og:locale", content: "en_LK" },
      { property: "og:image", content: `${SITE_URL}/icon-512.png` },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_NAME },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { name: "twitter:image", content: `${SITE_URL}/icon-512.png` },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: SITE_URL },
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
    ],
  }),

  component: RootDocument,
});
