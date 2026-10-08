import { bp } from "@aloysius/ui/tokens/breakpoints.stylex";
import {
  color,
  font,
  motionToken,
  radius,
  shadow,
  space,
} from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { Toaster } from "sonner";

/**
 * The one place a query failure is announced.
 *
 * `utils/orpc.ts` calls `toast.error` for every failed query with a retry action;
 * until this was mounted those calls went nowhere, so a query that failed while
 * the page showed no error state of its own failed silently.
 *
 * ## Why `unstyled`
 *
 * Sonner ships its own visual design — grey rounded cards, a system font, its own
 * spacing scale. Two problems with leaving it on: it is not this product's
 * design, and its rules are unlayered CSS, which beats every layered StyleX rule
 * in the app (see the note in `index.css`). So it would not merely look foreign,
 * it could not be corrected from the token file.
 *
 * `unstyled` sets `data-styled="false"` on each toast, which switches off exactly
 * those per-toast rules. Positioning, height measurement, swipe and dismissal are
 * inline and stay: what comes back is a bare element with the same hooks
 * (`data-title`, `data-description`, `data-icon`, `data-button`) to dress. Nothing
 * here has to win a specificity contest.
 *
 * ## The retry button is a `CmsButton`
 *
 * Styled from the same tokens as `CmsButton tone="primary"` on purpose: an alert's
 * one action should be the same shape and weight as every other button in the
 * workspace, or the alert reads as a different application.
 *
 * ## Why it is mounted on the server too
 *
 * An empty `Toaster` renders only its live-region list, so it is safe to hand to
 * the server. A *rendered* toast is not: sonner's per-toast component reads
 * `document.hidden` while rendering, so a toast that exists during SSR would throw
 * on a request that has no `document` at all. That is why `utils/orpc.ts` refuses
 * to raise one when `import.meta.env.SSR` — with that guard in place nothing can
 * populate the store before hydration, and this component stays renderable on both
 * sides.
 */

const styles = stylex.create({
  toast: {
    display: "flex",
    alignItems: "flex-start",
    gap: space["2xs"],
    // The toaster's own width is set inline by sonner; this is the width of the
    // card itself, and the clamp keeps it clear of a phone's screen edges.
    width: {
      default: "min(22rem, calc(100vw - 2rem))",
      [bp.sm]: "22rem",
    },
    padding: space.xs,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: color.surfaceRaised,
    color: color.onSurface,
    // Offset with a soft blur rather than a flat drop, and never a hard
    // `4px 4px 0` block: the card has to read as floating over the page.
    boxShadow: shadow.lg,
    fontFamily: font.body,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    textAlign: "start",
    listStyle: "none",
  },
  // Same border and ink as `Notice tone="danger"`, so a failed query looks like
  // the inline alerts rather than like a fourth kind of message.
  toastError: {
    borderColor: "rgba(165, 25, 25, 0.4)",
    color: color.danger,
  },
  icon: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1.15rem",
    height: "1.15rem",
    // Nudged down so the icon's optical centre sits on the first line of text
    // instead of floating above it.
    marginBlockStart: "0.12rem",
  },
  content: {
    flex: 1,
    display: "grid",
    gap: space["3xs"],
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    textWrap: "pretty",
  },
  description: {
    margin: 0,
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  // `CmsButton tone="primary"`, cut down to what a toast needs.
  action: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    alignSelf: "center",
    minHeight: "2.75rem",
    paddingBlock: space["2xs"],
    paddingInline: space.md,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: radius.md,
    backgroundColor: {
      default: color.accent,
      ":hover": color.accentHover,
    },
    color: color.onAccent,
    fontFamily: font.body,
    fontSize: font.sizeXs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    textDecoration: "none",
    cursor: "pointer",
    transitionProperty: "background-color",
    transitionDuration: motionToken.fast,
  },
});

const className = (style: stylex.StyleXStyles) => stylex.props(style).className;

export const AppToaster = () => (
  <Toaster
    // `space.md` from the edge, as a token value rather than a number sonner
    // would translate into its own scale.
    offset="1.5rem"
    position="bottom-right"
    toastOptions={{
      classNames: {
        actionButton: className(styles.action),
        content: className(styles.content),
        description: className(styles.description),
        error: className(styles.toastError),
        icon: className(styles.icon),
        title: className(styles.title),
        toast: className(styles.toast),
      },
      duration: 7000,
      // Per-element class names live under `toastOptions` in sonner 2; the
      // `Toaster` itself only takes a class for its container.
      //
      // `unstyled` is here rather than on the `Toaster` because that is where
      // sonner 2 both accepts it and types it — the runtime reads the same value
      // from either place, and only this one survives `tsc`.
      unstyled: true,
    }}
    visibleToasts={3}
    // The same icon vocabulary as `Notice`, so an error is recognisable from the
    // corner of the eye whichever surface it arrives on.
    icons={{
      error: <XCircle aria-hidden="true" height={18} width={18} />,
      info: <Info aria-hidden="true" height={18} width={18} />,
      success: <CheckCircle2 aria-hidden="true" height={18} width={18} />,
    }}
  />
);
