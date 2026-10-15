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

export const CONTACT_HERO_TITLE = "Visit, call or write to us.";
/** The default title breaks here, with the second half set in gold italic. */
export const CONTACT_HERO_TITLE_ACCENT = "or write to us.";
export const CONTACT_HERO_INTRO =
  "The College office handles admissions, records, alumni affairs and general enquiries.";

export const CONTACT_DEPARTMENTS_EYEBROW = "Directory";
export const CONTACT_DEPARTMENTS_HEADING = "Reach the right office";
export const CONTACT_DEPARTMENTS_INTRO =
  "Writing to the correct department gets you an answer faster. If unsure, contact the main office.";

export interface ContactDepartment {
  id: string;
  name: string;
  description: string;
  /** Shown as a `tel:` link. Leave unset until the office's number is known. */
  telephone?: string;
  /** Shown as a `mailto:` link. Leave unset until the office's address is known. */
  email?: string;
}

/**
 * The offices listed in the Contact directory. Add `telephone` and `email` to a
 * row as the numbers are confirmed - a row without them still renders, as the
 * office's name and what it handles, and nothing placeholder-shaped is shown.
 * An empty list hides the whole section.
 */
export const CONTACT_DEPARTMENTS: readonly ContactDepartment[] = [
  {
    id: "principal",
    name: "Principal's Office",
    description: "Appointments and official correspondence",
  },
  {
    id: "admissions",
    name: "Admissions Office",
    description: "Applications, interviews and enrolment",
  },
  {
    id: "academic",
    name: "Deputy Principal (Academic)",
    description: "Examinations, results and curriculum",
  },
  {
    id: "sports",
    name: "Sports Office",
    description: "Fixtures, trials and sports administration",
  },
  {
    id: "oba",
    name: "Old Boys' Association",
    description: "Alumni membership and events",
  },
  {
    id: "media",
    name: "Media Unit",
    description: "Press, photography and website",
  },
];

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
export const CONTACT_MAP_LINK_LABEL = "Get directions";

/**
 * The office's real map, embedded from Google Maps.
 *
 * The College's own Google Maps place entry, which is the link the footer and
 * "View on map" both open. The `output=embed` form of the Maps embed endpoint
 * needs no API key and no billing-enabled Cloud project, so it works for a
 * self-hosted deployment.
 *
 * The pin is the College's registered Google Maps place at 6.0359809 N,
 * 80.2118981 E (Kaluwella, Galle) — resolved from the place shortlink, not
 * guessed. It is the place entry rather than the surveyed gate position, so the
 * map stays paired with the street address above it. CMS-overridable through
 * `contact-map-embed` for the day the College supplies an exact position.
 */
export const CONTACT_MAP_EMBED_URL =
  "https://www.google.com/maps?q=6.0359809,80.2118981&z=17&hl=en&output=embed";

/** The plain link, for "View on map" — the College's own Google Maps place. */
export const CONTACT_MAP_URL = "https://maps.app.goo.gl/JKpQvaxCjGSM5L8GA";

/** Accessible name for the embedded map, which carries no visible text. */
export const CONTACT_MAP_TITLE =
  "Google map of the College office at Templers' Road, Kaluwella, Galle";

export const CONTACT_FORM_EYEBROW = "Enquiries";
export const CONTACT_FORM_HEADING = "Send a Message";
export const CONTACT_FORM_INTRO =
  "Messages reach the College office, which routes them to the relevant department.";
export const CONTACT_FORM_FOOTNOTE = "Responses within school working days.";
/**
 * One statement in place of an asterisk on every label. Asterisks are noise
 * when nothing is optional, and they have to be explained somewhere anyway.
 */
export const CONTACT_FORM_REQUIRED_NOTE =
  "All fields are required except telephone.";
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

/**
 * What happens when there is no enquiry endpoint.
 *
 * The form opens the visitor's own mail client with the message already
 * addressed to the College office and the subject and body filled in. Nothing
 * is sent by this website - the visitor sees and sends it themselves, which is
 * why the status says the email app is "open" rather than "sent".
 *
 * The recipient is a constant rather than something the form supplies, so a
 * visitor cannot retarget the enquiry at an address of their choosing.
 */
export const CONTACT_FORM_MAILTO_SUBJECT = "Enquiry for St. Aloysius' College";
export const CONTACT_FORM_MAILTO_HANDOFF =
  "Your email app should now be open with this message addressed to the College office. Review it and press send — nothing has been sent yet.";

/**
 * `mailto:` is a URL, and browsers and mail clients truncate a very long one.
 *
 * Chrome and Safari both start dropping body text around 2,000 characters once
 * the whole URL is counted; the message field allows 4,000. Rather than silently
 * losing the second half of an enquiry, anything over the limit is refused with
 * a message telling the visitor what to do instead — which keeps the address
 * and telephone they need one click away.
 */
export const CONTACT_FORM_MAILTO_MAX_LENGTH = 1800;
export const CONTACT_FORM_MAILTO_TOO_LONG =
  "Your message is too long to hand off to your email app in one piece. Please shorten it, or email it directly using the address above.";

/** Labels for the composed body, so the office can tell the fields apart. */
export const CONTACT_MAIL_BODY_NAME = "Name";
export const CONTACT_MAIL_BODY_EMAIL = "Email";
export const CONTACT_MAIL_BODY_SUBJECT = "Subject";
export const CONTACT_MAIL_BODY_TELEPHONE = "Telephone";
export const CONTACT_MAIL_BODY_MESSAGE = "Message";

export interface ContactField {
  id: "name" | "email" | "telephone" | "subject" | "message";
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
  /** Left blank without an error; not included in "all fields are required". */
  optional?: boolean;
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
    id: "telephone",
    label: "Telephone",
    placeholder: "07X XXX XXXX",
    type: "text",
    autoComplete: "tel",
    maxLength: 40,
    optional: true,
    requiredMessage: "",
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

export const CONTACT_FORM_ENQUIRY_EYEBROW = "Enquiry";
export const CONTACT_FORM_ENQUIRY_HEADING = "Send us a message";
export const CONTACT_FORM_ENQUIRY_INTRO =
  "Choose a topic, write your message and it is addressed to the right office. Replies come within school working days.";

export interface ContactTopic {
  id: string;
  /** The chip. */
  label: string;
  /** Shown in "Sent to: …" when the topic's own address is used. */
  office: string;
  /** Prefills the subject field. */
  subject: string;
  /**
   * The `CONTACT_DEPARTMENTS` row this topic routes to. The message is
   * addressed to that department only if it has an `email`; otherwise it goes
   * to the main College office, and the form says so.
   */
  departmentId?: string;
}

export const CONTACT_TOPICS: readonly ContactTopic[] = [
  {
    id: "general",
    label: "General",
    office: "College Office",
    subject: "General enquiry",
  },
  {
    id: "admissions",
    label: "Admissions",
    office: "Admissions Office",
    subject: "Admissions enquiry",
    departmentId: "admissions",
  },
  {
    id: "academic",
    label: "Academic",
    office: "Deputy Principal (Academic)",
    subject: "Academic enquiry",
    departmentId: "academic",
  },
  {
    id: "oba",
    label: "Old Boys",
    office: "Old Boys' Association",
    subject: "OBA enquiry",
    departmentId: "oba",
  },
  {
    id: "media",
    label: "Media",
    office: "Media Unit",
    subject: "Media enquiry",
    departmentId: "media",
  },
];

export const CONTACT_MAIN_OFFICE_NAME = "College Office";
