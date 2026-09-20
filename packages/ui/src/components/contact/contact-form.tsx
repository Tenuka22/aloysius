import * as stylex from "@stylexjs/stylex";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  PenLine,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  CONTACT_EMAIL_INVALID_MESSAGE,
  CONTACT_FIELDS,
  CONTACT_FORM_COUNTER_THRESHOLD,
  CONTACT_FORM_EYEBROW,
  CONTACT_FORM_FAILURE,
  CONTACT_FORM_FOOTNOTE,
  CONTACT_FORM_HEADING,
  CONTACT_FORM_INTRO,
  CONTACT_FORM_NO_ENDPOINT,
  CONTACT_FORM_REQUIRED_NOTE,
  CONTACT_FORM_SENDING_LABEL,
  CONTACT_FORM_SUBMIT_LABEL,
  CONTACT_FORM_SUCCESS,
  CONTACT_MESSAGE_MIN_LENGTH,
  CONTACT_MESSAGE_TOO_SHORT_MESSAGE,
} from "../../content/contact";
import type { ContactField, ContactFormValues } from "../../content/contact";
import { bp } from "../../tokens/breakpoints.stylex";
import {
  color,
  font,
  motionToken,
  radius,
  shadow,
  space,
} from "../../tokens/tokens.stylex";

/** Matches `primitives/button.tsx`: 44px, for kiosks and smart boards too. */
const MIN_TARGET = "2.75rem";

/** Soft gold focus halo, as used on the sign-in form. */
const INPUT_HALO = "rgba(255, 178, 3, 0.32)";
/** Crimson halo for the invalid state, at the same weight as the gold one. */
const INVALID_HALO = "rgba(165, 25, 25, 0.22)";

/** Inset well, so a field reads as something to write *into*, not a flat box. */
const FIELD_WELL = "inset 0 1px 2px rgba(1, 52, 5, 0.06)";

/** Leading space inside a control, sized to clear the field icon. */
const CONTROL_INDENT = "3rem";

