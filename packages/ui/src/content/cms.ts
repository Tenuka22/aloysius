/**
 * CMS content model.
 *
 * Every screen below is driven by these types rather than by inline JSX, so the
 * oRPC routers can replace the seed values without a component changing shape.
 * Nothing here is fetched: the backend is being built separately, and the whole
 * admin runs on local state until it lands.
 *
 * Where the design comp printed a literal `[CMS: date]` marker, the field is
 * optional here instead. A component that has no value renders an em dash, not
 * a placeholder token - shipping `[CMS: ...]` to a real editor was one of the
 * findings in the homepage audit and the same rule applies here.
 */

import { aspectRatios } from "../tokens/aspect-ratios";

export type ScreenId =
  | "dashboard"
  | "homepage"
  | "news"
  | "gallery"
  | "admissions"
  | "academics"
  | "alumni"
  | "notices"
  | "users"
  | "profile"
  | "settings";

/** Which layout a screen uses. Several nav items share the same list screen. */
export type ScreenKind = "dashboard" | "homepage" | "list" | "profile";

export interface NavItem {
  id: ScreenId;
  num: string;
  label: string;
  kind: ScreenKind;
  /** Badge count. Omitted where a count would be meaningless. */
  count?: number;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "dashboard", num: "01", label: "Dashboard", kind: "dashboard" },
  { id: "homepage", num: "02", label: "Homepage Editor", kind: "homepage" },
  { id: "news", num: "03", label: "News & Events", kind: "list", count: 24 },
  {
    id: "gallery",
    num: "04",
    label: "Gallery & Media",
    kind: "list",
    count: 112,
  },
  { id: "admissions", num: "05", label: "Admissions", kind: "list" },
  { id: "academics", num: "06", label: "Academics", kind: "list" },
  { id: "alumni", num: "07", label: "Alumni", kind: "list" },
  { id: "notices", num: "08", label: "Notices", kind: "list", count: 3 },
  { id: "users", num: "09", label: "Users & Roles", kind: "list" },
  { id: "profile", num: "10", label: "Profile", kind: "profile" },
  { id: "settings", num: "11", label: "Settings", kind: "list" },
];

export type EntryStatus =
  | "published"
  | "draft"
  | "scheduled"
  | "auto"
  | "global";

/** Badge tone per status. Never colour alone - the label always carries it. */
export const STATUS_LABEL: Record<EntryStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  auto: "Automatic",
  global: "Global",
};

/* ------------------------------------------------------------------ blocks */

export type BlockType =
  | "Banner"
  | "Hero"
  | "Text + media"
  | "Quote"
  | "Card grid"
  | "Mosaic"
  | "Feed"
  | "Media grid"
  | "Global";

export type FieldKind = "text" | "textarea" | "image" | "readonly" | "select";

export interface LinkOption {
  label: string;
  value: string;
}

export const APP_ROUTE_OPTIONS: readonly LinkOption[] = [
  { label: "Home", value: "/" },
  { label: "About", value: "/about" },
  { label: "Academics", value: "/academics" },
  { label: "Admissions", value: "/admissions" },
  { label: "Alumni", value: "/alumni" },
  { label: "News & Events", value: "/news" },
  { label: "Notices", value: "/notices" },
  { label: "Media", value: "/media" },
  { label: "Students", value: "/students" },
  { label: "Contact", value: "/contact" },
  { label: "CMS", value: "/cms" },
];

export interface BlockField {
  id: string;
  label: string;
  kind: FieldKind;
  value?: string;
  /** Editor guidance, shown under the control. */
  hint?: string;
  /** Spans the full width of the two-column field grid. */
  wide?: boolean;
  /** Available choices for select fields. */
  options?: readonly LinkOption[];
  /** Reserved width-to-height ratio for image fields. */
  aspectRatio?: number;
}

export interface PageBlock {
  id: string;
  name: string;
  type: BlockType;
  status: EntryStatus;
  /** One-line summary of what the block holds, shown in the list. */
  summary: string;
  fields: readonly BlockField[];
}

/**
 * The homepage blocks, in render order. These mirror the sections actually
 * built in `components/home`, so the editor never offers a control for
 * something the page cannot display.
 */
