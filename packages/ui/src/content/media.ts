/**
 * Content for the `/media` page, to the approved UI/UX design
 * (Media.dc.html). The page has a Photos section and a Videos section and
 * nothing else.
 */

export const MEDIA_HERO_TITLE = "Gallery & Media";

export const MEDIA_TABS = [
  { id: "photos", label: "Photos" },
  { id: "videos", label: "Videos" },
] as const;

/** Albums shown before "Load more albums": one full cycle of the mosaic. */
export const MEDIA_ALBUMS_PAGE_SIZE = 8;

export const MEDIA_VIDEOS_EYEBROW = "Video";
export const MEDIA_VIDEOS_HEADING = "College on Film";
export const MEDIA_VIDEOS_EMPTY = "No videos have been published yet.";
