/**
 * Content for the Students page, to the approved UI/UX design
 * (Students.dc.html). Every string is a typed constant carrying real copy,
 * never a `[CMS: ...]` marker.
 */

export const STUDENTS_HERO_TITLE = "Student Life";
export const STUDENTS_HERO_INTRO =
  "Sports, societies, houses and the traditions that shape every Aloysian.";

export const SPORTS_EYEBROW = "Sports";
export const SPORTS_HEADING = "On the Field";

/** The four main sports, each with a photograph tile. */
export const MAIN_SPORTS: readonly string[] = [
  "Cricket",
  "Rugby",
  "Hockey",
  "Football",
];

/** Every other sport the College plays, listed as chips. */
export const OTHER_SPORTS: readonly string[] = [
  "Athletics",
  "Swimming",
  "Basketball",
  "Volleyball",
  "Badminton",
  "Chess",
  "Karate",
  "Boxing",
  "Wrestling",
  "Shooting",
  "Water Polo",
];

export const CLUBS_EYEBROW = "Clubs & Societies";
export const CLUBS_HEADING = "Beyond the Classroom";

/**
 * The societies shown in the grid. A description appears under a name once the
 * College publishes one for it in the club registry; until then the card is
 * just the name.
 */
export const CLUB_NAMES: readonly string[] = [
  "Photography Club",
  "Media Unit",
  "Debating Society",
  "Science Society",
  "Scouts",
  "Cadets",
  "Choir & Eastern Band",
  "Environmental Society",
];

export interface Encounter {
  sport: string;
  title: string;
  vs: string;
  note: string;
}

export const ENCOUNTERS_EYEBROW = "Big Matches";
export const ENCOUNTERS_HEADING = "Annual Encounters";
export const ENCOUNTERS_INTRO =
  "Key fixtures in the Southern Province school sports calendar, many played at Galle International Stadium.";

export const ENCOUNTERS: readonly Encounter[] = [
  {
    sport: "Cricket",
    title: "The Battle of Dreams",
    vs: "vs. Holy Cross College, Kalutara",
    note: "A two-day encounter inaugurated in 2025; the 2026 edition at Galle International Stadium ended in a draw.",
  },
  {
    sport: "Rugby",
    title: "The Aloysian – Richmond Encounter",
    vs: "vs. Richmond College, Galle",
    note: "Centre stage of the sporting calendar since the first historic match in 1992.",
  },
  {
    sport: "Basketball",
    title: "The Aloysian – Mahinda Encounter",
    vs: "vs. Mahinda College, Galle",
    note: "The annual basketball match between two Galle schools.",
  },
];

export const HOUSES_EYEBROW = "House System";
export const HOUSES_HEADING = "The College Houses";
export const HOUSES_INTRO =
  "Five houses, named after the Jesuit fathers who pioneered the College in its early days. Students are placed in a house according to their admission number.";

export interface House {
  id: string;
  name: string;
  /** The house's colour as a hex value, painted as the card's diamond. */
  color: string;
  /** Visible text naming the colour, so colour is never the only signal. */
  colorName: string;
}

export const HOUSES: readonly House[] = [
  { id: "cooreman", name: "Cooreman", color: "#A51919", colorName: "Crimson" },
  { id: "murphy", name: "Murphy", color: "#FFB203", colorName: "Gold" },
  { id: "neut", name: "Neut", color: "#013405", colorName: "Green" },
  { id: "standaert", name: "Standaert", color: "#3B5BA5", colorName: "Blue" },
  { id: "van-reeth", name: "Van Reeth", color: "#5B2A86", colorName: "Purple" },
];