export const getImageAspectRatio = (fieldId: string): number => {
  const ratios: Partial<Record<string, number>> = {
    "hero-bg": aspectRatios.hero,
    "heritage-image-1": aspectRatios.heritagePhoto,
    "principal-portrait": aspectRatios.principalPortrait,
    "life-sports": aspectRatios.mosaicTile,
    "life-music": aspectRatios.mosaicTile,
    "alumni-image": aspectRatios.alumniPhoto,
    "founder1-image": aspectRatios.principalPortrait,
    "founder2-image": aspectRatios.principalPortrait,
    "history-1-image": aspectRatios.heritagePhoto,
    "history-2-image": aspectRatios.heritagePhoto,
    "history-3-image": aspectRatios.heritagePhoto,
    "history-4-image": aspectRatios.heritagePhoto,
    "anthem-image": aspectRatios.alumniPhoto,
    "anthem-sinhala-image": aspectRatios.alumniPhoto,
    "news-hero-image": aspectRatios.hero,
    "notices-hero-image": aspectRatios.hero,
    "media-hero-image": aspectRatios.hero,
    "students-hero-image": aspectRatios.hero,
    "alumni-hero-image": aspectRatios.hero,
  };

  return ratios[fieldId] ?? aspectRatios.newsCard;
};

export const HOMEPAGE_BLOCKS: readonly PageBlock[] = [
  {
    id: "notice",
    name: "Notice Strip",
    type: "Banner",
    status: "published",
    summary: "Notice text, link and priority",
    fields: [
      {
        id: "notice-text",
        label: "Notice text",
        kind: "text",
        value: "Admissions for Grade 1 (2027) open on 1 March.",
        wide: true,
      },
      {
        id: "notice-href",
        label: "Link target",
        kind: "select",
        value: "/notices",
        options: APP_ROUTE_OPTIONS,
      },
      {
        id: "notice-priority",
        label: "Priority",
        kind: "text",
        value: "Standard",
        hint: "Urgent switches the label to crimson and reads 'Urgent'.",
      },
    ],
  },
  {
    id: "hero",
    name: "Hero",
    type: "Hero",
    status: "published",
    summary: "Motto, title, tagline, background image and two buttons",
    fields: [
      {
        id: "hero-motto",
        label: "Eyebrow / motto",
        kind: "text",
        value: "Certa Viriliter",
      },
      {
        id: "hero-place",
        label: "Sub-label",
        kind: "text",
        value: "Galle • Sri Lanka",
      },
      {
        id: "hero-title",
        label: "Heading",
        kind: "readonly",
        value: "St. Aloysius' College",
        hint: "The college name is fixed site-wide. Change it in Settings → Global.",
        wide: true,
      },
      {
        id: "hero-tagline",
        label: "Tagline",
        kind: "text",
        value: "Tradition. Excellence. Leadership.",
        wide: true,
      },
      {
        id: "hero-cta-1",
        label: "Primary button",
        kind: "text",
        value: "Explore the College",
      },
      {
        id: "hero-cta-2",
        label: "Secondary button",
        kind: "text",
        value: "Admissions",
      },
      {
        id: "hero-bg",
        label: "Background image",
        kind: "image",
        hint: "Landscape, at least 2400px wide. A dark scrim is applied automatically.",
        wide: true,
      },
    ],
  },
  {
    id: "heritage",
    name: "Heritage",
    type: "Text + media",
    status: "published",
    summary: "Heading, body copy, founding year and two images",
    fields: [
      {
        id: "heritage-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: "Our heritage",
      },
      {
        id: "heritage-heading",
        label: "Heading",
        kind: "text",
        value: "A Legacy of Excellence",
      },
      {
        id: "heritage-body",
        label: "Body copy",
        kind: "textarea",
        value:
          "For generations, St. Aloysius' College has shaped the minds and character of young men in the Southern Province - grounded in faith, discipline and the pursuit of excellence.",
        wide: true,
      },
      {
        id: "heritage-founded",
        label: "Founding year",
        kind: "text",
        value: "1862",
        hint: "The 'years of tradition' figure is calculated from this.",
      },
      { id: "heritage-image-1", label: "Archival photograph", kind: "image" },
    ],
  },
  {
    id: "principal",
    name: "Principal's Message",
    type: "Quote",
    status: "published",
    summary: "Pull quote, attribution and portrait",
    fields: [
      {
        id: "principal-quote",
        label: "Quote",
        kind: "textarea",
        wide: true,
        hint: "Two or three sentences reads best at the size this is set in.",
      },
      { id: "principal-name", label: "Attributed to", kind: "text" },
      { id: "principal-portrait", label: "Portrait", kind: "image" },
    ],
  },
  {
    id: "academics",
    name: "Academics",
    type: "Card grid",
    status: "published",
    summary: "Four departments and four statistics",
    fields: [
      {
        id: "academics-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: "Academics",
      },
      {
        id: "academics-heading",
        label: "Heading",
        kind: "text",
        value: "Streams & Departments",
      },
      {
        id: "academics-note",
        label: "Departments",
        kind: "readonly",
        value: "Managed as a list — 4 entries",
        hint: "Edit individual departments from the Academics screen.",
        wide: true,
      },
    ],
  },
  {
    id: "life",
    name: "Student Life",
    type: "Mosaic",
    status: "published",
    summary: "Six tiles with labels and images",
    fields: [
      {
        id: "life-heading",
        label: "Heading",
        kind: "text",
        value: "The Aloysian Experience",
      },
      { id: "life-sports", label: "Sports tile image", kind: "image" },
      { id: "life-music", label: "Music & drama tile image", kind: "image" },
    ],
  },
  {
    id: "news",
    name: "News & Events",
    type: "Feed",
    status: "auto",
    summary: "Featured post plus the four most recent, selected automatically",
    fields: [
      {
        id: "news-heading",
        label: "Heading",
        kind: "text",
        value: "Life at the College",
      },
      {
        id: "news-auto",
        label: "Source",
        kind: "readonly",
        value: "Newest 4 published posts",
        hint: "This block fills itself from News & Events. Publish a post to change it.",
        wide: true,
      },
    ],
  },
  {
    id: "achievements",
    name: "Achievement Wall",
    type: "Feed",
    status: "published",
    summary: "Category filters and three highlights",
    fields: [
      {
        id: "ach-heading",
        label: "Heading",
        kind: "text",
        value: "Achievements",
      },
    ],
  },
  {
    id: "alumni",
    name: "Alumni",
    type: "Text + media",
    status: "published",
    summary: "Heading, body copy, image and two buttons",
    fields: [
      {
        id: "alumni-heading",
        label: "Heading",
        kind: "text",
        value: "The Old Boys' Association",
      },
      { id: "alumni-image", label: "Image", kind: "image" },
    ],
  },
  {
    id: "gallery",
    name: "Gallery",
    type: "Media grid",
    status: "auto",
    summary: "Six images drawn from the Media library",
    fields: [
      {
        id: "gallery-auto",
        label: "Source",
        kind: "readonly",
        value: "Media library — most recent 6",
        wide: true,
      },
    ],
  },
  {
    id: "footer",
    name: "Footer",
    type: "Global",
    status: "global",
    summary: "Shared across every page",
    fields: [
      {
        id: "footer-global",
        label: "Managed in",
        kind: "readonly",
        value: "Settings → Global",
        hint: "Editing the footer here would change every page on the site.",
        wide: true,
      },
    ],
  },
];

