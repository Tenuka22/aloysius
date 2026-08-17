/**
 * Shared helpers for displaying school exam results (G5 Scholarship, GCE O/L, GCE A/L).
 */

export const EXAM_TYPE_LABELS: Record<string, string> = {
  scholarship: "G5 Scholarship",
  ol: "GCE O/L",
  al: "GCE A/L",
};

export const EXAM_TYPE_SHORT: Record<string, string> = {
  scholarship: "SCHOLARSHIP",
  ol: "G.C.E. O/L",
  al: "G.C.E. A/L",
};

export const STREAM_LABELS: Record<string, string> = {
  physical_science: "PHYSICAL SCIENCE",
  biological_science: "BIOLOGICAL SCIENCE",
  commerce: "COMMERCE",
  arts: "ARTS",
  technology: "TECHNOLOGY",
};

/** Curated Sri Lankan universities for the A/L university admissions editor. */
export const SL_UNIVERSITIES = [
  "University of Colombo",
  "University of Peradeniya",
  "University of Moratuwa",
  "University of Kelaniya",
  "University of Sri Jayewardenepura",
  "University of Ruhuna",
  "University of Jaffna",
  "University of Rajarata",
  "South Eastern University of Sri Lanka",
  "Sabaragamuwa University of Sri Lanka",
  "Wayamba University of Sri Lanka",
  "Uva Wellassa University",
  "Eastern University of Sri Lanka",
  "The Open University of Sri Lanka",
  "General Sir John Kotelawala Defence University",
  "University of the Visual and Performing Arts",
  "Sri Lanka Institute of Information Technology (SLIIT)",
  "National School of Business Management (NSBM)",
] as const;

/** Common degree fields offered to A/L qualifiers at Sri Lankan universities. */
export const UNIVERSITY_COURSES = [
  "BSc (Hons) Engineering",
  "BSc (Hons) Software Engineering",
  "BSc Computer Science",
  "BSc Information Technology",
  "BSc Engineering Technology",
  "BSc Biomedical Sciences",
  "MBBS (Medicine)",
  "BSc Nursing",
  "BSc Pharmacy",
  "BSc Dentistry",
  "BSc Agricultural Sciences",
  "BSc Physical Science",
  "BSc Biological Science",
  "BSc Marine Science",
  "LLB (Law)",
  "BCom (Commerce)",
  "BSc Business Administration",
  "BSc Actuarial Science",
  "BSc Statistics",
  "BA (Arts)",
  "BEd (Education)",
  "BArch (Architecture)",
  "BSc Quantity Surveying",
] as const;

export type ExamStudent = {
  id: string;
  name: string;
  photo: string | null;
  quote: string | null;
  marks: number | null;
  overallGrade: string | null;
  stream: string | null;
  subjects: { subject: string; grade: string }[];
  sortOrder: number;
};

export type ExamResult = {
  id: string;
  examType: string;
  examYear: number;
  resultsYear: number;
  status: string;
  students: ExamStudent[];
  universityAdmissions?: UniversityAdmission[];
};

export type UniversityAdmission = {
  id: string;
  examResultId: string;
  studentName: string;
  university: string;
  course: string;
  sortOrder: number;
  createdAt: string;
};

/** "2025 (Held 2026)" or just "2025" if held same year. */
export function examYearLabel(result: { examYear: number; resultsYear: number }): string {
  if (result.resultsYear && result.resultsYear !== result.examYear) {
    return `${result.examYear} (Held ${result.resultsYear})`;
  }
  return `${result.examYear}`;
}

/** Compact grade summary e.g. "5A · 3B", "195/200", or "A" for OL overall grade. */
export function gradeSummary(student: ExamStudent): string {
  if (student.marks != null) {
    return `${student.marks}/200`;
  }
  if (student.overallGrade) {
    return student.overallGrade;
  }
  const subjects = student.subjects ?? [];
  if (subjects.length === 0) return "";
  const counts = new Map<string, number>();
  for (const s of subjects) {
    const g = s.grade.trim().toUpperCase();
    if (!g) continue;
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const entries = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) return "";
  return entries.map(([grade, n]) => `${n}${grade}`).join(" \u00b7 ");
}

/** Full subject list for tables, e.g. "Sinhala A · English B". */
export function subjectList(student: ExamStudent): string {
  const subjects = student.subjects ?? [];
  return subjects.map((s) => `${s.subject} ${s.grade}`.trim()).join(" \u00b7 ");
}

/**
 * Pick a random spread of top performers: take the first `poolSize` students
 * ordered by rank, divide them into `groups` contiguous bands, then pick one
 * random student from each band. This keeps the display top-heavy yet varied
 * between refreshes.
 */
export function pickRandomTopPerformers(
  students: ExamStudent[],
  groups = 6,
  poolSize = 30,
): ExamStudent[] {
  const sorted = [...students].sort((a, b) => a.sortOrder - b.sortOrder);
  const pool = sorted.slice(0, poolSize);
  if (pool.length === 0) return [];
  if (pool.length <= groups) return pool;

  const bandSize = Math.ceil(pool.length / groups);
  const picked: ExamStudent[] = [];
  for (let i = 0; i < pool.length; i += bandSize) {
    const band = pool.slice(i, i + bandSize);
    if (band.length === 0) continue;
    picked.push(band[Math.floor(Math.random() * band.length)]!);
    if (picked.length >= groups) break;
  }
  return picked;
}
