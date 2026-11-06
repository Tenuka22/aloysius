import * as stylex from "@stylexjs/stylex";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { Dispatch, FormEvent, RefObject, SetStateAction } from "react";

import {
  CONTACT_DEFAULT_EMAIL,
  CONTACT_DEPARTMENTS,
  CONTACT_EMAIL_INVALID_MESSAGE,
  CONTACT_FIELDS,
  CONTACT_FORM_COUNTER_THRESHOLD,
  CONTACT_FORM_FAILURE,
  CONTACT_FORM_MAILTO_HANDOFF,
  CONTACT_FORM_MAILTO_MAX_LENGTH,
  CONTACT_FORM_MAILTO_SUBJECT,
  CONTACT_FORM_MAILTO_TOO_LONG,
  CONTACT_FORM_SENDING_LABEL,
  CONTACT_FORM_SUBMIT_LABEL,
  CONTACT_FORM_SUCCESS,
  CONTACT_MAIL_BODY_EMAIL,
  CONTACT_MAIL_BODY_MESSAGE,
  CONTACT_MAIL_BODY_NAME,
  CONTACT_MAIL_BODY_SUBJECT,
  CONTACT_MAIL_BODY_TELEPHONE,
  CONTACT_MAIN_OFFICE_NAME,
  CONTACT_MESSAGE_MIN_LENGTH,
  CONTACT_MESSAGE_TOO_SHORT_MESSAGE,
  CONTACT_TOPICS,
} from "../../content/contact";
import type {
  ContactDepartment,
  ContactField,
  ContactFormValues,
  ContactTopic,
} from "../../content/contact";
import { color, font, space } from "../../tokens/tokens.stylex";

const spin = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const styles = stylex.create({
  /* ---------------------------------------------------------- topic chips */
  topics: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    margin: 0,
    padding: 0,
    marginBlockEnd: "34px",
    borderWidth: 0,
    minInlineSize: 0,
  },
  /* Names the group for assistive tech; the design draws no visible caption. */
  topicsLegend: {
    position: "absolute",
    inlineSize: "1px",
    blockSize: "1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    padding: 0,
  },
  chip: {
    paddingBlock: "10px",
    paddingInline: "16px",
    borderWidth: "1px",
    borderStyle: "solid",
    fontFamily: font.body,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    cursor: "pointer",
  },
  chipIdle: {
    backgroundColor: "transparent",
    borderColor: "rgba(255, 248, 231, 0.3)",
    color: "rgba(255, 248, 231, 0.85)",
  },
  chipActive: {
    backgroundColor: "#FFB203",
    borderColor: "#FFB203",
    color: "#013405",
  },

  /* --------------------------------------------------------------- fields */
  fields: {
    display: "grid",
    columnGap: "28px",
    rowGap: "30px",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  },
  fieldWide: {
    gridColumn: "1 / -1",
  },
  label: {
    display: "block",
    marginBlockEnd: "6px",
    fontSize: "10.5px",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(255, 248, 231, 0.65)",
  },
  control: {
    boxSizing: "border-box",
    inlineSize: "100%",
    paddingBlock: "10px",
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: {
      default: "rgba(255, 248, 231, 0.3)",
      ":focus": "#FFB203",
    },
    borderRadius: 0,
    color: "#FFF8E7",
    fontFamily: font.body,
    fontSize: "16px",
    outline: {
      default: null,
      ":focus": "none",
    },
    "::placeholder": {
      color: "rgba(255, 248, 231, 0.4)",
    },
  },
  controlInvalid: {
    borderBlockEndColor: color.dangerBright,
  },
  textarea: {
    resize: "vertical",
  },
  counterRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBlockStart: space["3xs"],
  },
  counter: {
    fontFamily: font.mono,
    fontSize: font.size2xs,
    color: color.onInverseSubtle,
  },
  counterAtLimit: {
    color: color.dangerBright,
  },
  error: {
    display: "flex",
    alignItems: "flex-start",
    gap: space["2xs"],
    margin: 0,
    marginBlockStart: space["2xs"],
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.dangerBright,
  },
  errorIcon: {
    flexShrink: 0,
    marginBlockStart: "2px",
  },

  /* ---------------------------------------------------------------- footer */
  footer: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBlockStart: "38px",
  },
  sentTo: {
    margin: 0,
    fontSize: "12.5px",
    color: "rgba(255, 248, 231, 0.55)",
  },
  sentToName: {
    color: "#FFB203",
    fontWeight: 700,
  },
  submit: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    paddingBlock: "16px",
    paddingInline: "36px",
    borderWidth: 0,
    backgroundColor: {
      default: "#FFB203",
      ":hover": "#FFD45A",
      ":disabled": "#FFB203",
    },
    color: "#013405",
    fontFamily: font.body,
    fontSize: "13.5px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    cursor: {
      default: "pointer",
      ":disabled": "progress",
    },
    opacity: {
      default: 1,
      ":disabled": 0.75,
    },
  },
  spinner: {
    animationName: spin,
    animationDuration: "900ms",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
  status: {
    display: "flex",
    alignItems: "flex-start",
    gap: space.xs,
    marginBlockStart: space.md,
    paddingBlock: space.sm,
    paddingInline: space.md,
    borderWidth: space.px,
    borderStyle: "solid",
  },
  statusSuccess: {
    borderColor: color.accent,
    color: color.onInverse,
  },
  statusError: {
    borderColor: color.dangerBright,
    color: color.onInverse,
  },
  statusIcon: {
    flexShrink: 0,
    marginBlockStart: "2px",
  },
  statusText: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
  },
});

