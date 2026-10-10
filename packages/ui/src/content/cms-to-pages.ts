import type { ImageSource } from "../components/primitives/media";
import {
  ALUMNI_ABOUT_BODY,
  ALUMNI_ABOUT_CAPTION,
  ALUMNI_HERO_EYEBROW,
  ALUMNI_HERO_INTRO,
  ALUMNI_HERO_TITLE,
} from "./alumni";
import type { CmsBlock } from "./cms-to-home";
import {
  CONTACT_DEFAULT_ADDRESS,
  CONTACT_HERO_INTRO,
  CONTACT_HERO_TITLE,
} from "./contact";
import {
  MEDIA_HERO_EYEBROW,
  MEDIA_HERO_INTRO,
  MEDIA_HERO_TITLE,
} from "./media";
import { NEWS_ARCHIVE_HEADING, NEWS_HERO_INTRO, NEWS_HERO_TITLE } from "./news";
import {
  NOTICES_HERO_EYEBROW,
  NOTICES_HERO_INTRO,
  NOTICES_HERO_TITLE,
} from "./notices";
import { CLUBS_HEADING, CLUBS_INTRO, STUDENTS_HERO_TITLE } from "./students";

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

/* --------------------------------------------------------------- notices */

export interface NoticesPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
}

export const blocksToNoticesProps = (blocks: CmsBlock[]): NoticesPageProps => ({
  eyebrow: fieldOrDefault(
    blocks,
    "notices-header",
    "notices-eyebrow",
    NOTICES_HERO_EYEBROW
  ),
  heading: fieldOrDefault(
    blocks,
    "notices-header",
    "notices-heading",
    NOTICES_HERO_TITLE
  ),
  tagline: fieldOrDefault(
    blocks,
    "notices-header",
    "notices-tagline",
    NOTICES_HERO_INTRO
  ),
  heroImage: imageSource(
    blocks,
    "notices-header",
    "notices-hero-image",
    "College notices and announcements"
  ),
});

/* --------------------------------------------------------------- contact */

export interface ContactPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  address?: string;
  telephone?: string;
  email?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  mapUrl?: string;
}

export const blocksToContactProps = (blocks: CmsBlock[]): ContactPageProps => ({
  eyebrow: fieldOrDefault(blocks, "contact-header", "contact-eyebrow", ""),
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
   * Telephone, email and the social links deliberately fall back to "" and not
   * to a real value. `content/contact.ts` records that the college's published
   * details are not in this repository, and `ContactDetails` omits a detail it
   * has not been given rather than rendering an empty row. An empty string here
   * is what lets that omission happen; inventing a plausible number would put a
   * wrong phone number on a live site.
   */
  telephone: fieldOrDefault(blocks, "contact-info", "contact-telephone", ""),
  email: fieldOrDefault(blocks, "contact-info", "contact-email", ""),
  facebookUrl: fieldOrDefault(blocks, "contact-info", "contact-facebook", ""),
  instagramUrl: fieldOrDefault(blocks, "contact-info", "contact-instagram", ""),
  youtubeUrl: fieldOrDefault(blocks, "contact-info", "contact-youtube", ""),
  mapUrl: fieldOrDefault(blocks, "contact-map", "contact-map-url", ""),
});

/* ---------------------------------------------------------------- alumni */

export interface AlumniPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  body?: string;
  image?: ImageSource;
  obaHref?: string;
  eventsHref?: string;
}

export const blocksToAlumniProps = (blocks: CmsBlock[]): AlumniPageProps => ({
  eyebrow: fieldOrDefault(
    blocks,
    "alumni-header",
    "alumni-eyebrow",
    ALUMNI_HERO_EYEBROW
  ),
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
  obaHref: fieldOrDefault(blocks, "alumni-links", "alumni-oba-href", ""),
  eventsHref: fieldOrDefault(blocks, "alumni-links", "alumni-events-href", ""),
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

/* ------------------------------------------------------------ admissions */

export interface AdmissionsPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  noticeText?: string;
  contactNote?: string;
}

export const blocksToAdmissionsProps = (
  blocks: CmsBlock[]
): AdmissionsPageProps => ({
  eyebrow: isHidden(blocks, "admissions-hero")
    ? undefined
    : fieldValue(blocks, "admissions-hero", "admissions-eyebrow"),
  heading: isHidden(blocks, "admissions-hero")
    ? undefined
    : fieldValue(blocks, "admissions-hero", "admissions-heading"),
  tagline: isHidden(blocks, "admissions-hero")
    ? undefined
    : fieldValue(blocks, "admissions-hero", "admissions-tagline"),
  noticeText: isHidden(blocks, "admissions-notice")
    ? undefined
    : fieldValue(blocks, "admissions-notice", "admissions-notice-text"),
  contactNote: isHidden(blocks, "admissions-contact")
    ? undefined
    : fieldValue(blocks, "admissions-contact", "admissions-contact-note"),
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

export interface StudentsPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  activitiesHeading?: string;
}

export const blocksToStudentsProps = (
  blocks: CmsBlock[]
): StudentsPageProps => ({
  eyebrow: fieldOrDefault(blocks, "students-header", "students-eyebrow", ""),
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
    CLUBS_INTRO
  ),
  heroImage: imageSource(
    blocks,
    "students-header",
    "students-hero-image",
    "Students taking part in college life"
  ),
  activitiesHeading: fieldOrDefault(
    blocks,
    "students-activities",
    "students-activities-heading",
    CLUBS_HEADING
  ),
});
