import type { ImageSource } from "../components/primitives/media";

/**
 * Content for the About page, to the approved UI/UX design (About.dc.html).
 *
 * Every string is a typed constant with a real default so the page reads as
 * finished copy, not a `[CMS: ...]` placeholder.
 */

export interface JumpLink {
  label: string;
  href: string;
}

/** In the design's order; the first is drawn as the active link. */
export const ABOUT_JUMP_LINKS: readonly JumpLink[] = [
  { label: "History", href: "#history" },
  { label: "Crest", href: "#crest" },
  { label: "Principals", href: "#principals" },
  { label: "Vision & Mission", href: "#vision" },
  { label: "Motto", href: "#motto" },
  { label: "Principal", href: "#principal" },
  { label: "Anthem", href: "#anthem" },
  { label: "Administration", href: "#administration" },
];

export const ABOUT_HERO_TITLE = "Our Story, Our Heritage";
export const ABOUT_HERO_INTRO =
  "The history, mission and people of St. Aloysius’ College — a Catholic institution rooted in the heart of Galle.";

export interface TimelineEntry {
  year: string;
  title: string;
  body: string;
  image?: ImageSource;
}

export const HISTORY_HEADING = "More Than a Century in Galle";
export const TIMELINE: readonly TimelineEntry[] = [
  {
    year: "1895",
    title: "Founded on Mount Calvary",
    body: "Established by newly arrived Belgian Jesuit missionaries led by Joseph Van Reeth, first Bishop of Galle, and named after the Jesuit saint Aloysius Gonzaga — beside St. Mary's Cathedral and Sacred Heart Convent.",
    image: {
      src: "/about-history-1895.webp",
      alt: "Archival photograph from the college's founding era",
    },
  },
  {
    year: "1896",
    title: "The Jesuit Years",
    body: "Under Jesuit principals from Joseph Van Reeth to Paul Caspersz, the College grew with English as its medium of instruction and five houses named after its pioneering fathers.",
    image: {
      src: "/about-history-1920s.webp",
      alt: "Archival photograph of the early campus",
    },
  },
  {
    year: "1971",
    title: "A New Chapter",
    body: "Following the nationalisation of schools, B. K. Silva became the first Buddhist principal and the medium of instruction changed to Sinhala.",
    image: {
      src: "/about-history-1971.webp",
      alt: "Archival photograph of the college in the 1970s",
    },
  },
  {
    year: "Today",
    title: "A National School",
    body: "A boys' National School of over 3,500 students from Grade 1 to G.C.E. Advanced Level, serving families of many faiths across the South.",
    image: {
      src: "/about-history-today.webp",
      alt: "The college campus today",
    },
  },
];

export interface CrestSymbol {
  no: string;
  name: string;
  meaning: string;
}

export const CREST_HEADING = "Symbols of an Aloysian";
export const CREST_SYMBOLS: readonly CrestSymbol[] = [
  { no: "01", name: "The Tusker", meaning: "Courage" },
  { no: "02", name: "Lilies", meaning: "Purity of conscience" },
  { no: "03", name: "The Torch", meaning: "The torch of learning" },
  { no: "04", name: "The Rooster", meaning: "Symbol of Galle" },
];

/** The Roll of Principals, oldest first. The last entry is the current term. */
export const PRINCIPALS_ROLL: readonly { period: string; name: string }[] = [
  { period: "1896 – 1910", name: "Joseph Van Reeth" },
  { period: "1910 – 1921", name: "Dionysius Murphy" },
  { period: "1921 – 1925", name: "John Delaney" },
  { period: "1925 – 1949", name: "Ernest Gaspard" },
  { period: "1949 – 1962", name: "Paul Nazarine Peiris" },
  { period: "1963 – 1968", name: "Paul Caspersz" },
  { period: "1968 – 1970", name: "Stephen Fernando (Acting)" },
  { period: "1970 – 1971", name: "Paul Caspersz" },
  { period: "1971 – 1972", name: "B. K. Silva" },
  { period: "1972 – 1973", name: "Dunstan Fernando" },
  { period: "1973", name: "J. B. Varnakulasingham (Acting)" },
  { period: "1973 – 1975", name: "L. D. P. Jayasinghe" },
  { period: "1975 – 1976", name: "A. B. J. L. Fernando (Acting)" },
  { period: "1976 – 1987", name: "D. Y. Wijewickrama" },
  { period: "1987 – 1996", name: "A. V. Illeperuma" },
  { period: "1996 – 2004", name: "N. K. Ariyawansa" },
  { period: "2004", name: "Nandasena Pathirana (Acting)" },
  { period: "2004 – 2014", name: "D. P. L. S. Gunasekara" },
  { period: "2014", name: "Piyasiri Kumarage (Acting)" },
  { period: "2014 – 2017", name: "Ranjith Thilakarathne" },
  { period: "2017", name: "L. P. Weeraman (Acting)" },
  { period: "2017 – 2020", name: "Nayanapriya Perera" },
  { period: "2020 – 2024", name: "Anura Gamage" },
  { period: "2024 – Present", name: "A. J. P. Pubudu Sampath" },
];

export const VISION_STATEMENT =
  "To be a leading centre of academic and moral excellence, forming young men of competence, conscience and compassion.";
