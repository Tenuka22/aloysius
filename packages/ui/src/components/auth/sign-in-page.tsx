import * as stylex from "@stylexjs/stylex";
import { useId, useState } from "react";
import type { FormEvent } from "react";

import { bp } from "../../tokens/breakpoints.stylex";
import {
  color,
  font,
  motionToken,
  radius,
  space,
} from "../../tokens/tokens.stylex";
import { Media } from "../primitives/media";

/**
 * Minimum interactive size, matching `primitives/button.tsx`. WCAG 2.2 SC 2.5.8
 * asks for 24x24 CSS px; 44px is the Apple/Android guidance and the right
 * target for the kiosks and smart boards this site also runs on.
 */
const MIN_TARGET = "2.75rem";

const ambient = stylex.keyframes({
  "0%, 100%": { opacity: 0.18, transform: "scale(1)" },
  "50%": { opacity: 0.42, transform: "scale(1.08)" },
});

const styles = stylex.create({
  /*
   * Mobile-first: one column. The two-panel split only engages at `xl`
   * (1024px), because the brand panel needs ~420px to not look like a band of
   * wasted colour, and the form needs ~360px plus gutters beside it.
   */
  page: {
    display: "grid",
    gridTemplateColumns: {
      default: "1fr",
      [bp.xl]: "minmax(0, 1fr) minmax(0, 1fr)",
    },
    // `dvh` tracks the collapsing mobile URL bar; `vh` is the fallback for
    // iOS < 15.4 and Chrome < 108.
    minHeight: stylex.firstThatWorks("100dvh", "100vh"),
    backgroundColor: color.surface,
    fontFamily: font.body,
    color: color.onSurface,
  },

  /* ---------------------------------------------------------------- brand */

  brand: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: space.xl,
    overflow: "hidden",
    isolation: "isolate",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    paddingInline: space.gutter,
    paddingBlock: space.xl,
    // Safe-area insets: on a notched phone in landscape this panel is against
    // the physical edge.
    paddingInlineStart: `max(${space.gutter}, env(safe-area-inset-left))`,
    minHeight: {
      default: "auto",
      [bp.xl]: "100%",
    },
  },
  brandPhoto: {
    position: "absolute",
    inset: 0,
    zIndex: -2,
  },
  /**
   * The mock layered a full-bleed photograph under a green wash. Keeping the
   * wash as a gradient rather than a flat overlay preserves the depth without
   * a second stacking layer.
   */
  brandWash: {
    position: "absolute",
    inset: 0,
    zIndex: -1,
    backgroundImage: `linear-gradient(160deg, rgba(1,52,5,0.82) 0%, rgba(1,52,5,0.9) 55%, rgba(6,43,10,0.97) 100%)`,
    pointerEvents: "none",
  },
  /**
   * Ambient gold bloom. Purely decorative, so it is removed entirely — not
   * merely paused — under `prefers-reduced-motion`, and it never animates on
   * coarse pointers where the compositing cost buys nothing.
   */
  bloom: {
    position: "absolute",
    insetBlockStart: "-30%",
    insetInlineEnd: "-30%",
    inlineSize: "min(34rem, 90%)",
    blockSize: "min(34rem, 60vh)",
    zIndex: -1,
    borderRadius: radius.circle,
    backgroundImage:
      "radial-gradient(circle, rgba(255,178,3,0.22), transparent 65%)",
    pointerEvents: "none",
    animationName: {
      default: ambient,
      [bp.reducedMotion]: "none",
    },
    animationDuration: "9s",
    animationTimingFunction: motionToken.easeInOut,
    animationIterationCount: "infinite",
    opacity: {
      default: 0.18,
      [bp.reducedMotion]: 0.18,
    },
  },

  lockup: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: space.xs,
    textDecoration: "none",
    color: "inherit",
    alignSelf: "flex-start",
    minHeight: MIN_TARGET,
    borderRadius: radius.md,
    outlineColor: color.focusRingInverse,
    outlineOffset: space["3xs"],
    outlineStyle: {
      default: "none",
      ":focus-visible": "solid",
    },
    outlineWidth: "3px",
  },
  crest: {
    blockSize: "clamp(2.5rem, 1.9rem + 3vw, 3.5rem)",
    inlineSize: "auto",
    display: "block",
    flexShrink: 0,
  },
  // Both lines must be block: as inline spans they ran together into
  // "ST. ALOYSIUS' COLLEGEGALLE - SRI LANKA".
  wordmark: {
    display: "block",
    fontSize: font.sizeSm,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    lineHeight: font.leadingSnug,
    margin: 0,
  },
  wordmarkSub: {
    display: "block",
    fontSize: font.size2xs,
    letterSpacing: font.trackingWidest,
    color: color.accentOnInverse,
    lineHeight: font.leadingSnug,
    margin: 0,
  },

  pitch: {
    position: "relative",
    // The pitch block is the one thing that may be dropped on a short landscape
    // phone, where vertical room is the scarce resource.
    display: {
      default: "none",
      [bp.md]: "block",
    },
    maxInlineSize: "32ch",
  },
  motto: {
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingUltra,
    color: color.accentOnInverse,
    margin: `0 0 ${space.md}`,
  },
  pitchTitle: {
    fontFamily: font.display,
    // Deliberately one step below the hero scale: this is a utility page.
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    margin: 0,
  },
  rule: {
    inlineSize: "3.5rem",
    blockSize: "2px",
    backgroundColor: color.accent,
    borderWidth: 0,
    borderStyle: "none",
    margin: `${space.md} 0`,
  },
  pitchBody: {
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: font.sizeXl,
    lineHeight: font.leadingNormal,
    color: color.onInverseMuted,
    margin: 0,
  },

  marks: {
    position: "relative",
    display: {
      default: "none",
      [bp.lg]: "flex",
    },
    flexWrap: "wrap",
    gap: space.xl,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  markValue: {
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    color: color.accentOnInverse,
    lineHeight: 1,
    display: "block",
  },
  markLabel: {
    fontSize: font.size2xs,
    letterSpacing: font.trackingWider,
    color: color.onInverseSubtle,
    display: "block",
    marginBlockStart: space["2xs"],
  },

  /* ----------------------------------------------------------------- form */

  formPane: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingInline: space.gutter,
    paddingBlock: space["2xl"],
    paddingInlineEnd: `max(${space.gutter}, env(safe-area-inset-right))`,
    paddingBlockEnd: `max(${space["2xl"]}, env(safe-area-inset-bottom))`,
  },
  form: {
    inlineSize: "100%",
    // Caps the measure so the form never stretches on a 4K panel, while the
    // pane around it keeps centring.
    maxInlineSize: "27.5rem",
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
  },

  eyebrow: {
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    color: color.accentOnSurface,
    margin: 0,
  },
  title: {
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    margin: `${space["2xs"]} 0 0`,
  },
  subtitle: {
    fontSize: font.sizeMd,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceSubtle,
    margin: `${space["2xs"]} 0 ${space.md}`,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
  },
  label: {
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    color: color.onSurface,
  },
  /**
   * `center`, not `baseline`: the "Forgot?" link carries a full 44px hit area,
   * so baseline alignment would hang it below the label it sits beside.
   */
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space["2xs"],
    flexWrap: "wrap",
    // Reclaims the slack the 44px target adds above the input.
    marginBlockEnd: `calc(-1 * ${space["2xs"]})`,
  },
  inputWrap: {
    position: "relative",
    display: "flex",
  },
  input: {
    inlineSize: "100%",
    minHeight: MIN_TARGET,
    paddingBlock: space.xs,
    paddingInline: space.sm,
    // 16px minimum: anything smaller triggers iOS Safari's auto-zoom on focus,
    // which then leaves the page zoomed after blur.
    fontSize: `max(1rem, ${font.sizeMd})`,
    fontFamily: font.body,
    color: color.onSurface,
    backgroundColor: color.surfaceRaised,
    borderWidth: space.px,
    borderStyle: "solid",
    // `borderStrong` is 3.4:1 on cream - a visible field boundary, unlike the
    // stub's #ccc.
    borderColor: {
      default: color.borderStrong,
      ":focus-visible": color.onSurface,
    },
    borderRadius: radius.md,
    outlineColor: color.focusRing,
    outlineOffset: "2px",
    outlineStyle: {
      default: "none",
      ":focus-visible": "solid",
    },
    outlineWidth: "3px",
    transitionProperty: "border-color, background-color",
    transitionDuration: motionToken.fast,
  },
  inputInvalid: {
    borderColor: color.danger,
  },
  /**
   * Reserves room for the reveal button using a logical inline-end pad that is
   * sized from the control itself, so a longer translation of "Show"/"Hide"
   * cannot overlap the value (mock §5.10).
   */
  inputWithAction: {
    paddingInlineEnd: "5.5rem",
  },
  reveal: {
    position: "absolute",
    insetInlineEnd: space["3xs"],
    insetBlockStart: "50%",
    transform: "translateY(-50%)",
    display: "inline-flex",
    alignItems: "center",
    minHeight: "2.25rem",
    paddingInline: space["2xs"],
    borderWidth: 0,
    borderStyle: "none",
    borderRadius: radius.sm,
    backgroundColor: "transparent",
    fontFamily: font.body,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    color: {
      default: color.onSurfaceSubtle,
      ":hover": color.accentOnSurface,
    },
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    outlineColor: color.focusRing,
    outlineOffset: "2px",
    outlineStyle: {
      default: "none",
      ":focus-visible": "solid",
    },
    outlineWidth: "3px",
  },

  forgot: {
    // WCAG 2.2 SC 2.5.8 floor is 24x24; the rest of the app is on a 44px grid
    // and this link is no exception, even though its text is only 16px tall.
    display: "inline-flex",
    alignItems: "center",
    minHeight: MIN_TARGET,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    color: color.accentOnSurface,
    textDecorationLine: "underline",
    textUnderlineOffset: "3px",
    borderRadius: radius.sm,
    outlineColor: color.focusRing,
    outlineOffset: "2px",
    outlineStyle: {
      default: "none",
      ":focus-visible": "solid",
    },
    outlineWidth: "3px",
  },

  remember: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    // The whole label is the hit area, so it clears 44px even though the box
    // itself is 18px.
    minHeight: MIN_TARGET,
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
    cursor: "pointer",
    userSelect: "none",
  },
  checkbox: {
    inlineSize: "1.125rem",
    blockSize: "1.125rem",
    flexShrink: 0,
    margin: 0,
    accentColor: color.surfaceInverse,
    cursor: "pointer",
    outlineColor: color.focusRing,
    outlineOffset: "2px",
    outlineStyle: {
      default: "none",
      ":focus-visible": "solid",
    },
    outlineWidth: "3px",
  },
  rememberHint: {
    fontSize: font.sizeXs,
    color: color.onSurfaceSubtle,
    margin: 0,
  },

  submit: {
    minHeight: MIN_TARGET,
    marginBlockStart: space["2xs"],
    paddingBlock: space.xs,
    paddingInline: space.md,
    borderWidth: 0,
    borderStyle: "none",
    borderRadius: radius.md,
    backgroundColor: {
      default: color.surfaceInverse,
      ":hover": color.surfaceInverseDeep,
    },
    color: color.accentOnInverse,
    fontFamily: font.body,
    fontSize: font.sizeSm,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    outlineColor: color.focusRing,
    outlineOffset: "2px",
    outlineStyle: {
      default: "none",
      ":focus-visible": "solid",
    },
    outlineWidth: "3px",
    transitionProperty: "background-color, opacity",
    transitionDuration: motionToken.base,
  },
  /**
   * Busy state is styled but **not** `disabled`: disabling the control would
   * drop it out of the tab order mid-interaction and move the user's focus
   * somewhere unpredictable (audit §2.9). Re-submission is blocked in the
   * handler instead.
   */
  submitBusy: {
    opacity: 0.72,
    cursor: "progress",
  },

  error: {
    display: "flex",
    gap: space["2xs"],
    margin: 0,
    padding: space.xs,
    borderInlineStartWidth: "3px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: color.danger,
    borderRadius: radius.sm,
    backgroundColor: "rgba(165, 25, 25, 0.08)",
    color: color.danger,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space["2xs"],
    marginBlockStart: space.md,
    paddingBlockStart: space.md,
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.border,
    fontSize: font.sizeSm,
    color: color.onSurfaceSubtle,
  },
  footerLink: {
    color: color.accentOnSurface,
    fontWeight: font.weightBold,
    textDecorationLine: "underline",
    textUnderlineOffset: "3px",
    minHeight: MIN_TARGET,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: radius.sm,
    outlineColor: color.focusRing,
    outlineOffset: "2px",
    outlineStyle: {
      default: "none",
      ":focus-visible": "solid",
    },
    outlineWidth: "3px",
  },
  backLink: {
    color: color.onSurfaceSubtle,
    fontWeight: font.weightSemibold,
    textDecorationLine: "none",
    minHeight: MIN_TARGET,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: radius.sm,
    outlineColor: color.focusRing,
    outlineOffset: "2px",
    outlineStyle: {
      default: "none",
      ":focus-visible": "solid",
    },
    outlineWidth: "3px",
  },
});

