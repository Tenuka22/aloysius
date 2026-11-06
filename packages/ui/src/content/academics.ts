import type { ImageSource } from "../components/primitives/media";

/**
 * Content for the Academics page, to the approved UI/UX design
 * (Academics.dc.html). Every string is a typed constant carrying real copy,
 * never a `[CMS: ...]` marker.
 */

export const ACADEMICS_HERO_TITLE = "Academic Excellence";
export const ACADEMICS_HERO_INTRO =
  "Curriculum, streams and departments — from primary years to Advanced Level.";

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
    grades: "Grades 1–5",
    name: "Primary Section",
    description: "Foundations in literacy, numeracy, faith and character.",
  },
  {
    id: "secondary",
    grades: "Grades 6–11",
    name: "Secondary Section",
    description: "The national curriculum through to G.C.E. Ordinary Level.",
  },
  {
    id: "advanced",
    grades: "Grades 12–13",
    name: "Advanced Level",
    description: "Specialised streams preparing students for university.",
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
    description: "Combined maths, physics, chemistry.",
  },
  {
    id: "biological-science",
    index: "02",
    name: "Biological Science",
    description: "Biology, chemistry, physics / agriculture.",
  },
  {
    id: "commerce",
    index: "03",
    name: "Commerce",
    description: "Accounting, economics, business studies.",
  },
  {
    id: "arts",
    index: "04",
    name: "Arts",
    description: "Languages, humanities and aesthetic subjects.",
  },
  {
    id: "technology",
    index: "05",
    name: "Technology",
    description: "Engineering technology, science for technology and ICT.",
  },
];

export const FACILITIES_EYEBROW = "Facilities";
/** The heading is set in two lines: the second, in gold italics, is the emphasis. */
export const FACILITIES_HEADING_LINES = [
  "Where Aloysians",
  "learn & grow",
] as const;
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
    id: "library",
    name: "College Library",
    tag: "Learning",
    description:
      "Reference, lending and quiet study for every section of the College.",
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
