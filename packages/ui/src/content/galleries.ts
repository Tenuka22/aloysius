/**
 * Content for the `/galleries` index page.
 *
 * The page's masthead is CMS content (`GALLERIES_BLOCKS` in `content/cms.ts`);
 * these are the shipped defaults it falls back to, kept here rather than inline
 * in the component so the CMS registry can seed the same strings the page
 * renders when nothing has been published.
 *
 * The gallery list itself is not in this file. It is database content - the
 * approved `gallery` rows - and it is already editable at `/cms/galleries`.
 */

export const GALLERIES_HERO_TITLE = "Galleries";
export const GALLERIES_HERO_INTRO =
  "Photographs from around the college, published once a CMS reviewer has approved them.";
