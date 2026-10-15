import type { ImageSource } from "../components/primitives/media";

/**
 * Static content for the `/alumni` page.
 *
 * The page is CMS-driven (`cms.getAlumni` -> `blocksToAlumniProps`), so this is
 * the fallback the mapper uses when nothing is published yet - the same role
 * `contact.ts` and `students.ts` play for their pages.
 */

/** The default title breaks after the comma, as in the design. */
export const ALUMNI_HERO_TITLE = "Once an Aloysian, Always an Aloysian";
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

/**
 * "What the Association Does" - the one sentence in `ALUMNI_ABOUT_BODY` that
 * lists the Association's activities ("run reunions, scholarships and support
 * for current students, and keep the register...") restated as a scannable
 * list rather than left buried mid-paragraph. No activity here is invented -
 * each restates a clause already in the body copy above.
 */
export const ALUMNI_OFFER_HEADING = "What the Association Does";
export interface AlumniOfferItem {
  id: string;
  title: string;
  body: string;
}
export const ALUMNI_OFFER_ITEMS: readonly AlumniOfferItem[] = [
  {
    id: "reunions",
    title: "Reunions",
    body: "Branch gatherings that bring classmates back into the same room, year after year.",
  },
  {
    id: "scholarships",
    title: "Scholarships",
    body: "Bursaries that carry the Association's support to boys still at the College.",
  },
  {
    id: "support",
    title: "Student support",
    body: "Everyday support for current students, given in the Association's own name.",
  },
  {
    id: "register",
    title: "The register",
    body: "The record that lets a lost Aloysian find his way back to the College.",
  },
];

/**
 * The Association's branches, exactly as `ALUMNI_ABOUT_BODY` names them -
 * "Branches in Galle, Colombo and overseas" - with no per-branch detail
 * invented beyond what that sentence already states collectively.
 */
export const ALUMNI_BRANCHES_HEADING = "Where to Find the Association";
export const ALUMNI_BRANCHES_INTRO =
  "Three branches carry the Association's name: one at the College itself, one in the capital, and one for every Aloysian who left the island.";
export const ALUMNI_BRANCHES: readonly string[] = [
  "Galle",
  "Colombo",
  "Overseas",
];

export const ALUMNI_LINKS_HEADING = "Stay Connected";
export const ALUMNI_LINKS_BODY =
  "Members can update their details with the branch secretary, or contact the College office to re-establish an address on the register.";
export const ALUMNI_OBA_LABEL = "Visit the OBA";

/**
 * The Association's own site.
 *
 * A published destination rather than a placeholder, because a button with no
 * destination is the one thing this page must never render: an alumnus who
 * clicks "Visit the OBA" and lands nowhere has been told the College could not
 * be bothered to say where the Association lives.
 */
export const ALUMNI_OBA_HREF = "https://sacoba.lk/";

export const ALUMNI_BRANCHES_EYEBROW = "The Association";
export const ALUMNI_BRANCHES_TITLE = "OBA Branches Worldwide";

export interface AlumniBranch {
  id: string;
  name: string;
  /** Contact or president, shown under the name. Omitted until supplied. */
  contact?: string;
  /** Adds a "Branch Details" link. Omitted until the branch has a page. */
  href?: string;
}

/**
 * The branch cards. Add `contact` and `href` to a row as the details are
 * confirmed - a card without them still renders as just the branch name. An
 * empty list hides the section.
 */
export const ALUMNI_BRANCH_CARDS: readonly AlumniBranch[] = [
  { id: "galle", name: "Galle (Main Branch)" },
  { id: "colombo", name: "Colombo Branch" },
  { id: "overseas", name: "Overseas Branches" },
];

export const ALUMNI_NOTABLES_EYEBROW = "Hall of Fame";
export const ALUMNI_NOTABLES_TITLE = "Distinguished Aloysians";
export const ALUMNI_NOTABLES_LABEL = "Distinguished Aloysians";

export interface DistinguishedAloysian {
  id: string;
  /** Left unset until the person is confirmed; the portrait slot still shows. */
  name?: string;
  field: string;
  image?: ImageSource;
}

/**
 * The Hall of Fame. Set `name` and `image: { src, alt }` on a row to fill it in,
 * or append rows. An empty list hides the section.
 */
export const ALUMNI_NOTABLES: readonly DistinguishedAloysian[] = [
  { id: "public-service", field: "Public Service" },
  { id: "academia", field: "Academia" },
  { id: "sport", field: "Sport" },
  { id: "arts-culture", field: "Arts & Culture" },
];
