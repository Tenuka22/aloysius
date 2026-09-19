import type { JumpLink } from "./about";

/**
 * Content for the Academics page, following the same rule as `content/about.ts`:
 * every string is a typed constant carrying real copy, never a `[CMS: ...]`
 * marker. Facts this project has no public source for - the head of each
 * department, the year-by-year results table - are modelled as optional fields
 * so the page degrades to an honest empty state rather than inventing a name or
 * a pass rate.
 */

export const ACADEMICS_HERO_TITLE = "Academic Excellence";
export const ACADEMICS_HERO_INTRO =
  "Curriculum, streams and departments - from the primary years through to the G.C.E. Advanced Level.";

export const ACADEMICS_JUMP_LINKS: readonly JumpLink[] = [
  { label: "Sections of Study", href: "#sections" },
  { label: "A/L Streams", href: "#streams" },
  { label: "Departments", href: "#departments" },
  { label: "Results", href: "#results" },
];

export interface StudySection {
  id: string;
  /** Grade span, shown as the card's eyebrow. */
  grades: string;
  name: string;
  description: string;
}

export const STUDY_SECTIONS: readonly StudySection[] = [
  {
    id: "primary",
    grades: "Grades 1-5",
    name: "Primary Section",
    description:
      "Foundations in literacy, numeracy, faith and character, taught in small classes by specialist primary staff.",
  },
  {
    id: "secondary",
    grades: "Grades 6-11",
    name: "Secondary Section",
    description:
      "The national curriculum through to the G.C.E. Ordinary Level, with subject specialisation from Grade 10.",
  },
  {
    id: "advanced",
    grades: "Grades 12-13",
    name: "Advanced Level",
    description:
      "Four specialised streams preparing students for university entrance and professional study.",
  },
];

export interface Stream {
  id: string;
  /** Ordinal shown as the large display numeral. */
  index: string;
  name: string;
  description: string;
}

export const AL_STREAMS: readonly Stream[] = [
  {
    id: "physical-science",
    index: "01",
    name: "Physical Science",
    description: "Combined mathematics, physics and chemistry.",
  },
  {
    id: "biological-science",
    index: "02",
    name: "Biological Science",
    description: "Biology and chemistry with physics or agricultural science.",
  },
  {
    id: "commerce",
    index: "03",
    name: "Commerce",
    description: "Accounting, economics and business studies.",
  },
  {
    id: "arts-technology",
    index: "04",
    name: "Arts & Technology",
    description:
      "Humanities, information technology and engineering technology.",
  },
];

export interface SubjectDepartment {
  id: string;
  name: string;
  /** Omitted until the college publishes the roster. */
  head?: string;
}

export const SUBJECT_DEPARTMENTS: readonly SubjectDepartment[] = [
  { id: "mathematics", name: "Mathematics" },
  { id: "science", name: "Science" },
  { id: "sinhala", name: "Sinhala" },
  { id: "english", name: "English" },
  { id: "history-religion", name: "History & Religion" },
  { id: "commerce", name: "Commerce" },
  { id: "ict-technology", name: "ICT & Technology" },
  { id: "aesthetics", name: "Aesthetics (Art & Music)" },
  { id: "physical-education", name: "Physical Education" },
];

export const DEPARTMENTS_EYEBROW = "Departments";
export const DEPARTMENTS_HEADING = "Subject Departments";
export const DEPARTMENTS_INTRO =
  "Teaching across the college is organised into nine subject departments, each led by a senior member of staff.";

export const RESULTS_HEADING = "Examination Results & Achievements";
export const RESULTS_BODY =
  "Ordinary Level and Advanced Level performance, published year by year alongside national and provincial honours.";
export const RESULTS_CTA_LABEL = "View results";
export const RESULTS_CTA_HREF = "/news";
