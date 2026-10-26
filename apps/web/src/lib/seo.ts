/**
 * The single source of truth for search and generative-engine metadata.
 *
 * Every public route builds its `head()` through `pageHead`, and the root route
 * builds the site-wide defaults and the Organization/WebSite structured data
 * from the constants here, so there is one canonical host, one social image and
 * one description of the College to keep correct.
 *
 * TanStack Router dedupes `meta` tags by `name`/`property`, preferring the last
 * (most-nested) occurrence, so a route that calls `pageHead` overrides the root
 * defaults with its own page's values. `links` and `scripts` are not deduped,
 * which is why the root route does not set a canonical link and why the
 * per-page JSON-LD here only ever carries what is specific to that page.
 */

/** The one canonical origin. No `www`, no trailing slash. */
export const SITE_URL = "https://aloysiuscollege.lk";
export const SITE_NAME = "St. Aloysius' College, Galle";
export const SITE_DESCRIPTION =
  "Official website of St. Aloysius' College, Galle, Sri Lanka - a Catholic boys' college founded in 1895. Admissions, academics, student life, news and the Old Boys' Association.";
export const SITE_LOCALE = "en_LK";

/** A real 1200x630 social card rendered from the crest (`public/og-image.png`). */
export const OG_IMAGE = {
  alt: "The crest of St. Aloysius' College, Galle beside the College name",
  height: 630,
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
} as const;

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** The College's own Google Maps place entry (see `content/contact.ts`). */
const MAP_URL = "https://maps.app.goo.gl/JKpQvaxCjGSM5L8GA";

const HOME_CRUMB_NAME = "Home";
const TITLE_SEPARATOR = " | ";

/** `/about` -> `https://aloysiuscollege.lk/about`; `/` -> `https://aloysiuscollege.lk/`. */
export const absoluteUrl = (path: string): string => `${SITE_URL}${path}`;

export interface Breadcrumb {
  name: string;
  /** Path only, e.g. "/galleries". */
  path: string;
}

export type JsonLd = Record<string, unknown>;

interface HeadScript {
  type: "application/ld+json";
  children: string;
}

const jsonLdScript = (data: JsonLd): HeadScript => ({
  children: JSON.stringify(data),
  type: "application/ld+json",
});

/** The College, as both an `EducationalOrganization` and a `School`. */
export const organizationJsonLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@id": ORGANIZATION_ID,
  "@type": ["EducationalOrganization", "School"],
  address: {
    "@type": "PostalAddress",
    addressCountry: "LK",
    addressLocality: "Galle",
    postalCode: "80000",
    streetAddress: "Templers' Road, Kaluwella",
  },
  alternateName: ["St. Aloysius' College", "Aloysius College Galle"],
  email: "info@aloysiuscollege.lk",
  foundingDate: "1895",
  hasMap: MAP_URL,
  image: OG_IMAGE.url,
  logo: {
    "@type": "ImageObject",
    height: 640,
    url: `${SITE_URL}/logo.png`,
    width: 640,
  },
  name: "St. Aloysius' College, Galle",
  sameAs: [MAP_URL],
  slogan: "Certa Viriliter",
  telephone: "+94 91 223 4657",
  url: `${SITE_URL}/`,
});

export const websiteJsonLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@id": WEBSITE_ID,
  "@type": "WebSite",
  description: SITE_DESCRIPTION,
  inLanguage: "en-LK",
  name: SITE_NAME,
  publisher: { "@id": ORGANIZATION_ID },
  url: `${SITE_URL}/`,
});

/** Site-wide structured data, emitted once from the root route. */
export const siteJsonLdScripts = (): HeadScript[] => [
  jsonLdScript(organizationJsonLd()),
  jsonLdScript(websiteJsonLd()),
];

export const breadcrumbJsonLd = (crumbs: readonly Breadcrumb[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ name: HOME_CRUMB_NAME, path: "/" }, ...crumbs].map(
    (crumb, index) => ({
      "@type": "ListItem",
      item: absoluteUrl(crumb.path),
      name: crumb.name,
      position: index + 1,
    })
  ),
});

export interface PageHeadOptions {
  /** Path only, e.g. "/academics" - joined to `SITE_URL` for canonical/og:url. */
  path: string;
  title: string;
  description: string;
  /** Absolute URL. Omit to use the shared 1200x630 social card. */
  image?: string;
  /** Open Graph type. Defaults to `website`. */
  type?: "website" | "article";
  /**
   * Breadcrumb trail *below* Home. Omit for the default of one crumb named
   * after the page title; pass `[]` to emit no breadcrumb (the homepage).
   */
  crumbs?: readonly Breadcrumb[];
  /** Extra page-specific structured data, e.g. a `CollectionPage`. */
  jsonLd?: readonly JsonLd[];
}

export const pageHead = ({
  path,
  title,
  description,
  image,
  type = "website",
  crumbs,
  jsonLd = [],
}: PageHeadOptions) => {
  const url = absoluteUrl(path);
  const socialImage = image ?? OG_IMAGE.url;
  const trail =
    crumbs ??
    (path === "/"
      ? []
      : [{ name: title.split(TITLE_SEPARATOR)[0] ?? title, path }]);
  const structured = [
    ...(trail.length > 0 ? [breadcrumbJsonLd(trail)] : []),
    ...jsonLd,
  ];

  return {
    links: [{ href: url, rel: "canonical" }],
    meta: [
      { title },
      { content: description, name: "description" },
      { content: title, property: "og:title" },
      { content: description, property: "og:description" },
      { content: url, property: "og:url" },
      { content: type, property: "og:type" },
      { content: socialImage, property: "og:image" },
      ...(image
        ? []
        : [
            { content: String(OG_IMAGE.width), property: "og:image:width" },
            { content: String(OG_IMAGE.height), property: "og:image:height" },
            { content: OG_IMAGE.alt, property: "og:image:alt" },
          ]),
      { content: title, name: "twitter:title" },
      { content: description, name: "twitter:description" },
      { content: socialImage, name: "twitter:image" },
    ],
    scripts: structured.map(jsonLdScript),
  };
};

/**
 * Head for a screen that must never be indexed: sign-in, the CMS, the admin and
 * club workspaces, draft previews. `X-Robots-Tag` is also set for these paths in
 * `start.ts`; the tag here covers the HTML itself and documents the intent next
 * to the route.
 */
export const privateHead = (title: string, follow = false) => ({
  meta: [
    { title },
    {
      content: follow ? "noindex, follow" : "noindex, nofollow",
      name: "robots",
    },
  ],
});
