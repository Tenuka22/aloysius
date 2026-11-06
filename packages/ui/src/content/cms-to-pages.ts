import type { ImageSource } from "../components/primitives/media";
import { ACADEMICS_HERO_INTRO, ACADEMICS_HERO_TITLE } from "./academics";
import { ALUMNI_HERO_INTRO, ALUMNI_HERO_TITLE } from "./alumni";
import type { CmsBlock } from "./cms-to-home";
import {
  CONTACT_DEFAULT_ADDRESS,
  CONTACT_DEFAULT_FACEBOOK_URL,
  CONTACT_DEFAULT_INSTAGRAM_URL,
  CONTACT_DEFAULT_YOUTUBE_URL,
  CONTACT_DEFAULT_EMAIL,
  CONTACT_DEFAULT_TELEPHONE,
  CONTACT_HERO_INTRO,
  CONTACT_HERO_TITLE,
  CONTACT_MAP_EMBED_URL,
  CONTACT_MAP_URL,
} from "./contact";
import { GALLERIES_HERO_INTRO, GALLERIES_HERO_TITLE } from "./galleries";
import { MEDIA_HERO_TITLE } from "./media";
import { NEWS_HERO_TITLE } from "./news";
import { STUDENTS_HERO_INTRO, STUDENTS_HERO_TITLE } from "./students";

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
  heading?: string;
}

export const blocksToNewsProps = (blocks: CmsBlock[]): NewsPageProps => ({
  heading: fieldOrDefault(
    blocks,
    "news-header",
    "news-heading",
    NEWS_HERO_TITLE
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
  facebookUrl: fieldOrDefault(
    blocks,
    "contact-info",
    "contact-facebook",
    CONTACT_DEFAULT_FACEBOOK_URL
  ),
  instagramUrl: fieldOrDefault(
    blocks,
    "contact-info",
    "contact-instagram",
    CONTACT_DEFAULT_INSTAGRAM_URL
  ),
  youtubeUrl: fieldOrDefault(
    blocks,
    "contact-info",
    "contact-youtube",
    CONTACT_DEFAULT_YOUTUBE_URL
  ),
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
});

/* ------------------------------------------------------------- galleries */

export interface GalleriesPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
}

/**
 * The `/galleries` index masthead.
 *
 * Only the page around the photographs is CMS content; the photographs are
 * approved `gallery` rows and are edited at `/cms/galleries`.
 */
export const blocksToGalleriesProps = (
  blocks: CmsBlock[]
): GalleriesPageProps => ({
  eyebrow: fieldOrDefault(blocks, "galleries-header", "galleries-eyebrow", ""),
  heading: fieldOrDefault(
    blocks,
    "galleries-header",
    "galleries-heading",
    GALLERIES_HERO_TITLE
  ),
  tagline: fieldOrDefault(
    blocks,
    "galleries-header",
    "galleries-tagline",
    GALLERIES_HERO_INTRO
  ),
  heroImage: imageSource(
    blocks,
    "galleries-header",
    "galleries-hero-image",
    "Photographs from around St. Aloysius' College"
  ),
});

/* ------------------------------------------------------------- academics */

export interface AcademicsHeaderProps {
  heading?: string;
  tagline?: string;
}

/**
 * The Academics page header.
 *
 * Same shape as `blocksToNewsProps` and for the same reason: the hero used to
 * read its title and tagline straight from `content/academics.ts`, which left
 * it the one page header on the site a CMS editor could not change.
 */
export const blocksToAcademicsHeaderProps = (
  blocks: CmsBlock[]
): AcademicsHeaderProps => ({
  heading: fieldOrDefault(
    blocks,
    "academics-header",
    "academics-heading",
    ACADEMICS_HERO_TITLE
  ),
  tagline: fieldOrDefault(
    blocks,
    "academics-header",
    "academics-tagline",
    ACADEMICS_HERO_INTRO
  ),
});

/* ----------------------------------------------------------------- media */

export interface MediaPageProps {
  heading?: string;
}

export const blocksToMediaProps = (blocks: CmsBlock[]): MediaPageProps => ({
  heading: fieldOrDefault(
    blocks,
    "media-header",
    "media-heading",
    MEDIA_HERO_TITLE
  ),
});

/* -------------------------------------------------------------- students */

export interface StudentsPageProps {
  heading?: string;
  tagline?: string;
}

export const blocksToStudentsProps = (
  blocks: CmsBlock[]
): StudentsPageProps => ({
  heading: fieldOrDefault(
    blocks,
    "students-header",
    "students-heading",
    STUDENTS_HERO_TITLE
  ),
  tagline: fieldOrDefault(
    blocks,
    "students-header",
    "students-tagline",
    STUDENTS_HERO_INTRO
  ),
});
