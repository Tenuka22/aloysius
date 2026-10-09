/**
 * Content for the Admissions page, following the same rule as
 * `content/about.ts` and `content/academics.ts`: every string here is a real,
 * typed constant, never a `[CMS: ...]` marker. Facts this project has no
 * public source for - this year's actual deadlines, the live download
 * files - are modelled as optional fields, so the page shows an honest "to
 * be announced" / "contact the office" fallback rather than inventing a date
 * or a broken PDF link.
 */

export interface ApplicationStep {
  id: string;
  num: string;
  title: string;
  body: string;
}

export const APPLICATION_STEPS: readonly ApplicationStep[] = [
  {
    id: "review",
    num: "01",
    title: "Review Requirements",
    body: "Check the grade you are applying for, the eligibility rules and the documents you will need before starting an application.",
  },
  {
    id: "submit",
    num: "02",
    title: "Submit Application",
    body: "Complete the official application form and hand it in to the College office with the required documents by the published deadline.",
  },
  {
    id: "interview",
    num: "03",
    title: "Interview / Selection",
    body: "Shortlisted families are invited to the College for an interview as part of the selection process.",
  },
  {
    id: "enrolment",
    num: "04",
    title: "Enrolment",
    body: "Successful applicants complete enrolment formalities and join the College at the start of the new term.",
  },
];

export const ADMISSIONS_REQUIREMENTS: readonly string[] = [
  "Completed official application form",
  "Birth certificate and identity documents",
  "Proof of residence",
  "Previous school records, where applicable",
  "Any additional documents required by current Ministry of Education circulars",
];

export interface AdmissionsDate {
  id: string;
  label: string;
  /** Omitted until the College publishes this year's calendar. */
  date?: string;
}

export const ADMISSIONS_DATES: readonly AdmissionsDate[] = [
  { id: "applications-open", label: "Applications open" },
  { id: "application-deadline", label: "Application deadline" },
  { id: "interviews", label: "Interviews / selection" },
  { id: "term-begins", label: "Term begins" },
];

export interface AdmissionsDownload {
  id: string;
  label: string;
  /** Omitted until the College publishes the file. */
  href?: string;
}

export const ADMISSIONS_DOWNLOADS: readonly AdmissionsDownload[] = [
  { id: "application-form", label: "Grade 1 Application Form" },
  { id: "instructions", label: "Admission Instructions & Circular" },
  { id: "checklist", label: "Required Documents Checklist" },
];

export interface AdmissionsFaq {
  id: string;
  question: string;
  answer: string;
}

export const ADMISSIONS_FAQS: readonly AdmissionsFaq[] = [
  {
    id: "when-open",
    question: "When do admissions open?",
    answer:
      "The College publishes this year's application window and key dates through the office and this page once confirmed. See Key Dates above, or contact the office directly.",
  },
  {
    id: "which-grades",
    question: "What grades accept new students?",
    answer:
      "Most new admissions are into Grade 1, Primary Section. A limited number of vacancies in other grades are filled by transfer where space allows.",
  },
  {
    id: "documents",
    question: "What documents are required?",
    answer:
      "A completed application form, birth certificate and identity documents, proof of residence, and previous school records where applicable. See What You'll Need above for the full list.",
  },
  {
    id: "selection",
    question: "How are applicants selected?",
    answer:
      "Applications are reviewed against eligibility and current Ministry of Education circulars. Shortlisted families are invited for an interview as part of the selection process.",
  },
];
