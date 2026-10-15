import type { ImageSource } from "../components/primitives/media";
import {
  ALUMNI_ABOUT_BODY,
  ALUMNI_ABOUT_CAPTION,
  ALUMNI_ABOUT_HEADING,
  ALUMNI_BRANCHES_HEADING,
  ALUMNI_BRANCHES_INTRO,
  ALUMNI_HERO_INTRO,
  ALUMNI_HERO_TITLE,
  ALUMNI_LINKS_BODY,
  ALUMNI_LINKS_HEADING,
  ALUMNI_OBA_HREF,
  ALUMNI_OBA_LABEL,
  ALUMNI_OFFER_HEADING,
} from "./alumni";
import type { CmsBlock } from "./cms-to-home";
import {
  CONTACT_DEFAULT_ADDRESS,
  CONTACT_DEFAULT_EMAIL,
  CONTACT_DEFAULT_TELEPHONE,
  CONTACT_HERO_INTRO,
  CONTACT_HERO_TITLE,
  CONTACT_MAP_EMBED_URL,
  CONTACT_MAP_URL,
} from "./contact";
import {
  MEDIA_HERO_EYEBROW,
  MEDIA_HERO_INTRO,
  MEDIA_HERO_TITLE,
} from "./media";
import { NEWS_ARCHIVE_HEADING, NEWS_HERO_INTRO, NEWS_HERO_TITLE } from "./news";
import {
  CLUBS_EYEBROW,
  CLUBS_HEADING,
  CLUBS_INTRO,
  HOUSES_EYEBROW,
  HOUSES_HEADING,
  HOUSES_INTRO,
  MORE_SPORTS,
  PREFECTS_BODY,
  PREFECTS_HEADING,
  SPORTS_EYEBROW,
  SPORTS_HEADING,
  STUDENTS_HERO_INTRO,
  STUDENTS_HERO_TITLE,
} from "./students";

const fieldValue = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string
): string | undefined =>
  blocks.find((b) => b.id === blockId)?.fields.find((f) => f.id === fieldId)
    ?.value;

/**
 * The CMS value for a field, or the page's own static content when there isn't
 * one.
 *
 * This is the whole reason `blocksTo*Props` can be called with an empty array.
 * Before it existed, an unpublished page produced `undefined` for every field,
 * which rendered as a heading, a subheading, and then a bare "content will be
 * displayed here once published" - the page had content in `content/<page>.ts`
 * the whole time and simply never looked at it.
 *
 * A field present-but-blank still falls back, because an editor who clears a
 * field in the CMS means "use the default", not "render nothing". Only an
 * explicitly hidden block (`isHidden`) suppresses the fallback - that is a
 * deliberate editorial decision to remove the section.
 */
const isHidden = (blocks: CmsBlock[], blockId: string): boolean =>
  blocks.find((b) => b.id === blockId)?.hidden ?? false;

const fieldOrDefault = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string,
  fallback: string
): string | undefined =>
  isHidden(blocks, blockId)
    ? undefined
    : fieldValue(blocks, blockId, fieldId) || fallback;

const imageSource = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string,
  alt: string
): ImageSource | undefined => {
  if (isHidden(blocks, blockId)) {
    return undefined;
  }
  const block = blocks.find((candidate) => candidate.id === blockId);
  const field = block?.fields.find((candidate) => candidate.id === fieldId);
  const value = field?.value;
  if (!value) {
    return undefined;
  }

  return {
    src: value.startsWith("image:") ? value.slice("image:".length) : value,
    alt,
    ...(field.aspectRatio ? { aspectRatio: field.aspectRatio } : {}),
  };
};

/* ------------------------------------------------------------------ news */

export interface NewsPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  feedHeading?: string;
}

export const blocksToNewsProps = (blocks: CmsBlock[]): NewsPageProps => ({
  eyebrow: fieldOrDefault(blocks, "news-header", "news-eyebrow", ""),
  heading: fieldOrDefault(
    blocks,
    "news-header",
    "news-heading",
    NEWS_HERO_TITLE
  ),
  tagline: fieldOrDefault(
    blocks,
    "news-header",
    "news-tagline",
    NEWS_HERO_INTRO
  ),
  heroImage: imageSource(
    blocks,
    "news-header",
    "news-hero-image",
    "Latest news and events at St. Aloysius' College"
  ),
  feedHeading: fieldOrDefault(
    blocks,
    "news-feed",
    "news-feed-heading",
    NEWS_ARCHIVE_HEADING
  ),
});

/* --------------------------------------------------------------- contact */

