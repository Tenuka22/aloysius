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
import { ALUMNI_OBA_HREF } from "./alumni";
import { CONTACT_DEFAULT_TELEPHONE } from "./contact";
import { ADMISSIONS_URL } from "./home";
import {
  PRINCIPAL_BLOCK_ID,
  PRINCIPAL_DEFAULTS,
  PRINCIPAL_FIELD,
} from "./principal";
import {
  HOUSES_HEADING,
  HOUSES_INTRO,
  MORE_SPORTS,
  PREFECTS_BODY,
  PREFECTS_CTA_LABEL,
  PREFECTS_HEADING,
  SPORTS_EYEBROW,
  SPORTS_HEADING,
  STUDENTS_HERO_INTRO,
  STUDENTS_HERO_TITLE,
  CLUBS_EYEBROW,
  CLUBS_HEADING,
  CLUBS_INTRO,
} from "./students";

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
  "principal-portrait": "principalPortrait",
  "life-sports": "mosaicTile",
  "life-music": "mosaicTile",
  "alumni-image": "alumniPhoto",
  "founder1-image": "principalPortrait",
  "founder2-image": "principalPortrait",
  "history-1-image": "heritagePhoto",
  "history-2-image": "heritagePhoto",
  "history-3-image": "heritagePhoto",
  "history-4-image": "heritagePhoto",
  "anthem-image": "alumniPhoto",
  "anthem-sinhala-image": "alumniPhoto",
  "news-hero-image": "hero",
  "notices-hero-image": "hero",
  "media-hero-image": "hero",
  "students-hero-image": "hero",
  "students-sports-cricket": "mosaicTile",
  "students-sports-rugby": "mosaicTile",
  "students-sports-athletics": "mosaicTile",
  "alumni-hero-image": "hero",
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
      {
        id: "heritage-image-2",
        label: "Architectural detail",
        kind: "image",
        hint: "The smaller, offset image below the archival photograph.",
      },
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
        value: "Managed as a list Ã¢â‚¬â€ 4 entries",
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
        label: "1895 Ã¢â‚¬â€ Founding of the College",
        kind: "image",
        hint: "Clearing this restores the default archival photo.",
      },
      {
        id: "history-2-image",
        label: "1920s Ã¢â‚¬â€ Early Growth",
        kind: "image",
        hint: "Clearing this restores the default archival photo.",
      },
      {
        id: "history-3-image",
        label: "1971 Ã¢â‚¬â€ A Century of Excellence",
        kind: "image",
        hint: "Clearing this restores the default archival photo.",
      },
      {
        id: "history-4-image",
        label: "Today Ã¢â‚¬â€ The Modern College",
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
        id: "alumni-about-heading",
        label: "Section heading",
        kind: "text",
        value: "A Bond That Outlasts School",
      },
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
        hint: "Landscape or portrait orientation.",
      },
      {
        id: "alumni-image-caption",
        label: "Image caption",
        kind: "text",
        value: "Old Boys' Association event",
        hint: "Also used as the photograph's alt text.",
      },
    ],
  },
  {
    id: "alumni-links",
    name: "Stay Connected",
    type: "Card grid",
    status: "published",
    summary: "How an old boy gets back in touch",
    fields: [
      {
        id: "alumni-links-heading",
        label: "Section heading",
        kind: "text",
        value: "Stay Connected",
      },
      {
        id: "alumni-links-body",
        label: "Body copy",
        kind: "textarea",
        value:
          "Members can update their details with the branch secretary, or contact the College office to re-establish an address on the register.",
        wide: true,
      },
      {
        id: "alumni-oba-label",
        label: "OBA button label",
        kind: "text",
        value: "Visit the OBA",
      },
      {
        id: "alumni-oba-href",
        label: "OBA portal link",
        kind: "text",
        value: ALUMNI_OBA_HREF,
        hint: "Leave empty and the button does not appear.",
      },
      {
        id: "alumni-events-label",
        label: "Events button label",
        kind: "text",
        value: "Alumni events",
      },
      {
        id: "alumni-events-href",
        label: "Events link",
        kind: "text",
        value: "/events",
        hint: "Leave empty and the button does not appear.",
      },
    ],
  },
];

/**
 * Academics page blocks. The Principal's portrait is not here - it is the
 * global `PRINCIPAL_BLOCKS` block, read the same way every other page reads
 * it, so there is exactly one photo and one name to keep in sync, not two.
 */
