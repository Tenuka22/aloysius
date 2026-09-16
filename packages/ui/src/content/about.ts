import type { ImageSource } from "../components/primitives/media";

/**
 * Content for the About page, mirroring the pattern in `content/home.ts`:
 * every string is a typed constant with a real default so the page reads as
 * finished copy, not a `[CMS: ...]` placeholder. Sections that depend on data
 * this project does not yet have a public source for (the leadership roster)
 * take an optional prop and degrade to an empty state instead of inventing
 * names.
 */

export interface JumpLink {
  label: string;
  href: string;
}

export const ABOUT_JUMP_LINKS: readonly JumpLink[] = [
  { label: "History", href: "#history" },
  { label: "Vision & Mission", href: "#vision" },
  { label: "Motto", href: "#motto" },
  { label: "Principal", href: "#principal" },
  { label: "Anthem", href: "#anthem" },
  { label: "Administration", href: "#administration" },
];

export const ABOUT_HERO_TITLE = "Our Story, Our Heritage";
export const ABOUT_HERO_INTRO =
  "The history, mission and people of St. Aloysius' College - a Catholic institution rooted in the heart of Galle.";

export interface Founder {
  name: string;
  body: string;
  image?: ImageSource;
}

export const FOUNDERS_EYEBROW = "Our foundations";
export const FOUNDERS_HEADING = "Built on Faith & Tradition";
export const FOUNDERS: readonly Founder[] = [
  {
    name: "Bishop Joseph Van Reeth",
    body: "Founded in 1895 by Belgian Jesuit missionaries under Bishop Joseph Van Reeth, the first bishop of Galle, St. Aloysius' College carries forward a 130-year tradition of forming young men of competence, conscience and compassion.",
    image: {
      src: "/about-founder-van-reeth.png",
      alt: "Bishop Joseph Van Reeth",
    },
  },
  {
    name: "St. Aloysius Gonzaga",
    body: "Named after St. Aloysius Gonzaga, the patron saint of youth, the college embodies the Jesuit values of academic excellence, moral integrity and service to others.",
    image: { src: "/about-founder-gonzaga.png", alt: "St. Aloysius Gonzaga" },
  },
];

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
    title: "Founding of the College",
    body: "St. Aloysius' College was established by Belgian Jesuit missionaries led by Bishop Joseph Van Reeth.",
    image: {
      src: "/about-history-1895.png",
      alt: "Archival photograph from the college's founding in 1895",
    },
  },
  {
    year: "1920s",
    title: "Early Growth",
    body: "Expansion of the College, early buildings and student body.",
    image: {
      src: "/about-history-1920s.png",
      alt: "Archival photograph of the college during the 1920s",
    },
  },
  {
    year: "1971",
    title: "A Century of Excellence",
    body: "Became a national school with the appointment of the first Buddhist principal, marking milestones in academics, sport and national life.",
    image: {
      src: "/about-history-1971.png",
      alt: "Archival photograph of the college in 1971",
    },
  },
  {
    year: "Today",
    title: "The Modern College",
    body: "St. Aloysius' College today - facilities, programmes and a community of over 5,000 students.",
    image: { src: "/about-history-today.png", alt: "The college campus today" },
  },
];

export const VISION_STATEMENT =
  "To be a leading centre of academic and moral excellence, forming young men of competence, conscience and compassion.";
export const MISSION_STATEMENT =
  "To provide a holistic Catholic education grounded in Jesuit values, nurturing faith, discipline and service to others.";

export const ABOUT_PRINCIPAL_HEADING = "A Word from the Principal";
export const ABOUT_PRINCIPAL_MESSAGE =
  "Every Aloysian carries forward a tradition of faith, discipline and excellence - certa viriliter.";

export interface AnthemStanza {
  id: number;
  lines: readonly string[];
}

export interface AnthemLanguage {
  label: string;
  stanzas: readonly AnthemStanza[];
}

export const ANTHEM_TITLE = "The College Anthem";
export const ANTHEM_DESC =
  "Sung with pride by generations of Aloysians, our anthem embodies the spirit and values of St. Aloysius' College.";
export const ANTHEM_CREDIT =
  "English: Words by D. Anghie \u00B7 Music by Strom Sidicinus, S.J. \u00B7 Sinhala: Lyrics by Rev. Fr. Moses Perera \u00B7 Music by Sunil Santha";

export const ANTHEM_IMAGE: ImageSource = {
  src: "/about-anthem-creators.png",
  alt: "Portraits of D. Anghie and Fr. Strom Sidicinus, S.J., who wrote the college anthem",
};

const EN_STANZAS: readonly AnthemStanza[] = [
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

export const ANTHEM_LANGUAGES: Record<"en" | "si", AnthemLanguage> = {
  en: {
    label: "English",
    stanzas: EN_STANZAS,
  },
  si: {
    label: "\u0DC3\u0DD2\u0D82\u0DC4\u0DBD",
    stanzas: [],
  },
};

export interface LeadershipMember {
  id: string;
  name: string;
  role: string;
  year: string;
  portrait?: ImageSource;
}

export const ADMINISTRATION_HEADING = "College Leadership";