export interface SignInCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface SignInMark {
  value: string;
  label: string;
}

export interface SignInPageProps {
  /**
   * Resolves when the attempt is finished. Rejecting is fine — the component
   * catches it and surfaces `genericError`, so a network failure can never
   * leave the form stuck in its busy state.
   */
  onSubmit: (credentials: SignInCredentials) => Promise<void>;
  /** Shown above the fields. Owned by the caller so it survives re-renders. */
  error?: string | null;
  /** Rendered in the brand panel; omit while real photography is pending. */
  photo?: { src: string; srcSet?: string; sizes?: string; alt: string };
  marks?: SignInMark[];
  contactHref?: string;
  homeHref?: string;
}

const DEFAULT_MARKS: SignInMark[] = [
  { value: "1862", label: "FOUNDED" },
  { value: "Galle", label: "SOUTHERN PROVINCE" },
  { value: "Certa Viriliter", label: "STRIVE MANFULLY" },
];

const GENERIC_FAILURE =
  "Those credentials were not recognised. Check them and try again.";

export const SignInPage = ({
  onSubmit,
  error,
  photo,
  marks = DEFAULT_MARKS,
  contactHref = "/contact",
  homeHref = "/",
}: SignInPageProps) => {
  const fieldId = useId();
  const usernameId = `${fieldId}-username`;
  const passwordId = `${fieldId}-password`;
  const errorId = `${fieldId}-error`;
  const rememberId = `${fieldId}-remember`;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const message = error ?? localError;

  /**
   * Clearing `isSubmitting` on the failure path too is what fixes the
   * stuck-spinner bug in the previous route: a rejected auth call used to leave
   * it true permanently, disabling the button for good with nothing shown.
   *
   * The reset is a trailing statement rather than a `finally` block because the
   * `catch` swallows the rejection, so control always reaches it - and React
   * Compiler cannot lower a `try` with a finalizer.
   */
  const runSubmit = async () => {
    setLocalError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ username, password, rememberMe });
    } catch {
      setLocalError(GENERIC_FAILURE);
    }
    setIsSubmitting(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Guards double-submit, since the button stays focusable while busy.
    if (isSubmitting) {
      return;
    }
    void runSubmit();
  };

  return (
    <main id="main-content" {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.brand)}>
        <Media fill placeholder="" source={photo} style={styles.brandPhoto} />
        <div aria-hidden="true" {...stylex.props(styles.brandWash)} />
        <div aria-hidden="true" {...stylex.props(styles.bloom)} />

        <a href={homeHref} {...stylex.props(styles.lockup)}>
          <img
            alt=""
            decoding="async"
            height={56}
            src="/logo.png"
            width={56}
            {...stylex.props(styles.crest)}
          />
          <span>
            <span {...stylex.props(styles.wordmark)}>
              ST. ALOYSIUS&rsquo; COLLEGE
            </span>
            <span {...stylex.props(styles.wordmarkSub)}>
              GALLE &bull; SRI LANKA
            </span>
          </span>
        </a>

        <div {...stylex.props(styles.pitch)}>
          <p {...stylex.props(styles.motto)}>CERTA VIRILITER</p>
          <p {...stylex.props(styles.pitchTitle)}>The Aloysian Portal</p>
          <hr {...stylex.props(styles.rule)} />
          <p {...stylex.props(styles.pitchBody)}>
            One sign-in for College staff and the website content management
            system.
          </p>
        </div>

        <ul {...stylex.props(styles.marks)}>
          {marks.map((mark) => (
            <li key={mark.label}>
              <span {...stylex.props(styles.markValue)}>{mark.value}</span>
              <span {...stylex.props(styles.markLabel)}>{mark.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div {...stylex.props(styles.formPane)}>
        <form noValidate onSubmit={handleSubmit} {...stylex.props(styles.form)}>
          <p {...stylex.props(styles.eyebrow)}>STAFF &amp; CMS ACCESS</p>
          <h1 {...stylex.props(styles.title)}>Welcome back</h1>
          <p {...stylex.props(styles.subtitle)}>
            Sign in with your College account to manage classes and website
            content.
          </p>

          {message ? (
            <p
              aria-live="assertive"
              id={errorId}
              role="alert"
              {...stylex.props(styles.error)}
            >
              <span aria-hidden="true">&#9888;</span>
              {message}
            </p>
          ) : null}

          <div {...stylex.props(styles.field)}>
            <label htmlFor={usernameId} {...stylex.props(styles.label)}>
              USERNAME
            </label>
            <input
              aria-describedby={message ? errorId : undefined}
              aria-invalid={message ? true : undefined}
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect="off"
              id={usernameId}
              name="username"
              onChange={(event) => setUsername(event.target.value)}
              required
              spellCheck={false}
              type="text"
              value={username}
              {...stylex.props(
                styles.input,
                Boolean(message) && styles.inputInvalid
              )}
            />
          </div>

          <div {...stylex.props(styles.field)}>
            <span {...stylex.props(styles.labelRow)}>
              <label htmlFor={passwordId} {...stylex.props(styles.label)}>
                PASSWORD
              </label>
              <a href={contactHref} {...stylex.props(styles.forgot)}>
                Forgot?
              </a>
            </span>
            <span {...stylex.props(styles.inputWrap)}>
              <input
                aria-describedby={message ? errorId : undefined}
                aria-invalid={message ? true : undefined}
                autoComplete="current-password"
                id={passwordId}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? "text" : "password"}
                value={password}
                {...stylex.props(
                  styles.input,
                  styles.inputWithAction,
                  Boolean(message) && styles.inputInvalid
                )}
              />
              <button
                aria-controls={passwordId}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
                type="button"
                {...stylex.props(styles.reveal)}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </span>
          </div>

          <label htmlFor={rememberId} {...stylex.props(styles.remember)}>
            <input
              checked={rememberMe}
              id={rememberId}
              name="rememberMe"
              onChange={(event) => setRememberMe(event.target.checked)}
              type="checkbox"
              {...stylex.props(styles.checkbox)}
            />
            Keep me signed in on this device
          </label>

          <button
            aria-busy={isSubmitting}
            type="submit"
            {...stylex.props(styles.submit, isSubmitting && styles.submitBusy)}
          >
            {isSubmitting ? "SIGNING IN…" : "SIGN IN"}
          </button>

          <div {...stylex.props(styles.footer)}>
            <span>
              Need access?{" "}
              <a href={contactHref} {...stylex.props(styles.footerLink)}>
                Ask an administrator
              </a>
            </span>
            <a href={homeHref} {...stylex.props(styles.backLink)}>
              &larr; Back to website
            </a>
          </div>
        </form>
      </div>
    </main>
  );
};