type Outcome = "idle" | "sending" | "sent" | "failed" | "handedOff" | "tooLong";

const EMPTY_VALUES: ContactFormValues = {
  name: "",
  email: "",
  telephone: "",
  subject: "",
  message: "",
};

/**
 * Deliberately permissive: the only thing worth rejecting client-side is a
 * clearly incomplete address. Anything stricter rejects valid addresses, and the
 * real check is whether the reply arrives.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

const validate = (values: ContactFormValues) => {
  const errors: Partial<Record<ContactField["id"], string>> = {};
  for (const field of CONTACT_FIELDS) {
    if (!field.optional && values[field.id].trim() === "") {
      errors[field.id] = field.requiredMessage;
    }
  }
  if (!errors.email && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = CONTACT_EMAIL_INVALID_MESSAGE;
  }
  if (
    !errors.message &&
    values.message.trim().length < CONTACT_MESSAGE_MIN_LENGTH
  ) {
    errors.message = CONTACT_MESSAGE_TOO_SHORT_MESSAGE;
  }
  return errors;
};

const STATUS_BY_OUTCOME = {
  sent: { text: CONTACT_FORM_SUCCESS, tone: "success" },
  failed: { text: CONTACT_FORM_FAILURE, tone: "error" },
  handedOff: { text: CONTACT_FORM_MAILTO_HANDOFF, tone: "success" },
  tooLong: { text: CONTACT_FORM_MAILTO_TOO_LONG, tone: "error" },
} as const;

/**
 * Compose the enquiry as a `mailto:` for the visitor's own mail client.
 *
 * This is what the form does when there is no enquiry endpoint. Nothing is sent
 * by the website - the browser hands a URL to whatever mail app the visitor
 * uses, and they press send. That is why the status says the message was
 * *opened*, never that it was sent.
 *
 * The recipient comes from configuration (the main office or a department's
 * configured address), never from a form field, so the enquiry cannot be
 * retargeted by editing a hidden value.
 */
const composeMailto = (
  values: ContactFormValues,
  recipient: string
): string => {
  const subject = values.subject.trim() || CONTACT_FORM_MAILTO_SUBJECT;
  const telephone = values.telephone.trim();
  const body = [
    `${CONTACT_MAIL_BODY_NAME}: ${values.name.trim()}`,
    `${CONTACT_MAIL_BODY_EMAIL}: ${values.email.trim()}`,
    ...(telephone ? [`${CONTACT_MAIL_BODY_TELEPHONE}: ${telephone}`] : []),
    `${CONTACT_MAIL_BODY_SUBJECT}: ${subject}`,
    "",
    `${CONTACT_MAIL_BODY_MESSAGE}:`,
    "",
    values.message.trim(),
  ].join("\n");

  const params = new URLSearchParams({ subject, body });

  return `mailto:${recipient}?${params.toString()}`;
};