const spin = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const styles = stylex.create({
  /*
   * The card is the page's one raised object, so it carries the site's editorial
   * structure rather than a hairline border: a deep-green masthead, a gold rule,
   * then the writing surface. That masthead is also what stops the form reading
   * as a bare stack of inputs at the bottom of a cream page.
   */
  card: {
    overflow: "hidden",
    backgroundColor: color.surfaceRaised,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: radius.md,
    boxShadow: shadow.md,
  },

  masthead: {
    position: "relative",
    overflow: "hidden",
    backgroundImage: `linear-gradient(135deg, ${color.surfaceInverse}, ${color.surfaceInverseDeep})`,
    color: color.onInverse,
    paddingBlock: "clamp(1.25rem, 0.9rem + 1.6vw, 2rem)",
    paddingInline: "clamp(1.25rem, 0.9rem + 2vw, 3rem)",
    // The gold rule that divides masthead from writing surface.
    borderBlockEndWidth: "3px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.accent,
  },
  /**
   * Oversized outline glyph bled off the top-right corner. Decorative depth for
   * the masthead; not painted below 40rem, where it would sit under the heading.
   */
  mastheadGlyph: {
    position: "absolute",
    insetInlineEnd: "-1.5rem",
    insetBlockStart: "-1.5rem",
    opacity: 0.12,
    color: color.accent,
    pointerEvents: "none",
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
  mastheadBody: {
    position: "relative",
    maxWidth: space.measure,
  },
  eyebrow: {
    margin: 0,
    marginBlockEnd: space["2xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingUltra,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  heading: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.size2xl,
    lineHeight: font.leadingSnug,
    letterSpacing: font.trackingTight,
    color: color.onInverse,
    textWrap: "balance",
  },
  intro: {
    margin: 0,
    marginBlockStart: space["2xs"],
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },

  body: {
    paddingBlock: "clamp(1.25rem, 0.9rem + 2vw, 2.5rem)",
    paddingInline: "clamp(1.25rem, 0.9rem + 2vw, 3rem)",
  },
  requiredNote: {
    margin: 0,
    marginBlockEnd: space.md,
    fontSize: font.sizeXs,
    fontWeight: font.weightSemibold,
    letterSpacing: font.trackingWide,
    color: color.onSurfaceSubtle,
  },

  /*
   * One column on phones. The name/email pair only splits at 40rem - narrower
   * than that, two inputs side by side are each under 140px wide, which is not
   * enough to read back what you typed.
   */
  fields: {
    display: "grid",
    gridTemplateColumns: {
      default: "1fr",
      [bp.md]: "repeat(2, minmax(0, 1fr))",
    },
    columnGap: space.md,
    rowGap: space.md,
  },
  fieldWide: {
    gridColumn: {
      default: "auto",
      [bp.md]: "1 / -1",
    },
  },

  /*
   * Floating label. The label is always rendered and always readable - it simply
   * moves from inside the field to a small caps line at its head once the field
   * is focused or filled. That is the difference between this and the
   * placeholder-as-label pattern it resembles: nothing disappears when you type
   * (WCAG 2.2 SC 3.3.2), and the accessible name never changes.
   */
  label: {
    position: "absolute",
    insetInlineStart: CONTROL_INDENT,
    insetBlockStart: "50%",
    transformOrigin: "left top",
    transform: "translateY(-50%)",
    fontSize: font.sizeMd,
    fontWeight: font.weightMedium,
    letterSpacing: font.trackingNormal,
    lineHeight: font.leadingSnug,
    color: color.onSurfaceSubtle,
    textTransform: "none",
    // The field beneath takes the click; the label must not intercept it.
    pointerEvents: "none",
    whiteSpace: "nowrap",
    transitionProperty: "transform, font-size, color, letter-spacing",
    transitionDuration: {
      default: motionToken.fast,
      // No slide for users who asked for less motion - it simply swaps place.
      [bp.reducedMotion]: "1ms",
    },
    transitionTimingFunction: motionToken.ease,
  },
  labelFloated: {
    transform: "translateY(-1.45rem)",
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceMuted,
  },
  labelActive: {
    color: color.accentOnSurface,
  },
  /** The multiline field's label anchors to its first line, not its middle. */
  labelMultiline: {
    insetBlockStart: "1.6rem",
  },

  counterRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBlockStart: space["3xs"],
  },
  counter: {
    fontSize: font.size2xs,
    fontVariantNumeric: "tabular-nums",
    color: color.onSurfaceSubtle,
  },
  counterAtLimit: {
    color: color.danger,
  },

  /** Positioning context for the field icon that sits inside the control. */
  well: {
    position: "relative",
    display: "block",
  },
  fieldIcon: {
    position: "absolute",
    insetInlineStart: space.sm,
    insetBlockStart: "50%",
    transform: "translateY(-50%)",
    color: color.onSurfaceSubtle,
    pointerEvents: "none",
    transitionProperty: "color",
    transitionDuration: motionToken.fast,
  },
  fieldIconInvalid: {
    color: color.danger,
  },

  control: {
    width: "100%",
    boxSizing: "border-box",
    display: "block",
    /*
     * Tall enough to seat the floated label above the text: 1.25rem of head
     * room, then the value. Comfortably past the 44px minimum target as well.
     */
    minBlockSize: "3.9rem",
    paddingBlockStart: "1.6rem",
    paddingBlockEnd: space.xs,
    paddingInlineStart: CONTROL_INDENT,
    paddingInlineEnd: space.sm,
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.border,
      ":hover": color.borderStrong,
      ":focus-visible": color.accent,
    },
    borderRadius: radius.md,
    fontFamily: font.body,
    /*
     * 16px minimum. iOS Safari zooms the viewport on focus for anything smaller,
     * which on a phone leaves the user pinched into the form.
     */
    fontSize: font.sizeLg,
    lineHeight: font.leadingNormal,
    color: color.onSurface,
    outline: "none",
    boxShadow: {
      default: FIELD_WELL,
      ":focus-visible": `0 0 0 3px ${INPUT_HALO}`,
    },
    transitionProperty: "border-color, box-shadow, background-color",
    transitionDuration: motionToken.fast,
    transitionTimingFunction: motionToken.ease,
    "::placeholder": {
      color: color.placeholderInk,
      opacity: 1,
    },
  },
  controlInvalid: {
    borderColor: color.danger,
    boxShadow: {
      default: `0 0 0 3px ${INVALID_HALO}`,
      ":focus-visible": `0 0 0 3px ${INVALID_HALO}`,
    },
  },
  textarea: {
    minBlockSize: "9.5rem",
    paddingBlockStart: "2.4rem",
    resize: "vertical",
  },
  /** The textarea icon aligns to its first line, not to the box's middle. */
  textareaIcon: {
    insetBlockStart: "1.7rem",
  },
  fieldIconActive: {
    color: color.accentOnSurface,
  },

  error: {
    display: "flex",
    alignItems: "flex-start",
    gap: space["3xs"],
    margin: 0,
    marginBlockStart: space["2xs"],
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    fontWeight: font.weightSemibold,
    color: color.danger,
  },
  errorIcon: {
    flexShrink: 0,
    marginBlockStart: "0.1rem",
  },

  /*
   * The action row sits on its own band, divided from the fields by a rule, so
   * the primary action reads as a step rather than as one more form row.
   */
  footer: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.md,
    alignItems: "center",
    justifyContent: "space-between",
    marginBlockStart: space.lg,
    paddingBlockStart: space.md,
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.border,
  },
  footnote: {
    margin: 0,
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceSubtle,
  },
  /*
   * Gold, not green: this is the page's primary action and gold is the brand's
   * primary action colour throughout the site. Deep green here competed with
   * the masthead directly above it.
   */
  submit: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space["2xs"],
    // Full width while it is the only thing on its row on a phone.
    width: {
      default: "100%",
      [bp.sm]: "auto",
    },
    minBlockSize: MIN_TARGET,
    paddingBlock: space.xs,
    paddingInline: space.xl,
    backgroundColor: {
      default: color.accent,
      ":hover": color.accentHover,
    },
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: radius.md,
    boxShadow: shadow.sm,
    color: color.onAccent,
    fontFamily: font.body,
    fontSize: font.sizeSm,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    // Hover lift only where a real pointer exists - on touch a `:hover`
    // transform sticks after the tap until you tap elsewhere.
    transform: {
      default: "translateY(0)",
      [bp.hover]: {
        default: "translateY(0)",
        ":hover": "translateY(-2px)",
        ":active": "translateY(0)",
      },
    },
    opacity: {
      default: 1,
      ":disabled": 0.65,
    },
    transitionProperty: "background-color, transform, opacity",
    transitionDuration: motionToken.base,
    transitionTimingFunction: motionToken.ease,
  },
  submitIcon: {
    flexShrink: 0,
  },
  spinner: {
    flexShrink: 0,
    animationName: spin,
    // A spinner is the one motion that must keep meaning something, so it slows
    // right down for reduced-motion users rather than stopping dead.
    animationDuration: {
      default: "900ms",
      [bp.reducedMotion]: "2.4s",
    },
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
  },

  status: {
    display: "flex",
    alignItems: "flex-start",
    gap: space["2xs"],
    marginBlockStart: space.md,
    padding: space.sm,
    borderRadius: radius.md,
    borderInlineStartWidth: "3px",
    borderInlineStartStyle: "solid",
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
  },
  statusSuccess: {
    backgroundColor: color.surfaceSunken,
    borderInlineStartColor: color.accent,
    color: color.onSurface,
  },
  statusError: {
    backgroundColor: color.surfaceSunken,
    borderInlineStartColor: color.danger,
    color: color.onSurface,
  },
  statusIcon: {
    flexShrink: 0,
    marginBlockStart: "0.1rem",
  },
  statusText: {
    margin: 0,
  },
});