export interface ContactPageProps {
  heading?: string;
  tagline?: string;
  address?: string;
  telephone?: string;
  email?: string;
  officeHours?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  mapUrl?: string;
  mapEmbedUrl?: string;
}

export const blocksToContactProps = (blocks: CmsBlock[]): ContactPageProps => ({
  heading: fieldOrDefault(
    blocks,
    "contact-header",
    "contact-heading",
    CONTACT_HERO_TITLE
  ),
  tagline: fieldOrDefault(
    blocks,
    "contact-header",
    "contact-tagline",
    CONTACT_HERO_INTRO
  ),
  address: fieldOrDefault(
    blocks,
    "contact-info",
    "contact-address",
    CONTACT_DEFAULT_ADDRESS
  ),
  /*
   * The address, telephone and email now fall back to published defaults rather
   * than to "" - see the sourcing notes on each constant in content/contact.ts.
   * All three remain overridable in the CMS. The social links and map URL still
   * fall back to "", because no public source states them and inventing a
   * Facebook page for the college is not something a guess should do.
   */
  telephone: fieldOrDefault(
    blocks,
    "contact-info",
    "contact-telephone",
    CONTACT_DEFAULT_TELEPHONE
  ),
  email: fieldOrDefault(
    blocks,
    "contact-info",
    "contact-email",
    CONTACT_DEFAULT_EMAIL
  ),
  facebookUrl: fieldOrDefault(blocks, "contact-info", "contact-facebook", ""),
  instagramUrl: fieldOrDefault(blocks, "contact-info", "contact-instagram", ""),
  youtubeUrl: fieldOrDefault(blocks, "contact-info", "contact-youtube", ""),
  /*
   * Both map fields now carry real defaults rather than `""`. The embed is a
   * Google Maps iframe on the College's registered place and the link is that
   * same place - so an unpublished contact page shows a working map and a
   * working "View on map" rather than a placeholder box and a badge that does
   * nothing. Both stay overridable in the CMS.
   */
  mapUrl: fieldOrDefault(
    blocks,
    "contact-map",
    "contact-map-url",
    CONTACT_MAP_URL
  ),
  /*
   * The embedded map. Defaults to the Google Maps `output=embed` iframe for the
   * College's place in Kaluwella, Galle - no API key, no account - with the
   * coordinates CMS-overridable for the day the College supplies its exact
   * position.
   */
  mapEmbedUrl: fieldOrDefault(
    blocks,
    "contact-map",
    "contact-map-embed",
    CONTACT_MAP_EMBED_URL
  ),
  /*
   * Office hours stay optional and unfilled. No published source states them,
   * and a wrong set of hours misdirects exactly the visitor who most needs
   * accurate ones - so the details list omits the row until the College office
   * supplies it.
   */
  officeHours: fieldOrDefault(
    blocks,
    "contact-info",
    "contact-office-hours",
    ""
  ),
});

/* ---------------------------------------------------------------- alumni */

export interface AlumniPageProps {
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  aboutHeading?: string;
  body?: string;
  image?: ImageSource;
  imageCaption?: string;
  offerHeading?: string;
  branchesHeading?: string;
  branchesIntro?: string;
  linksHeading?: string;
  linksBody?: string;
  obaHref?: string;
  obaLabel?: string;
}

export const blocksToAlumniProps = (blocks: CmsBlock[]): AlumniPageProps => ({
  heading: fieldOrDefault(
    blocks,
    "alumni-header",
    "alumni-heading",
    ALUMNI_HERO_TITLE
  ),
  tagline: fieldOrDefault(
    blocks,
    "alumni-header",
    "alumni-tagline",
    ALUMNI_HERO_INTRO
  ),
  heroImage: imageSource(
    blocks,
    "alumni-header",
    "alumni-hero-image",
    "St. Aloysius' College alumni"
  ),
  aboutHeading: fieldOrDefault(
    blocks,
    "alumni-about",
    "alumni-about-heading",
    ALUMNI_ABOUT_HEADING
  ),
  body: fieldOrDefault(
    blocks,
    "alumni-about",
    "alumni-body",
    ALUMNI_ABOUT_BODY
  ),
  image: imageSource(
    blocks,
    "alumni-about",
    "alumni-image",
    ALUMNI_ABOUT_CAPTION
  ),
  imageCaption: fieldOrDefault(
    blocks,
    "alumni-about",
    "alumni-image-caption",
    ALUMNI_ABOUT_CAPTION
  ),
  offerHeading: fieldOrDefault(
    blocks,
    "alumni-offer",
    "alumni-offer-heading",
    ALUMNI_OFFER_HEADING
  ),
  branchesHeading: fieldOrDefault(
    blocks,
    "alumni-branches",
    "alumni-branches-heading",
    ALUMNI_BRANCHES_HEADING
  ),
  branchesIntro: fieldOrDefault(
    blocks,
    "alumni-branches",
    "alumni-branches-intro",
    ALUMNI_BRANCHES_INTRO
  ),
  linksHeading: fieldOrDefault(
    blocks,
    "alumni-links",
    "alumni-links-heading",
    ALUMNI_LINKS_HEADING
  ),
  linksBody: fieldOrDefault(
    blocks,
    "alumni-links",
    "alumni-links-body",
    ALUMNI_LINKS_BODY
  ),
  /*
   * Both destinations default to a real page rather than to nothing. There was
   * no OBA portal URL in the database, and with both fields blank the "Stay
   * connected" band rendered no buttons at all - so the guidance copy the
   * project had already written was hidden behind a missing field.
   */
  obaHref: fieldOrDefault(
    blocks,
    "alumni-links",
    "alumni-oba-href",
    ALUMNI_OBA_HREF
  ),
  obaLabel: fieldOrDefault(
    blocks,
    "alumni-links",
    "alumni-oba-label",
    ALUMNI_OBA_LABEL
  ),
});

