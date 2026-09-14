import * as stylex from "@stylexjs/stylex";

/**
 * Brand palette. These are the only colours in the system - every semantic token
 * below resolves to one of them (or an alpha variant of one).
 */
export const palette = stylex.defineConsts({
  greenDeep: "#013405",
  greenDark: "#062b0a",
  black: "#000000",
  cream: "#fff8e7",
  creamRaised: "#fffdf6",
  gold: "#ffb203",
  goldLight: "#ffd45a",
  crimson: "#a51919",
  crimsonBright: "#e05252",
});

/**
 * Semantic colour tokens.
 *
 * The site is **light-only**: there is no dark theme and no user-facing theme
 * switch. `inverse` here does not mean "dark mode" - it means the deep-green
 * sections that alternate with the cream ones down the page, which are part of
 * the brand in every theme.
 *
 * Naming: `surface*` = backgrounds, `on*` = foregrounds guaranteed to meet WCAG
 * 2.2 AA against the matching surface.
 */
export const color = stylex.defineVars({
  surface: palette.cream,
  surfaceRaised: palette.creamRaised,
  surfaceSunken: "#f7efd9",
  surfaceInverse: palette.greenDeep,
  surfaceInverseDeep: palette.greenDark,
  surfaceOverlay: "rgba(1, 52, 5, 0.55)",

  onSurface: palette.greenDeep,
  /** 4.9:1 on `surface`. */
  onSurfaceMuted: "rgba(1, 52, 5, 0.78)",
  /** The lightest text permitted - still clears 4.5:1. */
  onSurfaceSubtle: "rgba(1, 52, 5, 0.68)",
  /** Foregrounds for the deep-green sections. */
  onInverse: palette.cream,
  onInverseMuted: "rgba(255, 248, 231, 0.82)",
  onInverseSubtle: "rgba(255, 248, 231, 0.7)",

  /**
   * Gold is a *fill* colour, not a text colour on cream - gold on cream is
   * ~1.9:1. `accentOnSurface` is crimson (7.4:1 on cream) for eyebrow/label
   * text in the cream sections; `accentOnInverse` is gold (8.6:1 on deep green).
   */
  accent: palette.gold,
  accentHover: palette.goldLight,
  onAccent: palette.greenDeep,
  accentOnSurface: palette.crimson,
  accentOnInverse: palette.gold,

  danger: palette.crimson,
  dangerBright: palette.crimsonBright,

  border: "rgba(1, 52, 5, 0.14)",
  borderStrong: "rgba(1, 52, 5, 0.32)",
  borderInverse: "rgba(255, 248, 231, 0.22)",
  borderAccent: "rgba(255, 178, 3, 0.45)",

  /** Focus ring - must stay visible on cream, deep green and gold alike. */
  focusRing: palette.crimson,
  focusRingInverse: palette.goldLight,

  /** Neutral placeholder shown while real photography is pending. */
  placeholder: "rgba(1, 52, 5, 0.06)",
  placeholderInk: "rgba(1, 52, 5, 0.45)",
});

/**
 * Fluid type scale. Every step is `clamp(min, preferred, max)` where the
 * preferred term is `rem + vw` so type scales continuously from 320px to 1920px
 * and then stops - no runaway headings on 8K displays.
 */
