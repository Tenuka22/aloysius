/**
 * Content for the Contact page.
 *
 * Same rule as `content/about.ts` and `content/academics.ts`: every string here
 * is real copy, never a `[CMS: ...]` marker.
 *
 * The mock carried four `[CMS: ...]` markers (address, telephone, email, office
 * hours) because the college's published details were not in this repository,
 * and they were modelled as optional props so an unsupplied detail is omitted
 * from the list rather than rendered as an empty row. The street address,
 * telephone and email are now filled in (see the sourcing notes on each) and
 * fall back to these constants; office hours remain CMS-supplied, because no
 * published source states them and a wrong one would misdirect a visitor.
 *
 * Every value here is still overridable in the CMS, and should be: these are
 * defaults, not a claim that the college's details never change. Confirm them
 * with the College office before relying on them.
 */

export const CONTACT_HERO_TITLE = "Contact the College";
export const CONTACT_HERO_INTRO =
  "Enquiries about admissions, academic records, alumni affairs and visits are all handled by the College office.";

export const CONTACT_DETAILS_EYEBROW = "Visit & Write";
export const CONTACT_DETAILS_HEADING = "College Office";

/**
 * The main college building, Templers' Road, Kaluwella, Galle 80000.
 *
 * The street and postcode are corroborated by the English and Sinhala listings
 * on lankainformation.lk and by Wikipedia's infobox for the college; Kaluwella
 * is the locality both listings give alongside Templers' Road.
 */
export const CONTACT_DEFAULT_ADDRESS =
  "St. Aloysius' College, Templers' Road, Kaluwella, Galle 80000, Sri Lanka";

/**
 * +94 91 223 4657, written in the local format a visitor in Galle would read.
 *
 * Corroborated by four independent sources, which agree exactly: the English
 * and Sinhala lankainformation.lk listings (+94 912 234 657), a scraped
 * directory record for aloysiuscollege.lk (+94 91 223 4657), and a third-party
 * business listing (+94 91 223 4657).
 *
 * Two sources disagree and are not used: one directory lists 091 494 1798, and
 * the Galle District Secretariat's school list shows 091-2234590 - which is the
 * same number that list gives for Secirat Heart Convent on the line directly
 * above, so it reads as a copy-paste error rather than the college's number.
 *
 * Worth confirming with the office before a print run.
 */
export const CONTACT_DEFAULT_TELEPHONE = "+94 91 223 4657";

/** Supplied by the site owner; the college's own domain, so it is unambiguous. */
export const CONTACT_DEFAULT_EMAIL = "info@aloysiuscollege.lk";

export const CONTACT_MAP_PLACEHOLDER = "Location map — Galle";
export const CONTACT_MAP_LINK_LABEL = "View on map";

export const CONTACT_FORM_EYEBROW = "Enquiries";
export const CONTACT_FORM_HEADING = "Send a Message";
export const CONTACT_FORM_INTRO =
  "Messages reach the College office, which routes them to the relevant department.";
export const CONTACT_FORM_FOOTNOTE = "Responses within school working days.";
/**
 * One statement in place of an asterisk on every label. Asterisks are noise
 * when nothing is optional, and they have to be explained somewhere anyway.
 */
export const CONTACT_FORM_REQUIRED_NOTE = "All fields are required.";
/** Shown on the message field once the reply is close to the cap. */
export const CONTACT_FORM_COUNTER_THRESHOLD = 0.75;
export const CONTACT_FORM_SUBMIT_LABEL = "Send message";
export const CONTACT_FORM_SENDING_LABEL = "Sending…";
export const CONTACT_FORM_SUCCESS =
  "Thank you — your message has been sent to the College office.";
export const CONTACT_FORM_FAILURE =
  "Your message could not be sent. Please try again, or contact the College office directly.";
/**
 * Shown when the page is rendered without an `onSubmit` handler - i.e. before
 * an enquiry endpoint exists. The form still validates and still tells the user
 * exactly what happened, instead of silently discarding the message or
 * pretending it was delivered.
 */
export const CONTACT_FORM_NO_ENDPOINT =
  "This form is not connected yet, so your message was not sent. Please use the telephone number or email address listed for the College office.";

export interface ContactField {
  id: "name" | "email" | "subject" | "message";
  label: string;
  /**
   * Shown only while the field has focus, once the label has floated clear of
   * it. A placeholder is a worked example here - never a stand-in for the
   * label, which is always visible (WCAG 2.2 SC 3.3.2).
   */
  placeholder: string;
  /** Renders a `<textarea>` rather than an `<input>`. */
  multiline?: boolean;
  /** `input[type]`; ignored for the multiline field. */
  type?: "text" | "email";
  /** Spans both columns of the two-column field grid. */
  wide?: boolean;
  autoComplete?: string;
  maxLength: number;
  /** Message shown when the field is empty on submit. */
  requiredMessage: string;
}

/** 11 is the shortest a Sri Lankan number with dialling code can be written. */
export const CONTACT_MESSAGE_MIN_LENGTH = 10;

export const CONTACT_FIELDS: readonly ContactField[] = [
  {
    id: "name",
    label: "Full name",
    placeholder: "Nimal Perera",
    type: "text",
    autoComplete: "name",
    maxLength: 120,
    requiredMessage: "Enter your name so the office knows who is writing.",
  },
  {
    id: "email",
    label: "Email",
    placeholder: "nimal.perera@gmail.com",
    type: "email",
    autoComplete: "email",
    maxLength: 254,
    requiredMessage: "Enter an email address so the office can reply.",
  },
  {
    id: "subject",
    label: "Subject",
    placeholder: "Admissions enquiry — Grade 6 entry",
    type: "text",
    wide: true,
    maxLength: 160,
    requiredMessage: "Add a subject so your enquiry reaches the right desk.",
  },
  {
    id: "message",
    label: "Message",
    placeholder:
      "Tell the office what you need, and include any dates or grades that are relevant.",
    multiline: true,
    wide: true,
    maxLength: 4000,
    requiredMessage: "Write your message before sending.",
  },
];

export const CONTACT_EMAIL_INVALID_MESSAGE =
  "Enter a complete email address, including the part after the @.";
export const CONTACT_MESSAGE_TOO_SHORT_MESSAGE =
  "Please give the office a little more detail.";

export type ContactFormValues = Record<ContactField["id"], string>;
