import type { ImageSource } from "../components/primitives/media";

/**
 * Content for the `/results` page: G.C.E. Advanced Level rankers, Ordinary
 * Level 9A achievers and Grade 5 Scholarship passers, year by year.
 *
 * Nothing here is invented. `RESULTS_BY_YEAR` is empty until the College
 * supplies its figures, and every section renders an honest empty state for a
 * year with no entries. To publish a year, add an entry keyed by the year:
 *
 * ```ts
 * RESULTS_BY_YEAR["2025"] = {
 *   summary: { alUniversityEntrants: "120", alThreeA: "34" },
 *   alRankers: {
 *     "physical-science": [
 *       { id: "ps-1", name: "A. Perera", result: "3A", zScore: "2.1234",
 *         districtRank: "3", islandRank: "41",
 *         image: { src: "/results/2025/ps-1.jpg", alt: "A. Perera" } },
 *     ],
 *   },
 * };
 * ```
 *
 * Every field except `id`, `name` and `result`/`marks` is optional: a figure
 * that is not supplied is left out rather than shown as a placeholder.
 */

export const RESULTS_HERO_TITLE = "Examinations & Results";
export const RESULTS_HERO_INTRO =
  "Honouring Aloysians who excelled at the G.C.E. Advanced Level, the G.C.E. Ordinary Level and the Grade 5 Scholarship Examination.";

/** Newest first. Add a year here as well as in `RESULTS_BY_YEAR`. */
export const RESULT_YEARS: readonly string[] = ["2025", "2024", "2023", "2022"];

export interface ResultsStudent {
  id: string;
  name: string;
  image?: ImageSource;
}

export interface AlRanker extends ResultsStudent {
  /** e.g. "3A" or "2A B". */
  result: string;
  zScore?: string;
  districtRank?: string;
  islandRank?: string;
}

export interface ScholarshipEntry extends ResultsStudent {
  marks: string;
  /** e.g. "5-A". */
  className?: string;
}

export interface NineABand {
  /** e.g. "9A", "8A". */
  band: string;
  count: string;
}

export interface YearResults {
  summary?: {
    alUniversityEntrants?: string;
    alThreeA?: string;
    olNineA?: string;
    scholarshipPassers?: string;
  };
  /** Keyed by `AL_STREAMS_TABS[n].id`. The first entry is the stream first. */
  alRankers?: Readonly<Record<string, readonly AlRanker[]>>;
  nineA?: {
    /** Total shown beside the big "9A", e.g. "86". */
    total?: string;
    students: readonly ResultsStudent[];
    bands?: readonly NineABand[];
  };
  scholarship?: {
    passed?: string;
    cutOff?: string;
    highest?: string;
    /** Highest, second and third, in that order. */
    top?: readonly ScholarshipEntry[];
    /** Everyone after the top three; numbered from 4. */
    list?: readonly ScholarshipEntry[];
    /** Total passers, for the "Showing 8 of N" line. */
    total?: string;
    pdfHref?: string;
  };
}

export const AL_STREAMS_TABS: readonly { id: string; label: string }[] = [
  { id: "physical-science", label: "Physical Science" },
  { id: "biological-science", label: "Biological Science" },
  { id: "commerce", label: "Commerce" },
  { id: "arts", label: "Arts" },
  { id: "engineering-technology", label: "Engineering Technology" },
  { id: "bio-systems-technology", label: "Bio-systems Technology" },
];

export const RESULTS_BY_YEAR: Readonly<Record<string, YearResults>> = {};

export const RESULTS_AL_EYEBROW = "G.C.E. Advanced Level";
export const RESULTS_AL_HEADING = "Top Rankers by Stream";
export const RESULTS_AL_NOTE =
  "Z-score, district rank and island rank as published by the Department of Examinations.";
export const RESULTS_OL_EYEBROW = "G.C.E. Ordinary Level";
export const RESULTS_OL_HEADING = "The 9A Achievers";
export const RESULTS_OL_NOTE =
  "Aloysians who earned distinctions in all nine subjects.";
export const RESULTS_SCHOLARSHIP_EYEBROW = "Grade 5 Scholarship";
export const RESULTS_SCHOLARSHIP_HEADING = "Scholarship Passers";
export const RESULTS_EMPTY_BODY =
  "These results have not been published for this year yet.";