/* ------------------------------------------------------------- academics */

export interface AcademicsLeaderProps {
  name?: string;
  title?: string;
  photo?: ImageSource;
}

export interface AcademicsLeadershipProps {
  primaryHead: AcademicsLeaderProps;
  secondaryDeputy: AcademicsLeaderProps;
}

/**
 * The Principal's own name/title/portrait are not read here - they come from
 * the global Principal block (`principalContent`), the same object every
 * other page reads, so the Academics page composes its leadership row from
 * that plus these two section-level roles rather than storing a third copy
 * of the Principal's photo.
 */
export const blocksToAcademicsLeadership = (
  blocks: CmsBlock[]
): AcademicsLeadershipProps => ({
  primaryHead: {
    name: isHidden(blocks, "academics-leadership")
      ? undefined
      : fieldValue(blocks, "academics-leadership", "primary-head-name"),
    title: isHidden(blocks, "academics-leadership")
      ? undefined
      : fieldValue(blocks, "academics-leadership", "primary-head-title"),
    photo: imageSource(
      blocks,
      "academics-leadership",
      "primary-head-photo",
      "Primary section head"
    ),
  },
  secondaryDeputy: {
    name: isHidden(blocks, "academics-leadership")
      ? undefined
      : fieldValue(blocks, "academics-leadership", "secondary-deputy-name"),
    title: isHidden(blocks, "academics-leadership")
      ? undefined
      : fieldValue(blocks, "academics-leadership", "secondary-deputy-title"),
    photo: imageSource(
      blocks,
      "academics-leadership",
      "secondary-deputy-photo",
      "Secondary section deputy principal"
    ),
  },
});

/* ----------------------------------------------------------------- media */

export interface MediaPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
}

export const blocksToMediaProps = (blocks: CmsBlock[]): MediaPageProps => ({
  eyebrow: fieldOrDefault(
    blocks,
    "media-header",
    "media-eyebrow",
    MEDIA_HERO_EYEBROW
  ),
  heading: fieldOrDefault(
    blocks,
    "media-header",
    "media-heading",
    MEDIA_HERO_TITLE
  ),
  tagline: fieldOrDefault(
    blocks,
    "media-header",
    "media-tagline",
    MEDIA_HERO_INTRO
  ),
  heroImage: imageSource(
    blocks,
    "media-header",
    "media-hero-image",
    "Photographs and videos from St. Aloysius' College"
  ),
});

/* -------------------------------------------------------------- students */

/**
 * A field with no default.
 *
 * `fieldOrDefault` treats a blank as "use the page's copy", which is right for
 * headings but wrong for facts the college has not published: a house name and
 * a prefects destination are either true or absent. Blank means absent here,
 * so the page falls back to the colour name and renders no button rather than
 * inventing one.
 */
const optionalField = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string
): string | undefined => {
  if (isHidden(blocks, blockId)) {
    return undefined;
  }
  const value = fieldValue(blocks, blockId, fieldId)?.trim();
  return value || undefined;
};

/**
 * A comma-separated CMS field as a list, falling back to the page's own list.
 * Returns `undefined` - rather than an empty list - when the block is hidden,
 * so the caller can tell "not published" from "published as empty".
 */