export const MISSION_STATEMENT =
  "To provide a holistic Catholic education grounded in Jesuit values, nurturing faith, discipline and service to others.";

/*
 * The Principal's message used to be defined here as well as on the homepage.
 * It now lives in `content/principal.ts` as the site's one global block, so
 * there is a single copy - see `blocksToPrincipal`.
 */

export interface AnthemStanza {
  id: number;
  lines: readonly string[];
}

export const ANTHEM_TITLE = "The College Anthem";

/**
 * The recording the "Listen to the anthem" button plays. Empty until the
 * College supplies one: the button is only drawn when there is something for
 * it to play, rather than offering a control that does nothing.
 */
export const ANTHEM_AUDIO_SRC = "";

export const ANTHEM_STANZAS: readonly AnthemStanza[] = [
  {
    id: 1,
    lines: [
      "Aloysians all, our voice let's raise",
      "In songs of loyalty;",
      "Let's sing our Alma Mater's praise;",
      "Here's to our S. A. C.",
    ],
  },
  {
    id: 2,
    lines: [
      "Pure as the lilies of our crest",
      "Our thoughts and deeds e'er be;",
      "Fresh as the sea-wind be our zest",
      "To keep right manfully",
    ],
  },
  {
    id: 3,
    lines: [
      "The rule of S. A. C.",
      "We learnt at S. A. C.,",
      "At halls of S. A. C.,",
      "Beside the southern sea.",
    ],
  },
  {
    id: 4,
    lines: [
      "Aloysians all, let's young and old",
      "E'er loyal be to her,",
      "And 'neath her banner Green and Gold",
      "Certa Viriliter!",
    ],
  },
  {
    id: 5,
    lines: [
      "Aloysians all, our voice let's raise",
      "In songs of loyalty",
      "Let's sing our Alma Mater's praise:",
      "Here's to our S.A.C.",
    ],
  },
  {
    id: 6,
    lines: [
      "Aloysians all, let's rally round,",
      "Aloysians young and old,",
      "Let's cheer till loud our halls resound,",
      "Our Flag of Green and Gold.",
    ],
  },
  {
    id: 7,
    lines: [
      "Let's sing of all those selfless men",
      "Who served our S.A.C.",
      "Who feared to wield nor power nor pen",
      "From self to set us free.",
    ],
  },
  {
    id: 8,
    lines: [
      "Let's sing of Standaert, Van Reeth, Neut,",
      "Of Cooreman and Murphy",
      "To their great work let's pay tribute,",
      "Let's cheer them royally.",
    ],
  },
  {
    id: 9,
    lines: [
      "Let's sing of comrades of our youth,",
      "Of lessons that we learned",
      "To serve and work for love of truth",
      "Of youthful fire that burned",
    ],
  },
  {
    id: 10,
    lines: [
      "Within our hearts, to strive to rise",
      "Above our common clay,",
      "When shone o'er blue and cloudless skies",
      "Pure light of youth's bright day.",
    ],
  },
  {
    id: 11,
    lines: [
      "Aloysians all, let's ever seek",
      "The truth to serve, defend",
      "To right the wrong, to help the weak,",
      "Be fair by foe or friend.",
    ],
  },
  {
    id: 12,
    lines: [
      "Let us obey when Lanka calls",
      "And nobly strive for her",
      "Fight manfully what'er befalls,",
      "Certa viriliter.",
    ],
  },
  {
    id: 13,
    lines: [
      "Aloysians all, let's keep through life,",
      "Let's keep right manfully,",
      "Through gladsome days or storms and strife",
      "The rule of S.A.C.",
    ],
  },
  {
    id: 14,
    lines: [
      "To give and not to count the cost,",
      "As did our young Prince-Saint,",
      "Who rend'ring noble service, lost",
      "His life pure, free from taint.",
    ],
  },
  {
    id: 15,
    lines: [
      "Aloysians all, we'll ne'er forget",
      "Our games field and our shore",
      "The ringing cheers, the keen regret",
      "When heroes failed to score.",
    ],
  },
  {
    id: 16,
    lines: [
      "Debates in Hall, the laughs that rang",
      "O'er comedies we played;",
      "The rich melodious songs we sang,",
      "The speeches that we made.",
    ],
  },
  {
    id: 17,
    lines: [
      "When toil is hard and vigour gone",
      "And minds are not serene,",
      "Let's take fresh hope to labour on,",
      "Hope from our banner's Green.",
    ],
  },
  {
    id: 18,
    lines: [
      "When life's toil o'er, our goal is won,",
      "May then 'fore us unfold",
      "The golden harvest of work done,",
      "The glory of our Gold.",
    ],
  },
  {
    id: 19,
    lines: [
      "Pure as the lilies of our crest",
      "Our thoughts and deeds e'er be;",
      "Fresh as the sea-wind be our zest",
      "To keep right manfully",
    ],
  },
  {
    id: 20,
    lines: [
      "The rule of S.A.C.",
      "We learnt at S.A.C.,",
      "At halls of S.A.C.,",
      "Beside the southern sea.",
    ],
  },
  {
    id: 21,
    lines: [
      "Aloysians all, let's young and old",
      "E'er loyal be to her,",
      "And 'neath her banner Green and Gold",
      "Certa viriliter.",
    ],
  },
];