export const font = stylex.defineVars({
  body: '"Manrope Variable", "Manrope", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  display:
    '"Cormorant Garamond Variable", "Cormorant Garamond", ui-serif, Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',

  /** 11px -> 12px. Eyebrows, overlines. */
  size2xs: "clamp(0.6875rem, 0.66rem + 0.14vw, 0.75rem)",
  /** 12px -> 13px. Meta, captions. */
  sizeXs: "clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem)",
  /** 13px -> 14px. Dense UI text. */
  sizeSm: "clamp(0.8125rem, 0.78rem + 0.16vw, 0.875rem)",
  /** 15px -> 16.5px. Body copy. */
  sizeMd: "clamp(0.9375rem, 0.9rem + 0.19vw, 1.03125rem)",
  /** 16px -> 18px. Lead paragraphs, card titles. */
  sizeLg: "clamp(1rem, 0.95rem + 0.25vw, 1.125rem)",
  /** 20px -> 27px. Sub-headings. */
  sizeXl: "clamp(1.25rem, 1.1rem + 0.75vw, 1.6875rem)",
  /** 24px -> 34px. Pull quotes. */
  size2xl: "clamp(1.5rem, 1.28rem + 1.1vw, 2.125rem)",
  /** 30px -> 56px. Section headings. */
  size3xl: "clamp(1.875rem, 1.35rem + 2.6vw, 3.5rem)",
  /** 40px -> 96px. Hero. */
  size4xl: "clamp(2.5rem, 1.3rem + 6vw, 6rem)",

  weightRegular: "400",
  weightMedium: "500",
  weightSemibold: "600",
  weightBold: "700",
  weightExtrabold: "800",

  leadingTight: "1.05",
  leadingSnug: "1.2",
  leadingNormal: "1.45",
  leadingRelaxed: "1.75",

  trackingTight: "-0.01em",
  trackingNormal: "0",
  trackingWide: "0.06em",
  trackingWider: "0.14em",
  trackingWidest: "0.28em",
  trackingUltra: "0.42em",
});

/**
 * Spacing scale. The larger steps are fluid so section rhythm compresses on
 * phones and opens up on desktop without a breakpoint for each.
 */
export const space = stylex.defineVars({
  px: "1px",
  "3xs": "0.25rem",
  "2xs": "0.5rem",
  xs: "0.75rem",
  sm: "1rem",
  md: "1.5rem",
  lg: "2rem",
  xl: "clamp(2rem, 1.5rem + 2.5vw, 3.5rem)",
  "2xl": "clamp(2.75rem, 1.9rem + 4.2vw, 5rem)",
  "3xl": "clamp(3.5rem, 2.2rem + 6.5vw, 7.5rem)",

  /** Horizontal page gutter: 20px on a 320px phone, 64px on desktop. */
  gutter: "clamp(1.25rem, 0.9rem + 1.75vw, 4rem)",
  /** Vertical rhythm between major sections. */
  section: "clamp(3.5rem, 2rem + 7.5vw, 7.5rem)",
  /** Main content column. Grows past the mock's 1180px cap on very large screens. */
  content: "min(100% - 2 * clamp(1.25rem, 0.9rem + 1.75vw, 4rem), 76rem)",
  contentWide: "min(100% - 2 * clamp(1.25rem, 0.9rem + 1.75vw, 4rem), 104rem)",
  /** Readable measure for long-form copy. */
  measure: "60ch",
});

export const radius = stylex.defineVars({
  none: "0",
  sm: "2px",
  md: "4px",
  lg: "8px",
  pill: "999px",
  circle: "50%",
});

export const shadow = stylex.defineVars({
  none: "none",
  sm: "0 1px 2px rgba(1, 52, 5, 0.08)",
  md: "0 4px 16px rgba(1, 52, 5, 0.1)",
  lg: "0 12px 40px rgba(1, 52, 5, 0.16)",
  header: "0 1px 0 rgba(255, 178, 3, 0.25)",
  headerScrolled: "0 8px 28px rgba(0, 0, 0, 0.28)",
  /** Focus ring drawn as a shadow where an outline would be clipped. */
  focus: "0 0 0 3px rgba(165, 25, 25, 0.45)",
});

export const motionToken = stylex.defineVars({
  fast: "140ms",
  base: "220ms",
  slow: "420ms",
  /** Standard easing - decelerate. */
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
});

export const layer = stylex.defineVars({
  base: "0",
  raised: "1",
  sticky: "40",
  header: "50",
  drawer: "60",
  modal: "70",
  toast: "80",
  skipLink: "90",
});