const listField = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string,
  fallback: readonly string[]
): readonly string[] | undefined => {
  if (isHidden(blocks, blockId)) {
    return undefined;
  }
  const value = fieldValue(blocks, blockId, fieldId);
  if (!value?.trim()) {
    return fallback;
  }
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  // Every entry cleared is a deliberate "drop the panel", not a request for
  // the default list back.
  return items.length > 0 ? items : [];
};

/** The students section headings, resolved across every sport tile at once. */
const STUDENT_SPORT_IMAGE_FIELDS: readonly [string, string][] = [
  ["cricket", "students-sports-cricket"],
  ["rugby", "students-sports-rugby"],
  ["athletics", "students-sports-athletics"],
];

const STUDENT_HOUSE_NAME_FIELDS: readonly [string, string][] = [
  ["crimson", "students-house-crimson"],
  ["gold", "students-house-gold"],
  ["green", "students-house-green"],
  ["blue", "students-house-blue"],
];

export interface StudentsPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  activitiesEyebrow?: string;
  activitiesHeading?: string;
  activitiesIntro?: string;
  sportsEyebrow?: string;
  sportsHeading?: string;
  /** Keyed by `SportTile.id`, matching `content/students.ts`. */
  sportImages?: Record<string, ImageSource>;
  moreSports?: readonly string[];
  housesEyebrow?: string;
  housesHeading?: string;
  housesIntro?: string;
  /** Keyed by `House.id`; absent for a house the college has not named. */
  houseNames?: Record<string, string>;
  prefectsHeading?: string;
  prefectsBody?: string;
}

export const blocksToStudentsProps = (
  blocks: CmsBlock[]
): StudentsPageProps => {
  const sportImages: Record<string, ImageSource> = {};
  for (const [tileId, fieldId] of STUDENT_SPORT_IMAGE_FIELDS) {
    const source = imageSource(
      blocks,
      "students-sports",
      fieldId,
      `A college ${tileId} photograph`
    );
    if (source) {
      sportImages[tileId] = source;
    }
  }

  const houseNames: Record<string, string> = {};
  for (const [houseId, fieldId] of STUDENT_HOUSE_NAME_FIELDS) {
    const name = optionalField(blocks, "students-houses", fieldId);
    if (name) {
      houseNames[houseId] = name;
    }
  }

  return {
    eyebrow: fieldOrDefault(blocks, "students-header", "students-eyebrow", ""),
    heading: fieldOrDefault(
      blocks,
      "students-header",
      "students-heading",
      STUDENTS_HERO_TITLE
    ),
    /*
     * Was `CLUBS_INTRO`, which made the hero intro and the clubs section intro
     * render the same paragraph twice on one page. The hero has its own line.
     */
    tagline: fieldOrDefault(
      blocks,
      "students-header",
      "students-tagline",
      STUDENTS_HERO_INTRO
    ),
    heroImage: imageSource(
      blocks,
      "students-header",
      "students-hero-image",
      "Students taking part in college life"
    ),

    sportsEyebrow: fieldOrDefault(
      blocks,
      "students-sports",
      "students-sports-eyebrow",
      SPORTS_EYEBROW
    ),
    sportsHeading: fieldOrDefault(
      blocks,
      "students-sports",
      "students-sports-heading",
      SPORTS_HEADING
    ),
    sportImages,
    moreSports: listField(
      blocks,
      "students-sports",
      "students-more-sports",
      MORE_SPORTS
    ),

    activitiesEyebrow: fieldOrDefault(
      blocks,
      "students-activities",
      "students-activities-eyebrow",
      CLUBS_EYEBROW
    ),
    activitiesHeading: fieldOrDefault(
      blocks,
      "students-activities",
      "students-activities-heading",
      CLUBS_HEADING
    ),
    activitiesIntro: fieldOrDefault(
      blocks,
      "students-activities",
      "students-activities-intro",
      CLUBS_INTRO
    ),

    housesEyebrow: fieldOrDefault(
      blocks,
      "students-houses",
      "students-houses-eyebrow",
      HOUSES_EYEBROW
    ),
    housesHeading: fieldOrDefault(
      blocks,
      "students-houses",
      "students-houses-heading",
      HOUSES_HEADING
    ),
    housesIntro: fieldOrDefault(
      blocks,
      "students-houses",
      "students-houses-intro",
      HOUSES_INTRO
    ),
    houseNames,

    prefectsHeading: fieldOrDefault(
      blocks,
      "students-prefects",
      "students-prefects-heading",
      PREFECTS_HEADING
    ),
    prefectsBody: fieldOrDefault(
      blocks,
      "students-prefects",
      "students-prefects-body",
      PREFECTS_BODY
    ),
  };
};