/**
 * The About page's editable blocks. Images and key headings are editable;
 * body copy is real, published prose (see `content/about.ts`), not draft
 * text a non-technical editor should rewrite from this screen.
 */
export const ABOUT_BLOCKS: readonly PageBlock[] = [
  {
    id: "founders",
    name: "Founders",
    type: "Text + media",
    status: "published",
    summary: "Headings and portraits for the two founder cards",
    fields: [
      {
        id: "founders-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: "Our foundations",
      },
      {
        id: "founders-heading",
        label: "Heading",
        kind: "text",
        value: "Built on Faith & Tradition",
        wide: true,
      },
      {
        id: "founder1-image",
        label: "Bishop Joseph Van Reeth portrait",
        kind: "image",
        hint: "Portrait orientation. Clearing this restores the default archival photo.",
      },
      {
        id: "founder2-image",
        label: "St. Aloysius Gonzaga portrait",
        kind: "image",
        hint: "Portrait orientation. Clearing this restores the default archival photo.",
      },
    ],
  },
  {
    id: "history",
    name: "History Timeline",
    type: "Media grid",
    status: "published",
    summary: "Heading and archival photo for each of the four timeline entries",
    fields: [
      {
        id: "history-heading",
        label: "Section heading",
        kind: "text",
        value: "More Than a Century in Galle",
        wide: true,
      },
      {
        id: "history-1-image",
        label: "1895 — Founding of the College",
        kind: "image",
        hint: "Clearing this restores the default archival photo.",
      },
      {
        id: "history-2-image",
        label: "1920s — Early Growth",
        kind: "image",
        hint: "Clearing this restores the default archival photo.",
      },
      {
        id: "history-3-image",
        label: "1971 — A Century of Excellence",
        kind: "image",
        hint: "Clearing this restores the default archival photo.",
      },
      {
        id: "history-4-image",
        label: "Today — The Modern College",
        kind: "image",
        hint: "Clearing this restores the default archival photo.",
      },
    ],
  },
  {
    id: "anthem",
    name: "College Anthem",
    type: "Text + media",
    status: "published",
    summary: "Portraits of the anthem's writers and composers",
    fields: [
      {
        id: "anthem-image",
        label: "English anthem creators",
        kind: "image",
        hint: "Clearing this restores the default portrait collage.",
      },
      {
        id: "anthem-sinhala-image",
        label: "Sinhala anthem creators",
        kind: "image",
        hint: "Clearing this restores the default portrait collage.",
      },
    ],
  },
];

