import type { JumpLink } from "./about";

/**
 * Content for the Students page, following the same rule as
 * `content/academics.ts`: every string is a typed constant carrying real copy,
 * never a `[CMS: ...]` marker.
 *
 * Facts the college has not published - the four house names, what each club
 * actually does, where "Meet the Prefects" should lead - are modelled as
 * optional fields. The sections that use them degrade to an honest empty state
 * rather than inventing a name, a description or a destination.
 */

export const STUDENTS_HERO_TITLE = "Student Life";
export const STUDENTS_HERO_INTRO =
  "Sports, societies, houses and the traditions that shape every Aloysian - the hours between lessons that decide what kind of Aloysian a boy becomes.";

export const STUDENTS_JUMP_LINKS: readonly JumpLink[] = [
  { label: "Sports", href: "#sports" },
  { label: "Clubs & Societies", href: "#clubs" },
  { label: "Houses", href: "#houses" },
  { label: "Prefects", href: "#prefects" },
];

/**
 * A tile in the sports mosaic. `span` selects the tile's footprint in the
 * 6-column desktop grid; below 64rem it is ignored and every tile is full
 * width (or half, from 40rem).
 */
export interface SportTile {
  id: string;
  name: string;
  /** Caption for the branded box shown until a photograph is supplied. */
  placeholder: string;
  span: "feature" | "half" | "third";
}

/**
 * Exactly the sports the design names, and no others. Adding a plausible-
 * looking sport here would be inventing a fact about the college.
 */
export const SPORT_TILES: readonly SportTile[] = [
  {
    id: "cricket",
    name: "Cricket",
    placeholder: "Cricket - big match photograph",
    span: "feature",
  },
  {
    id: "rugby",
    name: "Rugby",
    placeholder: "Rugby",
    span: "third",
  },
  {
    id: "athletics",
    name: "Athletics",
    placeholder: "Athletics",
    span: "third",
  },
];

export const SPORTS_EYEBROW = "Sports";
export const SPORTS_HEADING = "On the Field";
export const MORE_SPORTS_TITLE = "More sports";
/** Named in the design's own "more sports" panel, so they are the college's list. */
export const MORE_SPORTS: readonly string[] = ["Swimming", "Football", "Chess"];

export interface Club {
  id: string;
  name: string;
  /** Omitted until the college publishes what the society does. */
  description?: string;
}

export const CLUBS: readonly Club[] = [
  { id: "debating", name: "Debating Society" },
  { id: "science", name: "Science Society" },
  { id: "media", name: "Media Unit" },
  { id: "interact", name: "Interact Club" },
  { id: "scouts", name: "Scouts" },
  { id: "cadets", name: "Cadets" },
  { id: "choir", name: "Choir & Eastern Band" },
  { id: "environment", name: "Environmental Society" },
];

export const CLUBS_EYEBROW = "Clubs & societies";
export const CLUBS_HEADING = "Beyond the Classroom";
export const CLUBS_INTRO =
  "Every boy belongs to at least one society. They meet through the week, run the college's events, and carry its name to competitions across the Southern Province.";

/**
 * The four house colours, as a token key rather than a hex string: the content
 * layer names the colour, the component owns how it is painted. `colorName` is
 * real visible text, not a caption for the swatch - the swatch itself is
 * decorative, so colour is never the only thing carrying a house's identity
 * (WCAG 2.2 SC 1.4.1).
 */
export interface House {
  id: string;
  swatch: "crimson" | "gold" | "green" | "blue";
  colorName: string;
  /** Omitted until the college publishes the house roster. */
  name?: string;
}

export const HOUSES: readonly House[] = [
  { id: "crimson", swatch: "crimson", colorName: "Crimson" },
  { id: "gold", swatch: "gold", colorName: "Gold" },
  { id: "green", swatch: "green", colorName: "Green" },
  { id: "blue", swatch: "blue", colorName: "Blue" },
];

export const HOUSES_EYEBROW = "House system";
export const HOUSES_HEADING = "The College Houses";
export const HOUSES_INTRO =
  "Every student joins one of four houses on the day he enrols and competes for it until the day he leaves - on the track, in the pool, on the debating floor and at the inter-house athletics meet.";

export const PREFECTS_HEADING = "Prefects' Guild & Student Leadership";
export const PREFECTS_BODY =
  "The Guild is the senior school's own body of leadership, service and discipline. Its members keep the college's daily order and represent the student body to the staff.";
export const PREFECTS_CTA_LABEL = "Meet the prefects";
