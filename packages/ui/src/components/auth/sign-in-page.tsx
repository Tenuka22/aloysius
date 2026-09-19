import * as stylex from "@stylexjs/stylex";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useId, useState } from "react";
import type { FormEvent } from "react";

import { bp } from "../../tokens/breakpoints.stylex";
import {
  color,
  font,
  motionToken,
  palette,
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

/** Soft gold focus halo. Alpha gold, so it reads on cream without shouting. */
const INPUT_HALO = "rgba(255, 178, 3, 0.32)";

/*
 * Vertical rhythm for the sign-in screen, expressed in `vh` so it compresses
 * continuously with viewport height. This screen has a hard requirement the
 * rest of the site does not: it must fit on one screen without scrolling, and
 * a 1366x768 laptop leaves only ~660px of viewport once browser chrome is
 * taken. Stepping at a single `max-height` breakpoint left a cliff either side
 * of it; fluid values also mean no two media queries can fight over the same
 * property, which is the StyleX ordering hazard in frontend-audit 6.4.
 */
const PANE_PAD = "clamp(0.75rem, 2.5vh, 2rem)";
const BRAND_GAP = "clamp(1.5rem, 4vh, 3.5rem)";
const CARD_PAD = "clamp(1rem, 3vh, 2rem)";
const CARD_GAP = "clamp(0.5rem, 1.4vh, 0.75rem)";

/**
 * Gold tick for the remember-me checkbox, inlined as a data URI so the control
 * needs no pseudo-element and no extra network request. `#` must stay
 * percent-encoded or the URL terminates at the colour.
 */
const CHECK_MARK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23ffb203' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 8.5l3.5 3.5L13 5'/%3E%3C/svg%3E";

const ambient = stylex.keyframes({
  "0%, 100%": { opacity: 0.18, transform: "scale(1)" },
  "50%": { opacity: 0.42, transform: "scale(1.08)" },
});

const spin = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
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
    // Fluid in `vh` for the same reason as the card: this column shares the
    // grid row height, so if its content outgrows the viewport it forces the
    // whole page to scroll - including the form beside it.
    gap: BRAND_GAP,
    overflow: "hidden",
    isolation: "isolate",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    paddingInline: space.gutter,
    paddingBlock: BRAND_GAP,
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
    /*
     * Only in the two-column layout. Below `xl` the brand panel is stacked
     * above the card, so anything shown here is pure height pushed onto the
     * page - it was adding ~480px and forcing a scroll on any window narrower
     * than 1024px. In the split layout it fills a column that exists anyway.
     */
    display: {
      default: "none",
      [bp.xl]: "block",
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
    /*
     * Two-column layout only, same reasoning as `pitch`. Deliberately a single
     * rule rather than also switching on `shortViewport`: a min-width and a
     * max-height query both match a 1366x768 screen, and StyleX orders
     * overlapping rules for one property by emission, not specificity
     * (frontend-audit 6.4). The brand column is height-constrained and
     * space-between, so these cost the page nothing anyway.
     */
    display: {
      default: "none",
      [bp.xl]: "flex",
    },
    flexWrap: "wrap",
    // `xl` here was ~50px, which wrapped the three marks onto three rows in a
    // 512px column and added ~100px of height to the whole page.
    gap: space.md,
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

  /**
   * The pane's own padding was 80px top and bottom on a desktop - 160px of the
   * viewport spent before the card is drawn. It is now sized so the whole
   * screen fits a 768px-tall laptop without the page scrolling.
   */
  formPane: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingInline: space.gutter,
    // Fluid in `vh`, so the rhythm compresses continuously with viewport
    // height instead of stepping at one breakpoint - and so two overlapping
    // media queries can never both claim this property.
    paddingBlock: PANE_PAD,
    paddingInlineEnd: `max(${space.gutter}, env(safe-area-inset-right))`,
    paddingBlockEnd: `max(${PANE_PAD}, env(safe-area-inset-bottom))`,
  },
  /**
   * The form is a raised card, not bare text on the pane. On a phone it keeps
   * the border and radius but loses most of the padding, so the controls stay
   * on the page gutter rather than being inset twice.
   */
  card: {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    inlineSize: "100%",
    // Caps the measure so the form never stretches on a 4K panel, while the
    // pane around it keeps centring.
    maxInlineSize: "27.5rem",
    display: "flex",
    flexDirection: "column",
    gap: CARD_GAP,
    paddingBlock: CARD_PAD,
    paddingInline: {
      default: space.md,
      [bp.sm]: space.lg,
    },
    backgroundColor: color.surfaceRaised,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: "0.75rem",
    // Two shadows: a tight contact shadow plus a wide ambient one. A single
    // blur reads flat; the pair is what makes the card sit above the pane.
    boxShadow:
      "0 1px 2px rgba(1, 52, 5, 0.06), 0 18px 48px -12px rgba(1, 52, 5, 0.22)",
  },
  /** Gold hairline along the card's top edge - the brand's signature rule. */
  cardEdge: {
    position: "absolute",
    insetBlockStart: 0,
    insetInline: 0,
    blockSize: "3px",
    backgroundImage: `linear-gradient(90deg, ${palette.gold} 0%, ${palette.goldLight} 45%, rgba(255,178,3,0) 100%)`,
    pointerEvents: "none",
  },
  cardHead: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
  },
  crestBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    inlineSize: "2rem",
    blockSize: "2rem",
    flexShrink: 0,
    borderRadius: radius.md,
    backgroundColor: color.surfaceInverse,
    color: color.accentOnInverse,
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
    // Steps down on a laptop-height viewport: the display size is what makes
    // the card overflow a 768px screen, and it is the cheapest thing to trade.
    fontSize: {
      default: font.size3xl,
      [bp.shortViewport]: font.size2xl,
    },
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    margin: `${space["2xs"]} 0 0`,
  },
  subtitle: {
    fontSize: font.sizeMd,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceSubtle,
    margin: {
      default: `${space["2xs"]} 0 ${space.xs}`,
      [bp.shortViewport]: `${space["3xs"]} 0 ${space["2xs"]}`,
    },
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
  },
  /**
   * The gold rule before the label is the same device the brand panel uses
   * under "The Aloysian Portal". Repeating it here is what ties the form to
   * the masthead instead of leaving it looking like a generic auth widget.
   */
  label: {
    display: "inline-flex",
    alignItems: "center",
    gap: space["2xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    color: color.onSurface,
    "::before": {
      content: "''",
      inlineSize: "1.25rem",
      blockSize: "2px",
      backgroundColor: color.accent,
    },
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
  /**
   * Decorative only - the visible `<label>` names the field. `pointer-events:
   * none` so clicking the icon still focuses the input underneath it.
   */
  fieldIcon: {
    position: "absolute",
    insetInlineStart: space.sm,
    insetBlockStart: "50%",
    transform: "translateY(-50%)",
    color: color.onSurfaceSubtle,
    pointerEvents: "none",
    zIndex: 1,
  },
  inputWithIcon: {
    paddingInlineStart: "2.875rem",
  },
  input: {
    inlineSize: "100%",
    // Taller than the 44px floor: generous field height is most of what
    // separates a considered form from a default one.
    minHeight: "3.25rem",
    paddingBlock: space.xs,
    paddingInline: space.sm,
    // 16px minimum: anything smaller triggers iOS Safari's auto-zoom on focus,
    // which then leaves the page zoomed after blur.
    fontSize: `max(1rem, ${font.sizeMd})`,
    fontFamily: font.body,
    color: color.onSurface,
    backgroundColor: {
      default: color.surfaceRaised,
      ":hover": palette.creamRaised,
      ":focus": "#ffffff",
    },
    borderWidth: space.px,
    borderStyle: "solid",
    // `borderStrong` is 3.4:1 on cream - a visible field boundary, unlike the
    // stub's #ccc.
    borderColor: {
      default: color.borderStrong,
      ":hover": "rgba(1, 52, 5, 0.45)",
      ":focus": color.onSurface,
    },
    borderRadius: radius.md,
    /*
     * Focus is carried by a soft gold halo rather than only a border colour
     * change. `:focus` (not `:focus-visible`) on purpose - a pointer user
     * clicking into a text field should get the same affordance as a keyboard
     * user, and the outline below still fires for keyboard only.
     */
    boxShadow: {
      default: "inset 0 1px 2px rgba(1, 52, 5, 0.06)",
      ":focus": `inset 0 1px 2px rgba(1, 52, 5, 0), 0 0 0 4px ${INPUT_HALO}`,
    },
    /*
     * Deep green, not the global crimson ring. Per spec a text input always
     * matches `:focus-visible` when focused, whatever the input modality, so
     * this ring is what every user sees on every focus - crimson fought both
     * the gold halo and the green border the field already adopts. Green is
     * ~13:1 on cream, so SC 2.4.11 is met by the ring alone; the halo is
     * decoration on top of it.
     */
    outlineColor: color.onSurface,
    outlineOffset: "1px",
    outlineStyle: {
      default: "none",
      ":focus-visible": "solid",
    },
    outlineWidth: "2px",
    transitionProperty: "border-color, background-color, box-shadow",
    transitionDuration: motionToken.fast,
    transitionTimingFunction: motionToken.ease,
    // Placeholders are a hint, never the label - every field here has a real
    // one - so they sit well below body contrast on purpose.
    "::placeholder": {
      color: "rgba(1, 52, 5, 0.38)",
    },
  },
  inputInvalid: {
    borderColor: color.danger,
    boxShadow: {
      default: "inset 0 1px 2px rgba(165, 25, 25, 0.08)",
      ":focus": "0 0 0 4px rgba(165, 25, 25, 0.18)",
    },
  },
  /**
   * Reserves room for the reveal button using a logical inline-end pad that is
   * sized from the control itself, so a longer translation of "Show"/"Hide"
   * cannot overlap the value (mock §5.10).
   */
  inputWithAction: {
    // Clears the 2.75rem icon button plus its inset, with room to spare. Sized
    // from the control rather than from the old "SHOW"/"HIDE" string, so a
    // translation can no longer overlap the value (mock §5.10).
    paddingInlineEnd: "3.75rem",
  },
  reveal: {
    position: "absolute",
    insetInlineEnd: space["3xs"],
    insetBlockStart: "50%",
    transform: "translateY(-50%)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    // Square icon button, kept on the 44px grid: the 3.25rem field is tall
    // enough to contain it with 4px to spare, so the icon-only control does
    // not become the one sub-target on the page.
    minHeight: MIN_TARGET,
    inlineSize: MIN_TARGET,
    paddingInline: 0,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: "transparent",
      ":hover": color.border,
    },
    borderRadius: radius.md,
    // Transparent, so the pill reads as an outline on the field rather than a
    // grey chip sitting on top of it.
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(165, 25, 25, 0.06)",
    },
    fontFamily: font.body,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    color: {
      default: color.onSurfaceSubtle,
      ":hover": color.accentOnSurface,
    },
    transitionProperty: "color, background-color, border-color",
    transitionDuration: motionToken.fast,
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
  /**
   * Custom-drawn, but still a real `<input type="checkbox">`: `appearance:
   * none` restyles the native control rather than hiding it behind a fake one,
   * so it keeps its role, its checked state, its label association and its
   * place in the tab order for free.
   */
  checkbox: {
    appearance: "none",
    WebkitAppearance: "none",
    display: "grid",
    placeContent: "center",
    inlineSize: "1.25rem",
    blockSize: "1.25rem",
    flexShrink: 0,
    margin: 0,
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: {
      default: color.borderStrong,
      ":checked": color.surfaceInverse,
    },
    borderRadius: radius.sm,
    backgroundColor: {
      default: color.surfaceRaised,
      ":checked": color.surfaceInverse,
    },
    // Gold tick on the deep-green fill, drawn as a background so no
    // pseudo-element is needed on a replaced element.
    backgroundImage: {
      default: "none",
      ":checked": `url("${CHECK_MARK}")`,
    },
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "0.8rem 0.8rem",
    cursor: "pointer",
    transitionProperty: "background-color, border-color",
    transitionDuration: motionToken.fast,
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
    position: "relative",
    overflow: "hidden",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space["2xs"],
    minHeight: "3.25rem",
    marginBlockStart: space.xs,
    paddingBlock: space.xs,
    paddingInline: space.md,
    borderWidth: 0,
    borderStyle: "none",
    borderRadius: radius.md,
    // A shallow vertical gradient plus a hairline top highlight: the button
    // reads as a solid object with a light source rather than a flat swatch.
    backgroundImage: {
      default: `linear-gradient(180deg, ${palette.greenDeep} 0%, ${palette.greenDark} 100%)`,
      ":hover": `linear-gradient(180deg, ${palette.greenDark} 0%, ${palette.black} 100%)`,
    },
    backgroundColor: color.surfaceInverse,
    boxShadow: {
      default:
        "inset 0 1px 0 rgba(255, 178, 3, 0.28), 0 2px 10px rgba(1, 52, 5, 0.22)",
      ":hover":
        "inset 0 1px 0 rgba(255, 178, 3, 0.5), 0 8px 22px rgba(1, 52, 5, 0.3)",
      ":active": "inset 0 1px 3px rgba(0, 0, 0, 0.4)",
    },
    color: color.accentOnInverse,
    fontFamily: font.body,
    fontSize: font.sizeSm,
    fontWeight: font.weightExtrabold,
    // Wider tracking than the rest of the UI - this is the one display-weight
    // control on the page.
    letterSpacing: font.trackingWider,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    // Lift only where a real pointer exists; on touch a :hover transform
    // sticks after the tap until the user taps elsewhere.
    transform: {
      default: "translateY(0)",
      [bp.hover]: {
        default: "translateY(0)",
        ":hover": "translateY(-1px)",
        ":active": "translateY(0)",
      },
    },
    outlineColor: color.focusRing,
    outlineOffset: "2px",
    outlineStyle: {
      default: "none",
      ":focus-visible": "solid",
    },
    outlineWidth: "3px",
    transitionProperty: "background-image, box-shadow, transform, opacity",
    transitionDuration: motionToken.base,
    transitionTimingFunction: motionToken.ease,
  },
  submitArrow: {
    transitionProperty: "transform",
    transitionDuration: motionToken.base,
    transitionTimingFunction: motionToken.ease,
  },
  /**
   * Diagonal gold sheen that sweeps across on hover. Transform-only, so it
   * composites on the GPU, and it is skipped entirely on coarse pointers and
   * under reduced motion.
   */
  submitSheen: {
    position: "absolute",
    insetBlock: 0,
    inlineSize: "40%",
    insetInlineStart: 0,
    backgroundImage:
      "linear-gradient(100deg, transparent, rgba(255,178,3,0.18), transparent)",
    pointerEvents: "none",
    transform: {
      default: "translateX(-150%)",
      [bp.hover]: {
        default: "translateX(-150%)",
        ":hover": "translateX(350%)",
      },
      [bp.reducedMotion]: "translateX(-150%)",
    },
    transitionProperty: "transform",
    transitionDuration: "900ms",
    transitionTimingFunction: motionToken.ease,
  },
  /**
   * The only element on the page that keeps moving under reduced motion would
   * be this spinner, so it stops and the label alone carries the busy state.
   */
  spinner: {
    animationName: {
      default: spin,
      [bp.reducedMotion]: "none",
    },
    animationDuration: "900ms",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
  errorIcon: {
    flexShrink: 0,
    marginBlockStart: "0.1rem",
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
    // The form's own `gap` already contributes above this rule; adding a full
    // `md` on top of it left the footer adrift from the button.
    marginBlockStart: space["3xs"],
    // Last fixed vertical value in the card; fluid so a 600px-tall window
    // clears too, which was the final 9px of overflow.
    paddingBlockStart: "clamp(0.75rem, 2vh, 1.5rem)",
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
    color: {
      default: color.onSurfaceSubtle,
      ":hover": color.onSurface,
    },
    fontWeight: font.weightSemibold,
    textDecorationLine: "none",
    minHeight: MIN_TARGET,
    display: "inline-flex",
    alignItems: "center",
    gap: space["3xs"],
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
        <form noValidate onSubmit={handleSubmit} {...stylex.props(styles.card)}>
          <span aria-hidden="true" {...stylex.props(styles.cardEdge)} />

          <div {...stylex.props(styles.cardHead)}>
            <span aria-hidden="true" {...stylex.props(styles.crestBadge)}>
              <ShieldCheck size={18} strokeWidth={2} />
            </span>
            <p {...stylex.props(styles.eyebrow)}>STAFF &amp; CMS ACCESS</p>
          </div>

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
              <AlertCircle
                aria-hidden="true"
                size={18}
                strokeWidth={2}
                {...stylex.props(styles.errorIcon)}
              />
              {message}
            </p>
          ) : null}

          <div {...stylex.props(styles.field)}>
            <label htmlFor={usernameId} {...stylex.props(styles.label)}>
              USERNAME
            </label>
            <span {...stylex.props(styles.inputWrap)}>
              <UserRound
                aria-hidden="true"
                size={18}
                strokeWidth={1.75}
                {...stylex.props(styles.fieldIcon)}
              />
              <input
                aria-describedby={message ? errorId : undefined}
                aria-invalid={message ? true : undefined}
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect="off"
                id={usernameId}
                name="username"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="your.username"
                required
                spellCheck={false}
                type="text"
                value={username}
                {...stylex.props(
                  styles.input,
                  styles.inputWithIcon,
                  Boolean(message) && styles.inputInvalid
                )}
              />
            </span>
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
              <Lock
                aria-hidden="true"
                size={18}
                strokeWidth={1.75}
                {...stylex.props(styles.fieldIcon)}
              />
              <input
                aria-describedby={message ? errorId : undefined}
                aria-invalid={message ? true : undefined}
                autoComplete="current-password"
                id={passwordId}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                type={showPassword ? "text" : "password"}
                value={password}
                {...stylex.props(
                  styles.input,
                  styles.inputWithIcon,
                  styles.inputWithAction,
                  Boolean(message) && styles.inputInvalid
                )}
              />
              {/*
                The icon alone is not an accessible name, so the label is
                explicit and states the action rather than the current state -
                `aria-pressed` carries the state.
              */}
              <button
                aria-controls={passwordId}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
                type="button"
                {...stylex.props(styles.reveal)}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.75} />
                ) : (
                  <Eye size={18} strokeWidth={1.75} />
                )}
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
            <span aria-hidden="true" {...stylex.props(styles.submitSheen)} />
            {isSubmitting ? (
              <>
                <Loader2
                  aria-hidden="true"
                  size={18}
                  strokeWidth={2.25}
                  {...stylex.props(styles.spinner)}
                />
                SIGNING IN…
              </>
            ) : (
              <>
                SIGN IN
                <ArrowRight
                  aria-hidden="true"
                  size={18}
                  strokeWidth={2.25}
                  {...stylex.props(styles.submitArrow)}
                />
              </>
            )}
          </button>

          <div {...stylex.props(styles.footer)}>
            <span>
              Need access?{" "}
              <a href={contactHref} {...stylex.props(styles.footerLink)}>
                Ask an administrator
              </a>
            </span>
            <a href={homeHref} {...stylex.props(styles.backLink)}>
              <ArrowLeft aria-hidden="true" size={15} strokeWidth={2} />
              Back to website
            </a>
          </div>
        </form>
      </div>
    </main>
  );
};