export interface ContactFormProps {
  /**
   * Submits the enquiry through the backend. Omitted while no enquiry endpoint
   * exists, in which case the form opens the visitor's own mail client with the
   * message composed - it never claims to have delivered anything itself.
   */
  onSubmit?: (values: ContactFormValues) => Promise<void>;
  /** Where the composed message is addressed. Defaults to the College office. */
  mailTo?: string;
  topics?: readonly ContactTopic[];
  /**
   * The directory `resolveRecipient` joins `topics[*].departmentId` against.
   * Defaults to the static `CONTACT_DEPARTMENTS`; the Contact route passes
   * the live CMS list so an admin's edits change where enquiries land.
   */
  departments?: readonly ContactDepartment[];
}

/**
 * Where a topic's message actually goes: the department's own address when one
 * is configured, otherwise the main office. "Sent to" shows this, so the page
 * never names an office that will not receive the message.
 */
const resolveRecipient = (
  topic: ContactTopic | undefined,
  mailTo: string,
  departments: readonly ContactDepartment[]
) => {
  const department = departments.find(
    (entry) => entry.id === topic?.departmentId
  );
  if (topic && department?.email) {
    return { name: topic.office, email: department.email };
  }
  return { name: CONTACT_MAIN_OFFICE_NAME, email: mailTo };
};

interface ContactFormFieldProps {
  controls: RefObject<Map<ContactField["id"], HTMLElement>>;
  error: string | undefined;
  field: ContactField;
  formId: string;
  setValues: Dispatch<SetStateAction<ContactFormValues>>;
  value: string;
}

const ContactFormField = ({
  controls,
  error,
  field,
  formId,
  setValues,
  value,
}: ContactFormFieldProps) => {
  const inputId = `${formId}-${field.id}`;
  const errorId = `${inputId}-error`;
  const showCounter =
    field.multiline &&
    value.length > field.maxLength * CONTACT_FORM_COUNTER_THRESHOLD;
  const shared = {
    "aria-describedby": error ? errorId : undefined,
    "aria-invalid": error ? true : undefined,
    autoComplete: field.autoComplete,
    id: inputId,
    maxLength: field.maxLength,
    name: field.id,
    onChange: (event: { target: { value: string } }) => {
      setValues((current) => ({
        ...current,
        [field.id]: event.target.value,
      }));
    },
    placeholder: field.placeholder,
    ref: (node: HTMLElement | null) => {
      if (node) {
        controls.current.set(field.id, node);
      } else {
        controls.current.delete(field.id);
      }
    },
    required: !field.optional,
    value,
  } as const;

  return (
    <div {...stylex.props(field.wide && styles.fieldWide)}>
      <label htmlFor={inputId} {...stylex.props(styles.label)}>
        {field.label}
      </label>
      {field.multiline ? (
        <textarea
          rows={4}
          {...shared}
          {...stylex.props(
            styles.control,
            styles.textarea,
            Boolean(error) && styles.controlInvalid
          )}
        />
      ) : (
        <input
          type={field.type ?? "text"}
          {...shared}
          {...stylex.props(
            styles.control,
            Boolean(error) && styles.controlInvalid
          )}
        />
      )}
      {showCounter ? (
        <div {...stylex.props(styles.counterRow)}>
          <span
            // The field's error text is what needs announcing; a counter
            // ticking on every keystroke would talk over it.
            aria-hidden="true"
            {...stylex.props(
              styles.counter,
              value.length === field.maxLength && styles.counterAtLimit
            )}
          >
            {value.length} / {field.maxLength}
          </span>
        </div>
      ) : null}
      {error ? (
        <p id={errorId} {...stylex.props(styles.error)}>
          <AlertCircle
            aria-hidden="true"
            size={14}
            {...stylex.props(styles.errorIcon)}
          />
          {error}
        </p>
      ) : null}
    </div>
  );
};