export const ACADEMICS_BLOCKS: readonly PageBlock[] = [
  {
    id: "academics-leadership",
    name: "Section Leadership",
    type: "Card grid",
    status: "published",
    summary: "Primary sectional head and secondary deputy principal",
    fields: [
      {
        id: "primary-head-name",
        label: "Primary section - Sectional Head name",
        kind: "text",
        hint: "Optional. Leave empty to name the office rather than a person.",
      },
      {
        id: "primary-head-title",
        label: "Primary section - Title",
        kind: "text",
        value: "Sectional Head, Primary",
      },
      {
        id: "primary-head-photo",
        label: "Primary section - Photo",
        kind: "image",
        hint: "Portrait orientation.",
      },
      {
        id: "secondary-deputy-name",
        label: "Secondary section - Deputy Principal name",
        kind: "text",
        hint: "Optional. Leave empty to name the office rather than a person.",
      },
      {
        id: "secondary-deputy-title",
        label: "Secondary section - Title",
        kind: "text",
        value: "Deputy Principal, Secondary",
      },
      {
        id: "secondary-deputy-photo",
        label: "Secondary section - Photo",
        kind: "image",
        hint: "Portrait orientation.",
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
 *
 * One block per section the page actually renders, seeded from
 * `content/students.ts` rather than from literals: a seed that disagrees with
 * the page's own default is how an editor ends up looking at "Clubs &
 * Activities" while a visitor sees "Beyond the Classroom", and saving without
 * touching anything then overwrites the page's copy.
 *
 * The four house names and the prefects destination are seeded **empty**. The
 * college has not published them, and an empty field is the honest control -
 * the page falls back to the colour name and renders no button, rather than
 * four invented house names and a link to nowhere.
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
        value: STUDENTS_HERO_TITLE,
      },
      {
        id: "students-tagline",
        label: "Tagline",
        kind: "textarea",
        value: STUDENTS_HERO_INTRO,
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
    id: "students-sports",
    name: "Sports",
    type: "Mosaic",
    status: "published",
    summary: "The sports mosaic, its photographs and the overflow list",
    fields: [
      {
        id: "students-sports-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: SPORTS_EYEBROW,
      },
      {
        id: "students-sports-heading",
        label: "Heading",
        kind: "text",
        value: SPORTS_HEADING,
      },
      {
        id: "students-sports-cricket",
        label: "Cricket photograph",
        kind: "image",
      },
      {
        id: "students-sports-rugby",
        label: "Rugby photograph",
        kind: "image",
      },
      {
        id: "students-sports-athletics",
        label: "Athletics photograph",
        kind: "image",
      },
      {
        id: "students-more-sports",
        label: "More sports",
        kind: "textarea",
        value: MORE_SPORTS.join(", "),
        hint: "Comma-separated. Leave empty to drop the overflow panel.",
        wide: true,
      },
    ],
  },
  {
    id: "students-activities",
    name: "Clubs & Societies",
    type: "Card grid",
    status: "published",
    summary: "The society grid's heading and intro",
    fields: [
      {
        id: "students-activities-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: CLUBS_EYEBROW,
      },
      {
        id: "students-activities-heading",
        label: "Section heading",
        kind: "text",
        value: CLUBS_HEADING,
      },
      {
        id: "students-activities-intro",
        label: "Intro",
        kind: "textarea",
        value: CLUBS_INTRO,
        wide: true,
      },
    ],
  },
  {
    id: "students-houses",
    name: "Houses",
    type: "Card grid",
    status: "published",
    summary: "The four house cards and their published names",
    fields: [
      {
        id: "students-houses-eyebrow",
        label: "Eyebrow",
        kind: "text",
        value: "House system",
      },
      {
        id: "students-houses-heading",
        label: "Heading",
        kind: "text",
        value: HOUSES_HEADING,
      },
      {
        id: "students-houses-intro",
        label: "Intro",
        kind: "textarea",
        value: HOUSES_INTRO,
        wide: true,
      },
      {
        id: "students-house-crimson",
        label: "Crimson house name",
        kind: "text",
        hint: "Leave empty until the college publishes the roster.",
      },
      {
        id: "students-house-gold",
        label: "Gold house name",
        kind: "text",
        hint: "Leave empty until the college publishes the roster.",
      },
      {
        id: "students-house-green",
        label: "Green house name",
        kind: "text",
        hint: "Leave empty until the college publishes the roster.",
      },
      {
        id: "students-house-blue",
        label: "Blue house name",
        kind: "text",
        hint: "Leave empty until the college publishes the roster.",
      },
    ],
  },
  {
    id: "students-prefects",
    name: "Prefects' Guild",
    type: "Text + media",
    status: "published",
    summary: "The leadership call to action and where its button leads",
    fields: [
      {
        id: "students-prefects-heading",
        label: "Heading",
        kind: "text",
        value: PREFECTS_HEADING,
      },
      {
        id: "students-prefects-body",
        label: "Body",
        kind: "textarea",
        value: PREFECTS_BODY,
        wide: true,
      },
      {
        id: "students-prefects-cta-label",
        label: "Button label",
        kind: "text",
        value: PREFECTS_CTA_LABEL,
      },
      {
        id: "students-prefects-cta-href",
        label: "Button destination",
        kind: "select",
        options: APP_ROUTE_OPTIONS,
        hint: "The button stays hidden until a destination is chosen - there is no prefects page yet.",
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
