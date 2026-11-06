/**
 * Content for the `/alumni` page, to the approved UI/UX design
 * (Alumni.dc.html). Every string is a typed constant carrying real copy, never
 * a `[CMS: ...]` marker.
 */

/** The default title breaks after the comma, as in the design. */
export const ALUMNI_HERO_TITLE = "Once an Aloysian, Always an Aloysian";
export const ALUMNI_HERO_INTRO =
  "The Old Boys’ Association and the global Aloysian family.";

export const ALUMNI_NOTABLES_LABEL = "Distinguished Aloysians";

/* ------------------------------------------------------------- branches */

export const ALUMNI_BRANCHES_EYEBROW = "The Association";
export const ALUMNI_BRANCHES_HEADING = "One Brotherhood, Across the World";
export const ALUMNI_BRANCHES_INTRO =
  "Wherever Aloysians settle, the Old Boys’ Association keeps them close to the College — from Galle and Colombo to branches overseas.";

/**
 * A branch of the Association. `contact` (a president, phone or email) and
 * `href` (the branch's own page) come from the CMS roster, matched by name;
 * until they are supplied a branch is just its name and what it is.
 */
export interface AlumniBranch {
  id: string;
  name: string;
  /** What the branch is, e.g. "Main branch · Home of the Association". */
  description?: string;
  /** Contact or president, shown after the description. */
  contact?: string;
  /** Makes the branch a link. Omitted until the branch has a page. */
  href?: string;
}

/** The two home-country branches, numbered 01 and 02 in the design. */
export const ALUMNI_LOCAL_BRANCHES: readonly AlumniBranch[] = [
  {
    id: "galle",
    name: "Galle",
    description: "Main branch · Home of the Association",
    href: "https://sacoba.lk/",
  },
  {
    id: "colombo",
    name: "Colombo",
    description: "Colombo branch",
    href: "https://sacobacolombo.org/",
  },
];

export const ALUMNI_OVERSEAS_HEADING = "Overseas";
export const ALUMNI_OVERSEAS_DESCRIPTION = "Branches of the Association abroad";

/** The three overseas branches, numbered 03 in the design as one group. */
export const ALUMNI_OVERSEAS_BRANCHES: readonly AlumniBranch[] = [
  { id: "melbourne", name: "Melbourne" },
  {
    id: "london",
    name: "London",
    href: "https://staloysiusobauk.weebly.com/",
  },
  { id: "new-zealand", name: "New Zealand" },
];

/**
 * Maps a stored `alumni_notable.category` value to its display label. Used by
 * the CMS roster editor; kept in sync by hand with `ALUMNI_NOTABLE_CATEGORIES`
 * in `@aloysius/db/schema/alumni-notables`, since the `ui` package never
 * imports from `db`.
 */
export const ALUMNI_NOTABLE_CATEGORY_LABELS: Record<string, string> = {
  "public-service": "Public Service",
  academia: "Academia",
  sport: "Sport",
  "arts-culture": "Arts & Culture",
};

/* --------------------------------------------------------- hall of fame */

export const ALUMNI_NOTABLES_EYEBROW = "Hall of Fame";
export const ALUMNI_NOTABLES_TITLE = "Distinguished Aloysians";

export interface DistinguishedAloysian {
  id: string;
  name: string;
  /** What they are known for, set in gold capitals under the name. */
  field: string;
  /** A line about them. */
  note: string;
}

/** The four featured Aloysians, each with a portrait. */
export const ALUMNI_NOTABLES: readonly DistinguishedAloysian[] = [
  {
    id: "sarachchandra",
    name: "Ediriweera Sarachchandra",
    field: "Literature & Theatre",
    note: "Playwright, novelist, poet and literary critic.",
  },
  {
    id: "ponnamperuma",
    name: "Cyril Ponnamperuma",
    field: "Science",
    note: "Exobiology scientist at NASA’s Ames Research Center.",
  },
  {
    id: "santha",
    name: "Sunil Santha",
    field: "Music",
    note: "Musician, composer, singer and lyricist.",
  },
  {
    id: "kottegoda",
    name: "Shantha Kottegoda",
    field: "Defence",
    note: "General, Commander of the Army (2004–2005).",
  },
];

export interface NotableAlumnus {
  name: string;
  note: string;
}

/** The longer roll of notable Aloysians beneath the four portraits. */
export const ALUMNI_ROLL: readonly NotableAlumnus[] = [
  {
    name: "R. I. T. Alles",
    note: "Educationist, founder of D. S. Senanayake College",
  },
  {
    name: "N. U. Jayawardena",
    note: "Economist, Governor of the Central Bank of Ceylon (1953–1954)",
  },
  {
    name: "A. C. Alles",
    note: "Judge of the Supreme Court of Sri Lanka (1964–1974)",
  },
  {
    name: "Lalith Gamage",
    note: "President, Sri Lanka Institute of Information Technology",
  },
  {
    name: "Gihan Wikramanayake",
    note: "Director, University of Colombo School of Computing",
  },
  {
    name: "D. V. J. Harischandra",
    note: "Consultant psychiatrist, author and Buddhist scholar",
  },
  {
    name: "Sirisena Amarasiri",
    note: "Chief Minister of Southern Province; Governor of Uva (1999–2003)",
  },
  {
    name: "A. R. M. Thassim",
    note: "Business owner, philanthropist, Mayor of Galle",
  },
  {
    name: "Patrick Denipitiya",
    note: "Songwriter, composer and music arranger",
  },
  {
    name: "Dilith Jayaweera",
    note: "Chairman, George Steuart Group; Member of Parliament",
  },
  {
    name: "Lalith Jayaweera",
    note: "Air Vice Marshal, Director General Health Services, SLAF",
  },
  {
    name: "Asoka Abeygunawardana",
    note: "Chairman & CEO, Strategic Enterprise Management Agency",
  },
  {
    name: "Ariyaseela Wickramanayake",
    note: "Founder Chairman to Master Divers, Pelwatte Dairy Industries",
  },
  { name: "Anura Karunathilaka", note: "Cabinet Minister" },
  { name: "Rathna Gamage", note: "State Minister" },
  { name: "Chandima Weerakkody", note: "Member of Parliament (Galle)" },
  { name: "Mohan P. de Silva", note: "Member of Parliament (Galle)" },
  { name: "Chathuranga de Silva", note: "One Day International cricketer" },
  { name: "Ashen Bandara", note: "International cricketer" },
  { name: "Harsha Vithana", note: "First-class cricketer" },
  { name: "Percy Abeysekera", note: "Celebrated cricket superfan" },
];
