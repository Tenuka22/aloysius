/**
 * Static content for the `/media` page.
 *
 * The page is CMS-driven (`cms.getMedia` -> `blocksToMediaProps`), so this is
 * the fallback the mapper uses when nothing is published yet - the same role
 * `contact.ts` and `students.ts` play for their pages.
 */

export const MEDIA_HERO_TITLE = "Gallery & Media";
export const MEDIA_HERO_INTRO =
  "Photographs and videos from across the College - the senior play, inter-house athletics, prize day, and the ordinary days in between.";
export const MEDIA_HERO_EYEBROW = "Gallery";

export const MEDIA_GALLERY_HEADING = "Photographs & Videos";
export const MEDIA_GALLERY_INTRO =
  "Every image here is uploaded and captioned by the College. Use the filters to narrow the gallery by year or by category.";

export const MEDIA_GALLERY_COUNT = 12;

export const MEDIA_TABS = [
  { id: "photos", label: "Photos" },
  { id: "videos", label: "Videos" },
  { id: "publications", label: "Publications" },
  { id: "press", label: "Press" },
] as const;

/** Albums shown before "Load more albums". */
export const MEDIA_ALBUMS_PAGE_SIZE = 8;

export const MEDIA_VIDEOS_EYEBROW = "Video";
export const MEDIA_VIDEOS_HEADING = "College on Film";
export const MEDIA_VIDEOS_EMPTY = "No videos have been published yet.";

export const MEDIA_PUBLICATIONS_EYEBROW = "Publications";
export const MEDIA_PUBLICATIONS_HEADING = "Magazines & Reports";
export const MEDIA_PUBLICATIONS_EMPTY =
  "No publications have been published yet.";

export const MEDIA_PRESS_EYEBROW = "Press";
export const MEDIA_PRESS_HEADING = "In the Press";
export const MEDIA_PRESS_EMPTY = "No press coverage has been listed yet.";

export interface MediaLink {
  id: string;
  title: string;
  /** e.g. "Annual magazine - 2025" or the outlet and date for press. */
  meta?: string;
  href: string;
}

/**
 * Add a row to publish a publication or a press item; leave empty and the
 * section shows its empty state. `href` is a PDF, a page or an article URL.
 */
export const MEDIA_PUBLICATIONS: readonly MediaLink[] = [];
export const MEDIA_PRESS: readonly MediaLink[] = [];
