/**
 * Static content for the `/alumni` page.
 *
 * The page is CMS-driven (`cms.getAlumni` -> `blocksToAlumniProps`), so this is
 * the fallback the mapper uses when nothing is published yet - the same role
 * `contact.ts` and `students.ts` play for their pages.
 */

export const ALUMNI_HERO_TITLE = "Alumni";
export const ALUMNI_HERO_INTRO =
  "The Old Boys' Association of St. Aloysius' College connects generations of Aloysians, wherever in the world they now live.";

/*
 * `ALUMNI_HERO_EYEBROW` was removed with the eyebrow it fed: the page has no
 * kicker above its `h1`, and leaving the constant here would invite someone to
 * wire one back up.
 */

export const ALUMNI_ABOUT_HEADING = "A Bond That Outlasts School";
export const ALUMNI_ABOUT_BODY =
  "Every Aloysian leaves with a certificate and keeps something less formal: a common name, a common address, and a few thousand others who sat the same examinations. The Association is how that stays true after the fifth year, through the decades that follow, and across the world. Branches in Galle, Colombo and overseas run reunions, scholarships and support for current students, and keep the register that lets a lost Aloysian find his way back to the College.";
export const ALUMNI_ABOUT_CAPTION = "Old Boys' Association event";

export const ALUMNI_LINKS_HEADING = "Stay Connected";
export const ALUMNI_LINKS_BODY =
  "Members can update their details with the branch secretary, or contact the College office to re-establish an address on the register.";
export const ALUMNI_OBA_LABEL = "Visit the OBA";
export const ALUMNI_EVENTS_LABEL = "Alumni events";

/**
 * The Association's own site.
 *
 * A published destination rather than a placeholder, because a button with no
 * destination is the one thing this page must never render: an alumnus who
 * clicks "Visit the OBA" and lands nowhere has been told the College could not
 * be bothered to say where the Association lives.
 */
export const ALUMNI_OBA_HREF = "https://sacoba.lk/";
