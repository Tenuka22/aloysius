/**
 * Content for the Contact page.
 *
 * Same rule as `content/about.ts` and `content/academics.ts`: every string here
 * is real copy, never a `[CMS: ...]` marker. The mock carried four of those
 * markers (address, telephone, email, office hours) because the college's
 * published details are not in this repository - so those four are modelled as
 * optional props on `ContactDetails` instead. A detail the CMS has not supplied
 * is omitted from the list entirely rather than rendered as an empty row or a
 * placeholder string.
 */

export const CONTACT_HERO_TITLE = "Contact the College";
export const CONTACT_HERO_INTRO =
  "Enquiries about admissions, academic records, alumni affairs and visits are all handled by the College office.";

export const CONTACT_DETAILS_EYEBROW = "Visit & Write";
export const CONTACT_DETAILS_HEADING = "College Office";
/**
 * The one address fact that is safe to ship as a default: it is the college's
 * name and city, which the site states on every page already. Street, postcode,
 * telephone and email come from the CMS.
 */
export const CONTACT_DEFAULT_ADDRESS =
  "St. Aloysius' College, Galle, Sri Lanka";

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