/**
 * News page blocks. The page header and feed configuration are editable;
 * individual news posts will be managed from a dedicated list screen.
 */
export const NEWS_BLOCKS: readonly PageBlock[] = [
  {
    id: "news-header",
    name: "Page Header",
    type: "Hero",
    status: "published",
    summary: "Page title, tagline and hero image",
    fields: [
      {
        id: "news-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: "Latest Updates",
      },
      {
        id: "news-heading",
        label: "Heading",
        kind: "text",
        value: "News & Events",
      },
      {
        id: "news-tagline",
        label: "Tagline",
        kind: "textarea",
        value:
          "Stay informed with the latest news, events and achievements from St. Aloysius' College.",
        wide: true,
      },
      {
        id: "news-hero-image",
        label: "Hero image",
        kind: "image",
        hint: "Landscape, at least 2400px wide.",
        wide: true,
      },
    ],
  },
  {
    id: "news-feed",
    name: "News Feed",
    type: "Feed",
    status: "auto",
    summary: "Featured post plus recent articles, selected automatically",
    fields: [
      {
        id: "news-feed-heading",
        label: "Section heading",
        kind: "text",
        value: "Recent Articles",
      },
      {
        id: "news-feed-count",
        label: "Items per page",
        kind: "text",
        value: "9",
        hint: "Number of news items shown per page.",
      },
    ],
  },
];

/**
 * Notices page blocks. The page header is editable; individual notices
 * will be managed from a dedicated list screen.
 */
export const NOTICES_BLOCKS: readonly PageBlock[] = [
  {
    id: "notices-header",
    name: "Page Header",
    type: "Hero",
    status: "published",
    summary: "Page title, tagline and hero image",
    fields: [
      {
        id: "notices-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: "Important Updates",
      },
      {
        id: "notices-heading",
        label: "Heading",
        kind: "text",
        value: "Notices",
      },
      {
        id: "notices-tagline",
        label: "Tagline",
        kind: "textarea",
        value:
          "Official notices, circulars and announcements from the college administration.",
        wide: true,
      },
      {
        id: "notices-hero-image",
        label: "Hero image",
        kind: "image",
        hint: "Landscape, at least 2400px wide.",
        wide: true,
      },
    ],
  },
  {
    id: "notices-config",
    name: "Notice Configuration",
    type: "Card grid",
    status: "published",
    summary: "Display settings for the notice list",
    fields: [
      {
        id: "notices-show-pinned",
        label: "Pin urgent notices",
        kind: "select",
        value: "yes",
        options: [
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ],
        hint: "Urgent notices appear at the top of the list.",
      },
    ],
  },
];

/**
 * Contact page blocks. Contains the college's contact information,
 * location and social media links.
 */
