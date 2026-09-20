import type { ImageSource } from "../components/primitives/media";

/**
 * Every string and image on the homepage is a typed prop with a default, so the
 * CMS can supply real content later without touching a component. Nothing here
 * renders a `[CMS: ...]` marker - placeholder markers in shipped copy was one of
 * the findings in the design audit.
 *
 * Fields that hold facts we do not have yet are optional; the sections that use
 * them degrade instead of inventing data.
 */

export interface HeroBackground {
  kind: "image" | "video" | "color";
  value: string;
  /** Width divided by height for image backgrounds. */
  aspectRatio?: number;
}

export interface Notice {
  id: string;
  text: string;
  href: string;
  priority: "standard" | "high";
}

export interface Department {
  id: string;
  index: string;
  name: string;
  description: string;
}

export interface Stat {
  id: string;
  label: string;
  /** Omitted until the registry supplies a figure. */
  value?: string;
}

export type NewsCategory =
  | "Academic"
  | "Sports"
  | "Events"
  | "Announcements"
  | "College News";

export interface NewsItem {
  id: string;
  category: NewsCategory;
  /** ISO date; formatted at render time for the user's locale. */
  date?: string;
  title: string;
  href: string;
  image?: ImageSource;
}

export interface Achievement {
  id: string;
  category: string;
  title: string;
  detail: string;
}

export interface GalleryItem {
  id: string;
  label: string;
  image?: ImageSource;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "about", label: "About", href: "/about" },
  { id: "academics", label: "Academics", href: "/academics" },
  { id: "students", label: "Students", href: "/students" },
  { id: "news", label: "News", href: "/news" },
  { id: "alumni", label: "Alumni", href: "/alumni" },
  { id: "media", label: "Media", href: "/media" },
  { id: "contact", label: "Contact", href: "/contact" },
];

export const DEFAULT_NOTICE: Notice = {
  id: "admissions",
  text: "Admissions for the next academic year - application details and important dates.",
  href: "/notices",
  priority: "standard",
};

export const DEPARTMENTS: readonly Department[] = [
  {
    id: "science",
    index: "01",
    name: "Science & Mathematics",
    description:
      "Physical science, biological science and mathematics streams for the G.C.E. Advanced Level.",
  },
  {
    id: "humanities",
    index: "02",
    name: "Languages & Humanities",
    description:
      "Sinhala, English and Tamil language studies alongside history, geography and religion.",
  },
  {
    id: "commerce",
    index: "03",
    name: "Commerce",
    description:
      "Accounting, economics and business studies, preparing students for professional pathways.",
  },
  {
    id: "technology",
    index: "04",
    name: "Technology & Aesthetics",
    description:
      "Information technology, engineering technology, art, dancing and western and oriental music.",
  },
];

export const STATS: readonly Stat[] = [
  { id: "students", label: "Students" },
  { id: "staff", label: "Teaching staff" },
  { id: "results", label: "O/L & A/L pass rate" },
  { id: "honours", label: "National honours" },
];

export const ACHIEVEMENT_CATEGORIES: readonly string[] = [
  "All",
  "Academic",
  "Sports",
  "Innovation",
  "Arts",
  "Leadership",
  "National",
  "International",
];

export const STUDENT_LIFE = [
  { id: "sports", label: "Sports", placeholder: "Sports - action photograph" },
  { id: "music", label: "Music & Drama", placeholder: "Music and drama" },
  { id: "clubs", label: "Clubs & Societies", placeholder: "" },
  { id: "houses", label: "Houses", placeholder: "" },
  { id: "scouts", label: "Scouts & Cadets", placeholder: "Scouts and cadets" },
  { id: "faith", label: "Faith & Service", placeholder: "Chapel and service" },
  { id: "prefects", label: "Prefects", placeholder: "" },
] as const;

export const GALLERY_ITEMS: readonly GalleryItem[] = [
  { id: "campus", label: "Campus" },
  { id: "events", label: "Events" },
  { id: "sports", label: "Sports" },
  { id: "heritage", label: "Heritage" },
  { id: "students", label: "Students" },
  { id: "academic", label: "Academic" },
];

export const MOTTO = "Certa Viriliter";
export const MOTTO_TRANSLATION = "Strive Manfully";
export const COLLEGE_NAME = "St. Aloysius' College";
export const COLLEGE_LOCATION = "Galle, Sri Lanka";
export const FOUNDED_YEAR = 1862;

/**
 * Admissions is a separate application on its own subdomain, not a route in
 * this site. Every "Admissions" link points here, so it is a cross-origin
 * navigation - do not pass it to `<Link>`, which only handles in-app routes.
 */
export const ADMISSIONS_URL = "https://admissions.aloysiuscollege.lk";

export const formatNewsDate = (iso?: string): string => {
  if (!iso) {
    return "";
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
