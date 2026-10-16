import type { ImageSource } from "../components/primitives/media";
import { aspectRatios } from "../tokens/aspect-ratios";

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
  /** Where "View all notices" leads. Omitted, the link is not shown. */
  href?: string;
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
  | "Achievements"
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

export type AchievementCategory =
  | "Academic"
  | "Sports"
  | "Innovation"
  | "Arts"
  | "Leadership"
  | "National"
  | "International";

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
  /**
   * The crop this tile is composed for, as a `width / height` number from
   * `tokens/aspect-ratios.ts`.
   *
   * Set per tile rather than one ratio for the grid: the grid is masonry, so
   * each tile keeps its own height and the columns pack. A single ratio would
   * produce a uniform grid, which is the layout this replaced.
   */
  preferredRatio: number;
  /**
   * Where the tile goes, when the tile is a way to somewhere rather than just a
   * picture. A club gallery whose photographs live on a Facebook album points
   * here at the album, which is the only way a visitor ever finds out there is
   * more.
   *
   * Always an absolute off-site address, and always opened in a new tab — the
   * tile that uses this is a club's external album, and dropping a visitor back
   * onto the homepage afterwards is worse than the extra tab.
   *
   * Omitted for a plain editorial tile, which is not a link to anything.
   */
  href?: string;
  /**
   * Small line under the image describing where the link goes, e.g. "Full
   * album on Facebook". Shown only when there is an `href`, because without one
   * it is a caption explaining nothing.
   */
  hrefLabel?: string;
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

export interface ExamStat {
  label: string;
  /** Omitted until the results registry supplies a figure. */
  value?: string;
}

export interface ExamCard {
  id: string;
  level: string;
  /** Large gold callout over the photograph, e.g. "A/L". */
  mark: string;
  title: string;
  description: string;
  stats: readonly ExamStat[];
  cta: string;
  href: string;
  /** Caption shown while the photograph is pending. */
  photoHint: string;
}

/** The three national examinations the College reports on, in display order. */
export const EXAM_CARDS: readonly ExamCard[] = [
  {
    id: "al",
    level: "G.C.E. Advanced Level",
    mark: "A/L",
    title: "Top Rankers by Stream",
    description:
      "Island and district rankers across Physical Science, Biological Science, Commerce, Arts and Technology.",
    stats: [{ label: "University entrants" }, { label: "3A passes" }],
    cta: "A/L results",
    href: "/results#al",
    photoHint: "A/L rankers group photo",
  },
  {
    id: "ol",
    level: "G.C.E. Ordinary Level",
    mark: "9A",
    title: "The 9A Achievers",
    description:
      "Aloysians who earned distinctions in all nine subjects at the Ordinary Level.",
    stats: [{ label: "9A achievers" }, { label: "Pass rate" }],
    cta: "O/L results",
    href: "/results#ol",
    photoHint: "O/L 9A achievers photo",
  },
  {
    id: "scholarship",
    level: "Grade 5 Scholarship",
    mark: "G5",
    title: "Scholarship Passers",
    description:
      "Primary section students who passed the Grade 5 Scholarship Examination.",
    stats: [{ label: "Passers" }, { label: "Highest mark" }],
    cta: "Scholarship results",
    href: "/results#scholarship",
    photoHint: "Scholarship passers photo",
  },
];

export const ACHIEVEMENT_CATEGORIES: readonly ("All" | AchievementCategory)[] =
  [
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

/**
 * Twelve tiles, each composed for the crop it is most likely to be: the
 * establishing shots wide, the subject shots squarer. The mix is what makes the
 * masonry read as a gallery rather than a grid with gaps in it.
 *
 * The count is load-bearing, not arbitrary. The grid is a CSS multi-column at
 * 2, 3 and 4 columns across its breakpoints, and a multi-column balances by
 * splitting its items into contiguous groups - so an item count that is not a
 * multiple of the column count forces the leftover into a short column. Six
 * tiles across four columns is 2/1/2/1, which left the bottom-left of the
 * section as a two-tile void no choice of aspect ratio could fill. Twelve is
 * 3/3/3/3 at the widest, and 6/6, 4/4/4 and 3/3/3/3 at the narrower ones: every
 * column carries the same number of tiles at every breakpoint, the balancer
 * has enough freedom to even out the bottoms, and the section is no taller than
 * it was - the new tiles fill the hole rather than extend the page.
 *
 * Order is authored for the 3/3/3/3 split it produces, so each column is a
 * deliberate mix (an establishing shot, a tall subject, a supporting crop)
 * rather than three similar crops stacked.
 */
export const GALLERY_ITEMS: readonly GalleryItem[] = [
  { id: "campus", label: "Campus", preferredRatio: aspectRatios.hero },
  { id: "events", label: "Events", preferredRatio: aspectRatios.galleryThumb },
  { id: "academic", label: "Academic", preferredRatio: aspectRatios.newsCard },
  {
    id: "heritage",
    label: "Heritage",
    preferredRatio: aspectRatios.heritagePhoto,
  },
  { id: "sports", label: "Sports", preferredRatio: aspectRatios.mosaicTile },
  {
    id: "students",
    label: "Students",
    preferredRatio: aspectRatios.mosaicTile,
  },
  {
    id: "clubs",
    label: "Clubs & Societies",
    preferredRatio: aspectRatios.mosaicTile,
  },
  {
    id: "music",
    label: "Music & Drama",
    preferredRatio: aspectRatios.mosaicTile,
  },
  {
    id: "scouts",
    label: "Scouts & Cadets",
    preferredRatio: aspectRatios.heritageDetail,
  },
  { id: "alumni", label: "Alumni", preferredRatio: aspectRatios.alumniPhoto },
  { id: "houses", label: "Houses", preferredRatio: aspectRatios.newsCard },
  {
    id: "achievements",
    label: "Achievements",
    preferredRatio: aspectRatios.achievementCard,
  },
];

/**
 * How many photographs the gallery strip renders.
 *
 * This is the same twelve `GALLERY_ITEMS` below carries, for the same reason:
 * the grid is a CSS multi-column at 2, 3 and 4 columns, and only a count that
 * divides by all three keeps every column the same length. A route that feeds
 * the strip from the approved-photo tables therefore has to stop at a multiple
 * of twelve rather than pass through however many photographs happen to exist -
 * an uncapped list both breaks the column balance the layout is built around
 * and renders one `<img>` per photograph on the page, on a page whose purpose is
 * to link to the gallery rather than to be it.
 *
 * Twelve, not six: six across four columns is 2/1/2/1, which leaves the
 * bottom-left as a two-tile void.
 */
export const GALLERY_STRIP_LIMIT = 12;

export const MOTTO = "Certa Viriliter";
export const MOTTO_TRANSLATION = "Strive Manfully";
export const COLLEGE_NAME = "St. Aloysius' College";
export const COLLEGE_LOCATION = "Galle, Sri Lanka";
export const FOUNDED_YEAR = 1895;

/**
 * Where every "Admissions" link points.
 *
 * Admissions moved off this site to its own subdomain, so the header's call to
 * action and the footer link both leave the site now. They render with
 * `target="_blank"` and `rel="noopener noreferrer"` for that reason - see
 * `isExternalHref` in `components/site/site-header.tsx`, which is what decides
 * it, so the two links cannot drift apart.
 */
export const ADMISSIONS_URL = "https://admissions.aloysiuscollege.lk/";

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