export const CONTACT_BLOCKS: readonly PageBlock[] = [
  {
    id: "contact-header",
    name: "Page Header",
    type: "Hero",
    status: "published",
    summary: "Page title and tagline",
    fields: [
      {
        id: "contact-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: "Get in Touch",
      },
      {
        id: "contact-heading",
        label: "Heading",
        kind: "text",
        value: "Contact Us",
      },
      {
        id: "contact-tagline",
        label: "Tagline",
        kind: "textarea",
        value:
          "We'd love to hear from you. Reach out to us for admissions, inquiries or general information.",
        wide: true,
      },
    ],
  },
  {
    id: "contact-info",
    name: "Contact Information",
    type: "Text + media",
    status: "published",
    summary: "Address, phone, email and social links",
    fields: [
      {
        id: "contact-address",
        label: "Address",
        kind: "textarea",
        value: "St. Aloysius' College, Fort, Galle, Sri Lanka",
        wide: true,
      },
      {
        id: "contact-telephone",
        label: "Telephone",
        kind: "text",
        value: "+94 91 222 2571",
      },
      {
        id: "contact-email",
        label: "Email",
        kind: "text",
        value: "info@aloysiuscollege.lk",
      },
      {
        id: "contact-facebook",
        label: "Facebook URL",
        kind: "text",
        hint: "Full URL including https://",
      },
      {
        id: "contact-instagram",
        label: "Instagram URL",
        kind: "text",
        hint: "Full URL including https://",
      },
      {
        id: "contact-youtube",
        label: "YouTube URL",
        kind: "text",
        hint: "Full URL including https://",
      },
    ],
  },
  {
    id: "contact-map",
    name: "Map",
    type: "Text + media",
    status: "published",
    summary: "Embedded map configuration",
    fields: [
      {
        id: "contact-map-url",
        label: "Google Maps embed URL",
        kind: "text",
        hint: "Use the Google Maps share/embed URL.",
        wide: true,
      },
    ],
  },
];

/**
 * Alumni page blocks. The Old Boys' Association section and
 * distinguished alumni content.
 */
export const ALUMNI_BLOCKS: readonly PageBlock[] = [
  {
    id: "alumni-header",
    name: "Page Header",
    type: "Hero",
    status: "published",
    summary: "Page title, tagline and hero image",
    fields: [
      {
        id: "alumni-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: "Old Boys' Association",
      },
      {
        id: "alumni-heading",
        label: "Heading",
        kind: "text",
        value: "Alumni",
      },
      {
        id: "alumni-tagline",
        label: "Tagline",
        kind: "textarea",
        value:
          "A global network of Aloysians united by shared memories and a commitment to giving back.",
        wide: true,
      },
      {
        id: "alumni-hero-image",
        label: "Hero image",
        kind: "image",
        hint: "Landscape, at least 2400px wide.",
        wide: true,
      },
    ],
  },
  {
    id: "alumni-about",
    name: "About the OBA",
    type: "Text + media",
    status: "published",
    summary: "Body copy and image for the alumni section",
    fields: [
      {
        id: "alumni-body",
        label: "Body copy",
        kind: "textarea",
        value:
          "The Old Boys' Association of St. Aloysius' College connects generations of Aloysians. Whether you left last year or decades ago, the OBA keeps you connected to your alma mater and fellow alumni worldwide.",
        wide: true,
      },
      {
        id: "alumni-image",
        label: "Featured image",
        kind: "image",
        hint: "Landscape or square orientation.",
      },
    ],
  },
  {
    id: "alumni-links",
    name: "Quick Links",
    type: "Card grid",
    status: "published",
    summary: "Links to OBA branches and events",
    fields: [
      {
        id: "alumni-oba-href",
        label: "OBA portal link",
        kind: "text",
        hint: "URL to the OBA member portal or registration.",
      },
      {
        id: "alumni-events-href",
        label: "Events link",
        kind: "text",
        hint: "URL to upcoming alumni events.",
      },
    ],
  },
];

/**
 * Media page blocks. Gallery and media library configuration.
 */