export const ContactForm = ({
  onSubmit,
  mailTo = CONTACT_DEFAULT_EMAIL,
  topics = CONTACT_TOPICS,
  departments = CONTACT_DEPARTMENTS,
}: ContactFormProps) => {
  const formId = useId();
  /*
   * Refs rather than a `document` lookup by id: `useId()` returns values
   * containing characters that are not valid in a CSS selector, so
   * `querySelector('#' + id)` throws rather than missing.
   */
  const controls = useRef(new Map<ContactField["id"], HTMLElement>());
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [values, setValues] = useState<ContactFormValues>({
    ...EMPTY_VALUES,
    subject: topics[0]?.subject ?? "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<ContactField["id"], string>>
  >({});
  const [outcome, setOutcome] = useState<Outcome>("idle");

  const topic = topics.find((entry) => entry.id === topicId);
  const recipient = resolveRecipient(topic, mailTo, departments);

  const pickTopic = (next: ContactTopic) => {
    setTopicId(next.id);
    setValues((current) => ({ ...current, subject: next.subject }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      /*
       * Move focus to the first field that failed. Without this, a keyboard or
       * screen-reader user is left on the submit button with the errors
       * announced but no idea where they are (WCAG 2.2 SC 3.3.1).
       */
      const firstInvalid = CONTACT_FIELDS.find((field) => nextErrors[field.id]);
      if (firstInvalid) {
        controls.current.get(firstInvalid.id)?.focus();
      }
      setOutcome("idle");
      return;
    }

    if (!onSubmit) {
      /*
       * No endpoint: hand the composed message to the visitor's own mail app.
       * Refused rather than truncated when the URL runs past what mail clients
       * will read - a silently cut-off enquiry is worse than one the visitor
       * knows to send by hand.
       */
      const mailto = composeMailto(values, recipient.email);
      if (mailto.length > CONTACT_FORM_MAILTO_MAX_LENGTH) {
        setOutcome("tooLong");
        return;
      }
      setOutcome("handedOff");
      window.location.href = mailto;
      return;
    }

    setOutcome("sending");
    try {
      await onSubmit(values);
      setValues({ ...EMPTY_VALUES, subject: topic?.subject ?? "" });
      setOutcome("sent");
    } catch {
      setOutcome("failed");
    }
  };

  const status =
    outcome === "idle" || outcome === "sending"
      ? null
      : STATUS_BY_OUTCOME[outcome];
  const sending = outcome === "sending";

  return (
    /*
      `noValidate` hands validation to the code above rather than the browser:
      native bubbles are not announced consistently, vanish on scroll, and
      cannot be styled to meet contrast.
    */
    <form noValidate onSubmit={handleSubmit}>
      {topics.length > 0 ? (
        <fieldset {...stylex.props(styles.topics)}>
          <legend {...stylex.props(styles.topicsLegend)}>Topic</legend>
          {topics.map((entry) => {
            const on = entry.id === topicId;
            return (
              <button
                aria-pressed={on}
                key={entry.id}
                onClick={() => pickTopic(entry)}
                type="button"
                {...stylex.props(
                  styles.chip,
                  on ? styles.chipActive : styles.chipIdle
                )}
              >
                {entry.label}
              </button>
            );
          })}
        </fieldset>
      ) : null}

      <div {...stylex.props(styles.fields)}>
        {CONTACT_FIELDS.map((field) => (
          <ContactFormField
            controls={controls}
            error={errors[field.id]}
            field={field}
            formId={formId}
            key={field.id}
            setValues={setValues}
            value={values[field.id]}
          />
        ))}
      </div>

      <div {...stylex.props(styles.footer)}>
        <div>
          <p {...stylex.props(styles.sentTo)}>
            Sent to:{" "}
            <strong {...stylex.props(styles.sentToName)}>
              {recipient.name}
            </strong>
          </p>
        </div>
        <button
          disabled={sending}
          type="submit"
          {...stylex.props(styles.submit)}
        >
          {sending ? CONTACT_FORM_SENDING_LABEL : CONTACT_FORM_SUBMIT_LABEL}
          {sending ? (
            <Loader2
              aria-hidden="true"
              size={16}
              {...stylex.props(styles.spinner)}
            />
          ) : null}
        </button>
      </div>

      {/*
        One permanently-mounted live region. Mounting it only when there is a
        message means the region is new to the accessibility tree at the moment
        the text appears, and several screen readers stay silent.
      */}
      <output aria-live="polite">
        {status ? (
          <div
            {...stylex.props(
              styles.status,
              status.tone === "success"
                ? styles.statusSuccess
                : styles.statusError
            )}
          >
            {status.tone === "success" ? (
              <CheckCircle2
                aria-hidden="true"
                size={18}
                {...stylex.props(styles.statusIcon)}
              />
            ) : (
              <AlertCircle
                aria-hidden="true"
                size={18}
                {...stylex.props(styles.statusIcon)}
              />
            )}
            <p {...stylex.props(styles.statusText)}>{status.text}</p>
          </div>
        ) : null}
      </output>
    </form>
  );
};
