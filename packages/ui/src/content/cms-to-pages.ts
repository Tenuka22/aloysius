import type { ImageSource } from "../components/primitives/media";
import type { CmsBlock } from "./cms-to-home";

const fieldValue = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string
): string | undefined =>
  blocks.find((b) => b.id === blockId)?.fields.find((f) => f.id === fieldId)
    ?.value;

const fieldWithDefault = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string,
  fallback: string
): string => fieldValue(blocks, blockId, fieldId) ?? fallback;

const isHidden = (blocks: CmsBlock[], blockId: string): boolean =>
  blocks.find((b) => b.id === blockId)?.hidden ?? false;

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
  feedCount?: number;
}

export const blocksToNewsProps = (blocks: CmsBlock[]): NewsPageProps => ({
  eyebrow: isHidden(blocks, "news-header")
    ? undefined
    : fieldValue(blocks, "news-header", "news-eyebrow"),
  heading: isHidden(blocks, "news-header")
    ? undefined
    : fieldValue(blocks, "news-header", "news-heading"),
  tagline: isHidden(blocks, "news-header")
    ? undefined
    : fieldValue(blocks, "news-header", "news-tagline"),
  heroImage: imageSource(
    blocks,
    "news-header",
    "news-hero-image",
    "Latest news and events at St. Aloysius' College"
  ),
  feedHeading: isHidden(blocks, "news-feed")
    ? undefined
    : fieldValue(blocks, "news-feed", "news-feed-heading"),
  feedCount: isHidden(blocks, "news-feed")
    ? undefined
    : Number(fieldWithDefault(blocks, "news-feed", "news-feed-count", "9")),
});

/* --------------------------------------------------------------- notices */

export interface NoticesPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  pinUrgent?: boolean;
}

export const blocksToNoticesProps = (blocks: CmsBlock[]): NoticesPageProps => ({
  eyebrow: isHidden(blocks, "notices-header")
    ? undefined
    : fieldValue(blocks, "notices-header", "notices-eyebrow"),
  heading: isHidden(blocks, "notices-header")
    ? undefined
    : fieldValue(blocks, "notices-header", "notices-heading"),
  tagline: isHidden(blocks, "notices-header")
    ? undefined
    : fieldValue(blocks, "notices-header", "notices-tagline"),
  heroImage: imageSource(
    blocks,
    "notices-header",
    "notices-hero-image",
    "College notices and announcements"
  ),
  pinUrgent: isHidden(blocks, "notices-config")
    ? undefined
    : fieldWithDefault(
        blocks,
        "notices-config",
        "notices-show-pinned",
        "yes"
      ) === "yes",
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
  eyebrow: isHidden(blocks, "contact-header")
    ? undefined
    : fieldValue(blocks, "contact-header", "contact-eyebrow"),
  heading: isHidden(blocks, "contact-header")
    ? undefined
    : fieldValue(blocks, "contact-header", "contact-heading"),
  tagline: isHidden(blocks, "contact-header")
    ? undefined
    : fieldValue(blocks, "contact-header", "contact-tagline"),
  address: isHidden(blocks, "contact-info")
    ? undefined
    : fieldValue(blocks, "contact-info", "contact-address"),
  telephone: isHidden(blocks, "contact-info")
    ? undefined
    : fieldValue(blocks, "contact-info", "contact-telephone"),
  email: isHidden(blocks, "contact-info")
    ? undefined
    : fieldValue(blocks, "contact-info", "contact-email"),
  facebookUrl: isHidden(blocks, "contact-info")
    ? undefined
    : fieldValue(blocks, "contact-info", "contact-facebook"),
  instagramUrl: isHidden(blocks, "contact-info")
    ? undefined
    : fieldValue(blocks, "contact-info", "contact-instagram"),
  youtubeUrl: isHidden(blocks, "contact-info")
    ? undefined
    : fieldValue(blocks, "contact-info", "contact-youtube"),
  mapUrl: isHidden(blocks, "contact-map")
    ? undefined
    : fieldValue(blocks, "contact-map", "contact-map-url"),
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
  eyebrow: isHidden(blocks, "alumni-header")
    ? undefined
    : fieldValue(blocks, "alumni-header", "alumni-eyebrow"),
  heading: isHidden(blocks, "alumni-header")
    ? undefined
    : fieldValue(blocks, "alumni-header", "alumni-heading"),
  tagline: isHidden(blocks, "alumni-header")
    ? undefined
    : fieldValue(blocks, "alumni-header", "alumni-tagline"),
  heroImage: imageSource(
    blocks,
    "alumni-header",
    "alumni-hero-image",
    "St. Aloysius' College alumni"
  ),
  body: isHidden(blocks, "alumni-about")
    ? undefined
    : fieldValue(blocks, "alumni-about", "alumni-body"),
  image: imageSource(
    blocks,
    "alumni-about",
    "alumni-image",
    "Old Boys' Association event"
  ),
  obaHref: isHidden(blocks, "alumni-links")
    ? undefined
    : fieldValue(blocks, "alumni-links", "alumni-oba-href"),
  eventsHref: isHidden(blocks, "alumni-links")
    ? undefined
    : fieldValue(blocks, "alumni-links", "alumni-events-href"),
});

/* ----------------------------------------------------------------- media */

export interface MediaPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  galleryCount?: number;
}

export const blocksToMediaProps = (blocks: CmsBlock[]): MediaPageProps => ({
  eyebrow: isHidden(blocks, "media-header")
    ? undefined
    : fieldValue(blocks, "media-header", "media-eyebrow"),
  heading: isHidden(blocks, "media-header")
    ? undefined
    : fieldValue(blocks, "media-header", "media-heading"),
  tagline: isHidden(blocks, "media-header")
    ? undefined
    : fieldValue(blocks, "media-header", "media-tagline"),
  heroImage: imageSource(
    blocks,
    "media-header",
    "media-hero-image",
    "Photographs and videos from St. Aloysius' College"
  ),
  galleryCount: isHidden(blocks, "media-gallery")
    ? undefined
    : Number(
        fieldWithDefault(blocks, "media-gallery", "media-gallery-count", "12")
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
  eyebrow: isHidden(blocks, "students-header")
    ? undefined
    : fieldValue(blocks, "students-header", "students-eyebrow"),
  heading: isHidden(blocks, "students-header")
    ? undefined
    : fieldValue(blocks, "students-header", "students-heading"),
  tagline: isHidden(blocks, "students-header")
    ? undefined
    : fieldValue(blocks, "students-header", "students-tagline"),
  heroImage: imageSource(
    blocks,
    "students-header",
    "students-hero-image",
    "Students taking part in college life"
  ),
  activitiesHeading: isHidden(blocks, "students-activities")
    ? undefined
    : fieldValue(blocks, "students-activities", "students-activities-heading"),
});