export const MEDIA_BLOCKS: readonly PageBlock[] = [
  {
    id: "media-header",
    name: "Page Header",
    type: "Hero",
    status: "published",
    summary: "Page title, tagline and hero image",
    fields: [
      {
        id: "media-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: "Photo & Video",
      },
      {
        id: "media-heading",
        label: "Heading",
        kind: "text",
        value: "Media Gallery",
      },
      {
        id: "media-tagline",
        label: "Tagline",
        kind: "textarea",
        value:
          "Browse photographs and videos capturing life at St. Aloysius' College.",
        wide: true,
      },
      {
        id: "media-hero-image",
        label: "Hero image",
        kind: "image",
        hint: "Landscape, at least 2400px wide.",
        wide: true,
      },
    ],
  },
  {
    id: "media-gallery",
    name: "Gallery Settings",
    type: "Media grid",
    status: "auto",
    summary: "Media items drawn from the library",
    fields: [
      {
        id: "media-gallery-count",
        label: "Items per page",
        kind: "text",
        value: "12",
        hint: "Number of media items shown per page.",
      },
    ],
  },
];

/**
 * Student Life page blocks. Student activities, clubs and campus life.
 */
export const STUDENTS_BLOCKS: readonly PageBlock[] = [
  {
    id: "students-header",
    name: "Page Header",
    type: "Hero",
    status: "published",
    summary: "Page title, tagline and hero image",
    fields: [
      {
        id: "students-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: "Campus Life",
      },
      {
        id: "students-heading",
        label: "Heading",
        kind: "text",
        value: "Student Life",
      },
      {
        id: "students-tagline",
        label: "Tagline",
        kind: "textarea",
        value:
          "Discover the vibrant community, clubs and activities that make St. Aloysius' College a place to grow.",
        wide: true,
      },
      {
        id: "students-hero-image",
        label: "Hero image",
        kind: "image",
        hint: "Landscape, at least 2400px wide.",
        wide: true,
      },
    ],
  },
  {
    id: "students-activities",
    name: "Activities",
    type: "Mosaic",
    status: "published",
    summary: "Student clubs, sports and activities grid",
    fields: [
      {
        id: "students-activities-heading",
        label: "Section heading",
        kind: "text",
        value: "Clubs & Activities",
      },
    ],
  },
];

/* --------------------------------------------------------------- dashboard */

export interface Tile {
  id: string;
  label: string;
  value: string;
  sub: string;
  tone: "green" | "gold" | "crimson";
}

export const DASHBOARD_TILES: readonly Tile[] = [
  {
    id: "pages",
    label: "Published pages",
    value: "9",
    sub: "Live on the website",
    tone: "green",
  },
  {
    id: "news",
    label: "News posts",
    value: "24",
    sub: "Across all categories",
    tone: "gold",
  },
  {
    id: "media",
    label: "Media items",
    value: "112",
    sub: "Photographs and videos",
    tone: "green",
  },
  {
    id: "pending",
    label: "Pending",
    value: "3",
    sub: "Awaiting approval",
    tone: "crimson",
  },
];

export interface PendingItem {
  id: string;
  type: string;
  title: string;
  author?: string;
}

export const PENDING_ITEMS: readonly PendingItem[] = [
  {
    id: "p1",
    type: "News",
    title: "Prize giving 2026 — full report and photographs",
  },
  { id: "p2", type: "Event", title: "Inter-house athletics meet, 12 October" },
  {
    id: "p3",
    type: "Notice",
    title: "Grade 1 admissions — supporting documents",
  },
];

export interface HealthRow {
  id: string;
  label: string;
  status: string;
  tone: "ok" | "warn" | "muted";
}

export const HEALTH_ROWS: readonly HealthRow[] = [
  { id: "notice", label: "Homepage notice", status: "Active", tone: "warn" },
  { id: "links", label: "Broken links", status: "None found", tone: "ok" },
  {
    id: "drafts",
    label: "Unpublished drafts",
    status: "3 pending",
    tone: "warn",
  },
  {
    id: "backup",
    label: "Last backup",
    status: "Not configured",
    tone: "muted",
  },
];

/* ------------------------------------------------------------------- lists */

export interface Entry {
  id: string;
  title: string;
  status: EntryStatus;
  updated?: string;
}