/** One glyph per field, so the form reads at a glance before it is read. */
const FIELD_ICONS: Record<ContactField["id"], LucideIcon> = {
  name: UserRound,
  email: Mail,
  subject: PenLine,
  message: MessageSquare,
};

type Outcome = "idle" | "sending" | "sent" | "failed" | "unwired";

const EMPTY_VALUES: ContactFormValues = {
  name: "",
  email: "",
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
    if (values[field.id].trim() === "") {
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
  unwired: { text: CONTACT_FORM_NO_ENDPOINT, tone: "error" },
} as const;

export interface ContactFormProps {
  /**
   * Submits the enquiry. Omitted while no enquiry endpoint exists - the form
   * then validates, clears nothing, and tells the user plainly that the message
   * was not sent. It never pretends to have delivered it.
   */
  onSubmit?: (values: ContactFormValues) => Promise<void>;
}

export const ContactForm = ({ onSubmit }: ContactFormProps) => {
  const formId = useId();
  /*
   * Refs rather than a `document` lookup by id: `useId()` returns values
   * containing characters that are not valid in a CSS selector, so
   * `querySelector('#' + id)` throws rather than missing.
   */
  const controls = useRef(new Map<ContactField["id"], HTMLElement>());
  const [values, setValues] = useState<ContactFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<
    Partial<Record<ContactField["id"], string>>
  >({});
  const [outcome, setOutcome] = useState<Outcome>("idle");
  /*
   * Which field has focus. Drives the label float and the example placeholder.
   * A CSS-only version needs `:focus ~ label` / `:placeholder-shown`, and StyleX
   * emits no sibling selectors, so the state lives here instead.
   */
  const [focused, setFocused] = useState<ContactField["id"] | null>(null);

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
      setOutcome("unwired");
      return;
    }

    setOutcome("sending");
    try {
      await onSubmit(values);
      setValues(EMPTY_VALUES);
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
    <div {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.masthead)}>
        <MessageSquare
          aria-hidden="true"
          size={132}
          strokeWidth={0.75}
          {...stylex.props(styles.mastheadGlyph)}
        />
        <div {...stylex.props(styles.mastheadBody)}>
          <p {...stylex.props(styles.eyebrow)}>{CONTACT_FORM_EYEBROW}</p>
          <h2 id="contact-form-title" {...stylex.props(styles.heading)}>
            {CONTACT_FORM_HEADING}
          </h2>
          <p {...stylex.props(styles.intro)}>{CONTACT_FORM_INTRO}</p>
        </div>
      </div>

      <div {...stylex.props(styles.body)}>
        <p {...stylex.props(styles.requiredNote)}>
          {CONTACT_FORM_REQUIRED_NOTE}
        </p>

        {/*
          `noValidate` hands validation to the code above rather than the
          browser: native bubbles are not announced consistently, vanish on
          scroll, and cannot be styled to meet contrast.
        */}
        <form noValidate onSubmit={handleSubmit}>
          <div {...stylex.props(styles.fields)}>
            {CONTACT_FIELDS.map((field) => {
              const inputId = `${formId}-${field.id}`;
              const errorId = `${inputId}-error`;
              const error = errors[field.id];
              const invalid = Boolean(error);
              const Icon = FIELD_ICONS[field.id];
              const used = values[field.id].length;
              /*
               * The counter only appears once the cap is actually in view, so it
               * reads as information rather than as pressure to be brief.
               */
              const showCounter =
                field.multiline &&
                used > field.maxLength * CONTACT_FORM_COUNTER_THRESHOLD;

              const hasFocus = focused === field.id;
              // Floated once there is anything to sit above: focus or content.
              const floated = hasFocus || values[field.id] !== "";

              const shared = {
                "aria-describedby": error ? errorId : undefined,
                "aria-invalid": error ? true : undefined,
                autoComplete: field.autoComplete,
                id: inputId,
                maxLength: field.maxLength,
                name: field.id,
                onBlur: () => {
                  setFocused((current) =>
                    current === field.id ? null : current
                  );
                },
                onChange: (event: { target: { value: string } }) => {
                  setValues((current) => ({
                    ...current,
                    [field.id]: event.target.value,
                  }));
                },
                onFocus: () => {
                  setFocused(field.id);
                },
                /*
                 * The worked example only appears once the label has floated
                 * clear, so the two never share a line and the placeholder is
                 * never doing the label's job.
                 */
                placeholder: hasFocus ? field.placeholder : "",
                ref: (node: HTMLElement | null) => {
                  if (node) {
                    controls.current.set(field.id, node);
                  } else {
                    controls.current.delete(field.id);
                  }
                },
                required: true,
                value: values[field.id],
              } as const;

              return (
                <div
                  key={field.id}
                  {...stylex.props(field.wide && styles.fieldWide)}
                >
                  <div {...stylex.props(styles.well)}>
                    <Icon
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.75}
                      {...stylex.props(
                        styles.fieldIcon,
                        field.multiline && styles.textareaIcon,
                        hasFocus && styles.fieldIconActive,
                        invalid && styles.fieldIconInvalid
                      )}
                    />
                    {field.multiline ? (
                      <textarea
                        rows={5}
                        {...shared}
                        {...stylex.props(
                          styles.control,
                          styles.textarea,
                          invalid && styles.controlInvalid
                        )}
                      />
                    ) : (
                      <input
                        type={field.type ?? "text"}
                        {...shared}
                        {...stylex.props(
                          styles.control,
                          invalid && styles.controlInvalid
                        )}
                      />
                    )}
                    {/*
                      After the control in the DOM so it paints over it, but
                      still its `<label for>` - the accessible name and
                      click-to-focus behaviour are unchanged.
                    */}
                    <label
                      htmlFor={inputId}
                      {...stylex.props(
                        styles.label,
                        field.multiline && styles.labelMultiline,
                        floated && styles.labelFloated,
                        hasFocus && styles.labelActive
                      )}
                    >
                      {field.label}
                    </label>
                  </div>

                  {showCounter ? (
                    <div {...stylex.props(styles.counterRow)}>
                      <span
                        // The field's error text is what needs announcing; a
                        // counter ticking on every keystroke would talk over it.
                        aria-hidden="true"
                        {...stylex.props(
                          styles.counter,
                          used === field.maxLength && styles.counterAtLimit
                        )}
                      >
                        {used} / {field.maxLength}
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
            })}
          </div>

          <div {...stylex.props(styles.footer)}>
            <p {...stylex.props(styles.footnote)}>{CONTACT_FORM_FOOTNOTE}</p>
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
              ) : (
                <ArrowRight
                  aria-hidden="true"
                  size={16}
                  {...stylex.props(styles.submitIcon)}
                />
              )}
            </button>
          </div>

          {/*
            One permanently-mounted live region. Mounting it only when there is a
            message means the region is new to the accessibility tree at the
            moment the text appears, and several screen readers stay silent - the
            same defect fixed for the achievement filter in frontend-audit §6.
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
      </div>
    </div>
  );
};
