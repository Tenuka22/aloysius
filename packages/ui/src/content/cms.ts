/**
 * CMS content model.
 *
 * Every screen below is driven by these types rather than by inline JSX, so the
 * oRPC routers can replace the seed values without a component changing shape.
 * Nothing here is fetched: the backend owns the saved state, and anything a
 * screen reads at runtime comes from an oRPC procedure rather than from a
 * constant in this file.
 *
 * Where the design comp printed a literal `[CMS: date]` marker, the field is
 * optional here instead. A component that has no value renders an em dash, not
 * a placeholder token - shipping `[CMS: ...]` to a real editor was one of the
 * findings in the homepage audit and the same rule applies here.
 */

import type { AspectRatioKey } from "../tokens/aspect-ratios";
import {
  ABOUT_HERO_INTRO,
  ABOUT_HERO_TITLE,
  MISSION_STATEMENT,
  VISION_STATEMENT,
} from "./about";
import { ACADEMICS_HERO_INTRO, ACADEMICS_HERO_TITLE } from "./academics";
import { ALUMNI_HERO_INTRO, ALUMNI_HERO_TITLE } from "./alumni";
import {
  CONTACT_DEFAULT_TELEPHONE,
  CONTACT_HERO_INTRO,
  CONTACT_HERO_TITLE,
} from "./contact";
import { GALLERIES_HERO_INTRO, GALLERIES_HERO_TITLE } from "./galleries";
import { ADMISSIONS_URL } from "./home";
import { MEDIA_HERO_TITLE } from "./media";
import {
  PRINCIPAL_BLOCK_ID,
  PRINCIPAL_DEFAULTS,
  PRINCIPAL_FIELD,
} from "./principal";
import { STUDENTS_HERO_INTRO, STUDENTS_HERO_TITLE } from "./students";

export type ScreenId =
  | "dashboard"
  | "homepage"
  | "principal"
  | "news"
  | "gallery"
  | "academics"
  | "alumni"
  | "notices"
  | "users"
  | "profile"
  | "settings";

/** Which layout a screen uses. Several nav items share the same list screen. */
export type ScreenKind =
  | "dashboard"
  | "homepage"
  | "global"
  | "list"
  | "profile";

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
  {
    id: "principal",
    num: "03",
    label: "Principal's Message",
    kind: "global",
  },
  { id: "news", num: "04", label: "News & Events", kind: "list", count: 24 },
  {
    id: "gallery",
    num: "05",
    label: "Gallery & Media",
    kind: "list",
    count: 112,
  },
  { id: "academics", num: "07", label: "Academics", kind: "list" },
  { id: "alumni", num: "08", label: "Alumni", kind: "list" },
  { id: "notices", num: "09", label: "Notices", kind: "list", count: 3 },
  { id: "users", num: "10", label: "Users & Roles", kind: "list" },
  { id: "profile", num: "11", label: "Profile", kind: "profile" },
  { id: "settings", num: "12", label: "Settings", kind: "list" },
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

export type FieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "image"
  | "readonly"
  | "select";

export interface LinkOption {
  label: string;
  value: string;
}