/** Seed rows per list screen. Replaced wholesale once the routers exist. */
export const LIST_ENTRIES: Partial<Record<ScreenId, readonly Entry[]>> = {
  news: [
    {
      id: "n1",
      title: "Advanced Level results announced for the 2025 cohort",
      status: "published",
      updated: "2026-09-05",
    },
    {
      id: "n2",
      title: "First XI cricket team retains the Southern Province title",
      status: "published",
      updated: "2026-08-28",
    },
    {
      id: "n3",
      title: "Annual prize giving held in the college main hall",
      status: "draft",
      updated: "2026-09-11",
    },
    {
      id: "n4",
      title: "Circular: term dates and school calendar",
      status: "scheduled",
      updated: "2026-09-12",
    },
  ],
  notices: [
    {
      id: "t1",
      title: "Grade 1 admissions open 1 March",
      status: "published",
      updated: "2026-09-01",
    },
    {
      id: "t2",
      title: "School closed for Poya day",
      status: "draft",
      updated: "2026-09-08",
    },
    {
      id: "t3",
      title: "Sports meet rescheduled",
      status: "scheduled",
      updated: "2026-09-10",
    },
  ],
};

export const EMPTY_ENTRIES: readonly Entry[] = [];

/* ----------------------------------------------------------------- profile */

export interface Permission {
  id: string;
  area: string;
  description: string;
  /** `true` = granted. The level shown is derived, not stored twice. */
  granted: boolean;
  /** Areas an Editor can never be granted from this screen. */
  adminOnly?: boolean;
}

export const PERMISSIONS: readonly Permission[] = [
  {
    id: "pages",
    area: "Pages",
    description: "Edit standing pages — About, Academics, Contact.",
    granted: true,
  },
  {
    id: "news",
    area: "News & Events",
    description: "Create, edit and publish news posts and calendar events.",
    granted: true,
  },
  {
    id: "gallery",
    area: "Gallery & Media",
    description: "Upload photographs, albums and video links.",
    granted: true,
  },
  {
    id: "admissions",
    area: "Admissions",
    description: "Update forms, deadlines and admission notices.",
    granted: false,
  },
  {
    id: "alumni",
    area: "Alumni",
    description: "Manage OBA branches and distinguished Aloysians.",
    granted: false,
  },
  {
    id: "users",
    area: "Users & Roles",
    description: "Invite staff accounts and assign permissions.",
    granted: false,
    adminOnly: true,
  },
];

export interface ActivityEntry {
  id: string;
  verb: "Published" | "Edited" | "Uploaded" | "Drafted" | "Deleted";
  item: string;
  at?: string;
}

export const RECENT_ACTIVITY: readonly ActivityEntry[] = [
  {
    id: "a1",
    verb: "Published",
    item: "Advanced Level results announced",
    at: "2026-09-05",
  },
  {
    id: "a2",
    verb: "Edited",
    item: "Admissions page — key dates",
    at: "2026-09-04",
  },
  {
    id: "a3",
    verb: "Uploaded",
    item: "Prize giving album — 24 photographs",
    at: "2026-09-02",
  },
  {
    id: "a4",
    verb: "Drafted",
    item: "Prize giving announcement",
    at: "2026-08-30",
  },
  {
    id: "a5",
    verb: "Deleted",
    item: "Expired notice — sports meet",
    at: "2026-08-27",
  },
];

export interface Revision {
  id: string;
  label: "Published" | "Edited";
  note: string;
  at?: string;
}

export const REVISIONS: readonly Revision[] = [
  {
    id: "r1",
    label: "Published",
    note: "Hero background image replaced",
    at: "2026-09-02",
  },
  {
    id: "r2",
    label: "Edited",
    note: "Notice strip text updated",
    at: "2026-08-30",
  },
  {
    id: "r3",
    label: "Edited",
    note: "Academics statistics updated",
    at: "2026-08-24",
  },
  {
    id: "r4",
    label: "Published",
    note: "Student life mosaic reordered",
    at: "2026-08-14",
  },
];

export const ACTIVITY_STATS = [
  { id: "s1", label: "Posts published", value: "18" },
  { id: "s2", label: "Photos uploaded", value: "240" },
  { id: "s3", label: "Pending drafts", value: "2" },
] as const;

/**
 * Dates are formatted for the visitor's locale rather than hard-coded to one
 * format, and an absent date renders an em dash instead of an empty cell.
 */
export const formatCmsDate = (iso?: string) => {
  if (!iso) {
    return "—";
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
