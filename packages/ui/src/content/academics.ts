import type { ImageSource } from "../components/primitives/media";
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
  { label: "Facilities", href: "#facilities" },
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

export const FACILITIES_EYEBROW = "Facilities";
export const FACILITIES_HEADING = "Where Aloysians learn & grow";
export const FACILITIES_INTRO =
  "Laboratories, libraries and specialist spaces supporting every stream, from the primary section to Advanced Level.";

export interface Facility {
  id: string;
  name: string;
  /** Short category label, e.g. "Science". Shown as a tag on the photograph. */
  tag: string;
  description: string;
  /** Add a photograph here once one exists; until then a placeholder is shown. */
  image?: ImageSource;
}

/**
 * The facilities shown in the Academics showcase, in display order. To add a
 * photograph, set `image: { src: "/facilities/physics-lab.jpg", alt: "..." }`
 * on the row; to add a facility, append a row. An empty list hides the section.
 */
export const FACILITIES: readonly Facility[] = [
  {
    id: "physics-lab",
    name: "Physics Laboratory",
    tag: "Science",
    description:
      "Practical work for O/L science and the A/L physical science stream.",
  },
  {
    id: "chemistry-lab",
    name: "Chemistry Laboratory",
    tag: "Science",
    description:
      "Fume-safe benches for experiments and A/L chemistry practicals.",
  },
  {
    id: "biology-lab",
    name: "Biology Laboratory",
    tag: "Science",
    description:
      "Specimens, microscopes and dissection for the biological stream.",
  },
  {
    id: "ict-labs",
    name: "ICT & Computer Labs",
    tag: "Technology",
    description:
      "Networked computers for ICT, technology and digital literacy.",
  },
  {
    id: "engineering-lab",
    name: "Engineering Technology Lab",
    tag: "Technology",
    description: "Workshop space for the A/L engineering technology stream.",
  },
  {
    id: "library",
    name: "College Library",
    tag: "Learning",
    description:
      "Reference, lending and quiet study for every section of the College.",
  },
  {
    id: "primary-library",
    name: "Primary Library",
    tag: "Learning",
    description: "An age-appropriate reading room for Grades 1 to 5.",
  },
  {
    id: "music-art",
    name: "Music & Art Rooms",
    tag: "Aesthetics",
    description:
      "Instruments, studio space and exhibitions for aesthetic studies.",
  },
  {
    id: "main-hall",
    name: "Main Hall",
    tag: "Community",
    description: "Assemblies, prize-giving, concerts and examinations.",
  },
  {
    id: "chapel",
    name: "Chapel",
    tag: "Community",
    description: "The spiritual heart of the College's Catholic tradition.",
  },
  {
    id: "sports-grounds",
    name: "Sports Grounds",
    tag: "Sport",
    description: "Cricket, rugby, football and athletics on College grounds.",
  },
  {
    id: "smart-classrooms",
    name: "Smart Classrooms",
    tag: "Technology",
    description: "Multimedia-equipped rooms for interactive teaching.",
  },
];

export const RESULTS_HEADING = "Examination Results & Achievements";
export const RESULTS_BODY =
  "Ordinary Level and Advanced Level performance, published year by year alongside national and provincial honours.";
export const RESULTS_CTA_LABEL = "View results";
export const RESULTS_CTA_HREF = "/results";