export const APP_ROUTE_OPTIONS: readonly LinkOption[] = [
  { label: "Home", value: "/" },
  { label: "About", value: "/about" },
  { label: "Academics", value: "/academics" },
  { label: "Admissions", value: ADMISSIONS_URL },
  { label: "Alumni", value: "/alumni" },
  { label: "News & Events", value: "/news" },
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
/**
 * The ratio every image field is composed for, by field id.
 *
 * A map from field id to `AspectRatioKey` rather than to a number: the uploader
 * needs the key, because the key is what carries the ratio, the name shown in
 * the crop dialog and the minimum-width warning together. Returning
 * `aspectRatios[key]` here would hand the uploader one third of that and leave
 * it looking the other two up separately Ã¢â‚¬â€ which is how a hint ends up
 * describing a different ratio from the one being enforced.
 *
 * `newsCard` is the fallback because a field id added to the CMS without a line
 * here should still get a sensible landscape crop rather than silently render
 * uncropped.
 */
const IMAGE_RATIO_KEYS: Partial<Record<string, AspectRatioKey>> = {
  "hero-bg": "hero",
  "heritage-image-1": "heritagePhoto",
  "heritage-image-2": "heritageDetail",
  "principal-portrait": "principalMessage",
  "life-sports": "mosaicTile",
  "life-music": "mosaicTile",
  "life-scouts": "mosaicTile",
  "life-faith": "mosaicTile",
  "alumni-image": "alumniPhoto",
  "history-1-image": "heritagePhoto",
  "history-2-image": "heritagePhoto",
  "history-3-image": "heritagePhoto",
  "history-4-image": "heritagePhoto",
  "notices-hero-image": "hero",
  "students-hero-image": "hero",
};

export const getImageRatioKey = (fieldId: string): AspectRatioKey =>
  IMAGE_RATIO_KEYS[fieldId] ?? "newsCard";

export const HOMEPAGE_BLOCKS: readonly PageBlock[] = [
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
        value: "Galle Ã¢â‚¬Â¢ Sri Lanka",
      },
      {
        id: "hero-title",
        label: "Heading",
        kind: "readonly",
        value: "St. Aloysius' College",
        hint: "The college name is fixed site-wide. Change it in Settings Ã¢â€ â€™ Global.",
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
        label: "Button",
        kind: "text",
        value: "Management Portal",
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
          "Founded in 1895 by Belgian Jesuit missionaries on Mount Calvary, Galle, St. Aloysius' College has shaped generations of young men in the Southern Province — today a National School of over 3,500 boys from Grade 1 to G.C.E. Advanced Level.",
        wide: true,
      },
      {
        id: "heritage-founded",
        label: "Founding year",
        kind: "text",
        value: "1895",
        hint: "The 'years of tradition' figure is calculated from this.",
      },
      { id: "heritage-image-1", label: "Archival photograph", kind: "image" },
      {
        id: "heritage-image-2",
        label: "Architectural detail",
        kind: "image",
        hint: "The smaller, offset image below the archival photograph.",
      },
    ],
  },
  {
    id: "life",
    name: "Student Life",
    type: "Mosaic",
    status: "published",
    summary: "Heading and a seven-tile mosaic with four photographs",
    fields: [
      {
        id: "life-heading",
        label: "Heading",
        kind: "text",
        value: "The Aloysian Experience",
      },
      { id: "life-sports", label: "Sports tile image", kind: "image" },
      { id: "life-music", label: "Music & drama tile image", kind: "image" },
      { id: "life-scouts", label: "Scouts & cadets tile image", kind: "image" },
      { id: "life-faith", label: "Faith & service tile image", kind: "image" },
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
    summary: "Heading, introduction and filterable honours",
    fields: [
      {
        id: "ach-title",
        label: "Heading",
        kind: "text",
        value: "The Achievement Wall",
      },
      {
        id: "ach-intro",
        label: "Introduction",
        kind: "textarea",
        value: "Academic, sporting and national honours earned by Aloysians.",
        wide: true,
      },
    ],
  },
  {
    id: "alumni",
    name: "Alumni",
    type: "Text + media",
    status: "published",
    summary: "Headline quote, body copy, image and two buttons",
    fields: [
      {
        id: "alumni-quote",
        label: "Headline quote",
        kind: "text",
        value: "The Aloysian Legacy Continues.",
        hint: "Set in large type between quotation marks.",
        wide: true,
      },
      {
        id: "alumni-body",
        label: "Body copy",
        kind: "textarea",
        value:
          "A global network of Aloysians in leadership, service and scholarship - connected by the crest they carried.",
        wide: true,
      },
      { id: "alumni-image", label: "Image", kind: "image" },
    ],
  },
  {
    id: "gallery",
    name: "Gallery",
    type: "Media grid",
    status: "auto",
    summary: "Six-tile bento of the most recent Media library photographs",
    fields: [
      {
        id: "gallery-auto",
        label: "Source",
        kind: "readonly",
        value: "Media library Ã¢â‚¬â€ most recent 6",
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
        value: "Settings Ã¢â€ â€™ Global",
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
 *
 * `about-header` covers the page's own title, tagline and hero photograph. It
 * is separate from the Principal's Message block, which is global and shown on
 * every page - the About page shows both, and they are not the same content.
 */
/**
 * The site's one global block.
 *
 * The Principal's message and portrait are the same person on every page, so
 * they are not part of any page's registry Ã¢â‚¬â€ they get their own editor screen
 * at `/cms/principal` and every page reads the result. Keeping a copy of this
 * block inside `HOMEPAGE_BLOCKS` (as it used to be) is what produced two
 * editable versions of the same sentence and two duplicate components.
 *
 * `type: "Global"` marks it in the block list so an editor can see that
 * changes here land on more than one page.
 */
export const PRINCIPAL_BLOCKS: readonly PageBlock[] = [
  {
    id: PRINCIPAL_BLOCK_ID,
    name: "Principal's Message",
    type: "Global",
    status: "global",
    summary: "Message, attribution and portrait Ã¢â‚¬â€ shown on every page",
    fields: [
      {
        id: PRINCIPAL_FIELD.eyebrow,
        label: "Eyebrow",
        kind: "text",
        value: PRINCIPAL_DEFAULTS.eyebrow,
      },
      {
        id: PRINCIPAL_FIELD.heading,
        label: "Heading",
        kind: "text",
        value: PRINCIPAL_DEFAULTS.heading,
        hint: "Optional. Leave empty to set the message as a pull quote instead of under a heading.",
      },
      {
        id: PRINCIPAL_FIELD.quote,
        label: "Quote",
        kind: "textarea",
        value: PRINCIPAL_DEFAULTS.quote,
        wide: true,
        hint: "One or two sentences. This is what the homepage sets in large type Ã¢â‚¬â€ keep it short enough to read at a glance.",
      },
      {
        id: PRINCIPAL_FIELD.body,
        label: "Full message",
        kind: "richtext",
        value: PRINCIPAL_DEFAULTS.body,
        wide: true,
        hint: "The complete message. Rich text: headings, lists, quotes, links and a pull quote. This is what the About page shows.",
      },
      {
        id: PRINCIPAL_FIELD.name,
        label: "Attributed to",
        kind: "text",
        value: PRINCIPAL_DEFAULTS.name,
        hint: "Optional. Leave empty to name the office rather than a person.",
      },
      {
        id: PRINCIPAL_FIELD.role,
        label: "Role line",
        kind: "text",
        value: PRINCIPAL_DEFAULTS.role,
      },
      {
        id: PRINCIPAL_FIELD.portrait,
        label: "Portrait",
        kind: "image",
        hint: "Portrait orientation. Clearing this restores the placeholder.",
      },
      {
        id: PRINCIPAL_FIELD.linkLabel,
        label: "Link label",
        kind: "text",
        value: PRINCIPAL_DEFAULTS.link.label,
        hint: "Optional. Leave both link fields empty to drop the link.",
      },
      {
        id: PRINCIPAL_FIELD.linkHref,
        label: "Link target",
        kind: "select",
        value: PRINCIPAL_DEFAULTS.link.href,
        options: APP_ROUTE_OPTIONS,
      },
    ],
  },
];

export const ABOUT_BLOCKS: readonly PageBlock[] = [
  {
    id: "about-header",
    name: "Page Header",
    type: "Hero",
    status: "published",
    summary: "Page title and tagline",
    fields: [
      {
        id: "about-heading",
        label: "Heading",
        kind: "text",
        value: ABOUT_HERO_TITLE,
      },
      {
        id: "about-tagline",
        label: "Tagline",
        kind: "textarea",
        value: ABOUT_HERO_INTRO,
        wide: true,
      },
    ],
  },
  {
    id: "history",
    name: "History Timeline",
    type: "Media grid",
    status: "published",
    summary:
      "Heading, year-by-year copy and archival photo for each of the four timeline entries",
    fields: [
      {
        id: "history-heading",
        label: "Section heading",
        kind: "text",
        value: "More Than a Century in Galle",
        wide: true,
      },
      {
        id: "history-1-title",
        label: "1895 — Title",
        kind: "text",
        value: "Founded on Mount Calvary",
      },
      {
        id: "history-1-body",
        label: "1895 — Body",
        kind: "textarea",
        value:
          "Established by newly arrived Belgian Jesuit missionaries led by Joseph Van Reeth, first Bishop of Galle, and named after the Jesuit saint Aloysius Gonzaga — beside St. Mary's Cathedral and Sacred Heart Convent.",
        wide: true,
      },
      {
        id: "history-1-image",
        label: "1895 — Founded on Mount Calvary",
        kind: "image",
        hint: "Clearing this restores the default archival photo.",
      },
      {
        id: "history-2-title",
        label: "1896 — Title",
        kind: "text",
        value: "The Jesuit Years",
      },
      {
        id: "history-2-body",
        label: "1896 — Body",
        kind: "textarea",
        value:
          "Under Jesuit principals from Joseph Van Reeth to Paul Caspersz, the College grew with English as its medium of instruction and five houses named after its pioneering fathers.",
        wide: true,
      },
      {
        id: "history-2-image",
        label: "1896 — The Jesuit Years",
        kind: "image",
        hint: "Clearing this restores the default archival photo.",
      },
      {
        id: "history-3-title",
        label: "1971 — Title",
        kind: "text",
        value: "A New Chapter",
      },
      {
        id: "history-3-body",
        label: "1971 — Body",
        kind: "textarea",
        value:
          "Following the nationalisation of schools, B. K. Silva became the first Buddhist principal and the medium of instruction changed to Sinhala.",
        wide: true,
      },
      {
        id: "history-3-image",
        label: "1971 — A New Chapter",
        kind: "image",
        hint: "Clearing this restores the default archival photo.",
      },
      {
        id: "history-4-title",
        label: "Today — Title",
        kind: "text",
        value: "A National School",
      },
      {
        id: "history-4-body",
        label: "Today — Body",
        kind: "textarea",
        value:
          "A boys' National School of over 3,500 students from Grade 1 to G.C.E. Advanced Level, serving families of many faiths across the South.",
        wide: true,
      },
      {
        id: "history-4-image",
        label: "Today — A National School",
        kind: "image",
        hint: "Clearing this restores the default archival photo.",
      },
    ],
  },
  {
    id: "about-statements",
    name: "Vision & Mission",
    type: "Card grid",
    status: "published",
    summary:
      "The two strategic statements shown between the timeline and the motto",
    fields: [
      {
        id: "about-vision",
        label: "Vision",
        kind: "textarea",
        value: VISION_STATEMENT,
        wide: true,
      },
      {
        id: "about-mission",
        label: "Mission",
        kind: "textarea",
        value: MISSION_STATEMENT,
        wide: true,
      },
    ],
  },
];

/**
 * News page blocks. Only the page title is editable here; the stories
 * themselves are rows managed at `/cms/news`, and everything else on the page
 * is the approved design's own content.
 */
export const NEWS_BLOCKS: readonly PageBlock[] = [
  {
    id: "news-header",
    name: "Page Header",
    type: "Hero",
    status: "published",
    summary: "Page title",
    fields: [
      {
        id: "news-heading",
        label: "Heading",
        kind: "text",
        value: "News & Events",
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
    summary: "Page title and tagline",
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
        id: "contact-heading",
        label: "Heading",
        kind: "text",
        value: CONTACT_HERO_TITLE,
      },
      {
        id: "contact-tagline",
        label: "Tagline",
        kind: "textarea",
        value: CONTACT_HERO_INTRO,
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
        value: CONTACT_DEFAULT_TELEPHONE,
      },
      {
        /*
         * Deliberately empty. No published source states the college's office
         * hours, and a wrong set of hours misdirects the visitor most likely to
         * depend on them. Left blank the details list omits the row entirely.
         */
        id: "contact-office-hours",
        label: "Office hours",
        kind: "textarea",
        hint: "Leave empty and the office hours are not shown at all.",
        wide: true,
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
 * Alumni page blocks. Only the page title and tagline are editable here;
 * branch details and portraits come from their own CMS rosters, and the rest
 * is the approved design's own content.
 */
export const ALUMNI_BLOCKS: readonly PageBlock[] = [
  {
    id: "alumni-header",
    name: "Page Header",
    type: "Hero",
    status: "published",
    summary: "Page title and tagline",
    fields: [
      {
        id: "alumni-heading",
        label: "Heading",
        kind: "text",
        value: ALUMNI_HERO_TITLE,
      },
      {
        id: "alumni-tagline",
        label: "Tagline",
        kind: "textarea",
        value: ALUMNI_HERO_INTRO,
        wide: true,
      },
    ],
  },
];

/* ------------------------------------------------------------- galleries */

/**
 * The `/galleries` index page's own header.
 *
 * A page key rather than an extension of the existing gallery management
 * screen: `/cms/galleries` edits the *records* (create, review, delete a
 * gallery), while this edits the *page around them* - the masthead a visitor
 * reads before the first photograph. The two are different jobs with different
 * editors, so they are different screens under `/cms/galleries-page` and
 * `/cms/galleries`.
 */
export const GALLERIES_BLOCKS: readonly PageBlock[] = [
  {
    id: "galleries-header",
    name: "Page Header",
    type: "Hero",
    status: "published",
    summary: "Page title and tagline",
    fields: [
      {
        id: "galleries-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: "Media",
      },
      {
        id: "galleries-heading",
        label: "Heading",
        kind: "text",
        value: GALLERIES_HERO_TITLE,
      },
      {
        id: "galleries-tagline",
        label: "Tagline",
        kind: "textarea",
        value: GALLERIES_HERO_INTRO,
        wide: true,
      },
      {
        id: "galleries-hero-image",
        label: "Hero image",
        kind: "image",
        hint: "Landscape, at least 2400px wide.",
        wide: true,
      },
    ],
  },
];

/**
 * Academics page blocks: the page header.
 *
 * `academics-leadership` used to live here and has gone. The Principal, the
 * Primary sectional head and the Secondary deputy principal are all on `/about`
 * now, in the academic-heads roster edited at `/cms/academic-heads`, so the
 * same three people were being rendered in two places with two different sets
 * of photographs.
 *
 * The Principal's own message and portrait are the global `PRINCIPAL_BLOCKS`
 * block, read the same way every other page reads it, so there is exactly one
 * photo and one name to keep in sync, not two.
 *
 * `academics-header` was added late, and for the same reason every other page
 * has one: the hero was the only page header on the site with no editor behind
 * it, so its title and tagline were the only ones a CMS editor could not
 * change. `academics-heading` and `academics-tagline` are spelled the same as
 * the homepage's Academics card-grid fields on purpose - the ids are scoped to
 * (page, block), so the two cannot collide, and matching the `news-header`
 * precedent keeps one naming rule for page headers.
 *
 * The facility photographs that used to live here as a generated per-facility
 * "Media grid" block are gone: the facilities showcase on `/academics` - name,
 * tag, description and photograph - is now the `facility` table, edited as a
 * roster at `/cms/facilities`, the same shape change `/cms/academic-heads`
 * made to the old fixed leadership fields.
 */
export const ACADEMICS_BLOCKS: readonly PageBlock[] = [
  {
    id: "academics-header",
    name: "Page Header",
    type: "Hero",
    status: "published",
    summary: "Page title and tagline",
    fields: [
      {
        id: "academics-heading",
        label: "Heading",
        kind: "text",
        value: ACADEMICS_HERO_TITLE,
      },
      {
        id: "academics-tagline",
        label: "Tagline",
        kind: "textarea",
        value: ACADEMICS_HERO_INTRO,
        wide: true,
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
    summary: "Page title",
    fields: [
      {
        id: "media-heading",
        label: "Heading",
        kind: "text",
        value: MEDIA_HERO_TITLE,
      },
    ],
  },
];

/**
 * Student Life page blocks. The page header is the only editable copy: every
 * other section is the approved design's own content (`content/students.ts`).
 */
export const STUDENTS_BLOCKS: readonly PageBlock[] = [
  {
    id: "students-header",
    name: "Page Header",
    type: "Hero",
    status: "published",
    summary: "Page title and tagline",
    fields: [
      {
        id: "students-heading",
        label: "Heading",
        kind: "text",
        value: STUDENTS_HERO_TITLE,
      },
      {
        id: "students-tagline",
        label: "Tagline",
        kind: "textarea",
        value: STUDENTS_HERO_INTRO,
        wide: true,
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

/*
 * The dashboard's three shapes.
 *
 * `DASHBOARD_TILES`, `PENDING_ITEMS`, `HEALTH_ROWS` and `ACTIVITY_STATS` were
 * deleted from here. They were fixed arrays - "News posts 24", "Media items
 * 112", "Pending 3", "Posts published 18", "Photos uploaded 240" - plus three
 * invented queue entries naming events and notices that had never existed.
 * Every one of them now comes from `orpc.cms.dashboardStats`, which counts the
 * table each figure describes.
 *
 * A dashboard whose numbers cannot be wrong is worse than no dashboard: it tells
 * an editor the college has published twenty-four stories when it has published
 * three, and it names work in the queue that does not exist.
 */

export interface PendingItem {
  id: string;
  type: string;
  title: string;
  author?: string;
}

export interface HealthRow {
  id: string;
  label: string;
  status: string;
  tone: "ok" | "warn" | "muted";
}
