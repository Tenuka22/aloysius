import * as stylex from "@stylexjs/stylex";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { EntryStatus } from "../../content/cms";
import { STATUS_LABEL } from "../../content/cms";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";

const highlightPulse = stylex.keyframes({
  "0%": { backgroundColor: "rgba(255, 178, 3, 0.25)" },
  "100%": { backgroundColor: "transparent" },
});

/**
 * Shared building blocks for the admin screens.
 *
 * The public site and the CMS draw from the same token file, so the admin can
 * never drift from the brand. What differs is density: the site is generous,
 * the CMS is compact, because an editor is reading a form rather than a page.
 */

const MIN_TARGET = "2.75rem";

const styles = stylex.create({
  panel: {
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    padding: {
      default: space.md,
      [bp.lg]: space.lg,
    },
    // Panels sit in grids; without this a long unbroken string (an email, a
    // URL) sets the track width and pushes the layout wider than the viewport.
    minWidth: 0,
  },
  panelAccent: {
    borderBlockStartWidth: "2px",
    borderBlockStartColor: color.accent,
  },
  panelInverse: {
    backgroundColor: color.surfaceInverse,
    borderColor: "transparent",
    color: color.onInverse,
  },

  /*
   * `flex-start`, not `baseline`.
   *
   * Baseline alignment across two flex items aligns the *last* line of one with
   * the last line of the other, so a 2.75rem-tall action button dragged the
   * whole heading block down until the panel's note sat 90px below the title —
   * a band of dead space that read as a rendering fault. Top-aligned, the action
   * lines up with the eyebrow, which is what a corner action is for.
   */
  panelHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.xs,
    marginBlockEnd: space.md,
  },
  panelEyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  panelEyebrowInverse: {
    color: color.accentOnInverse,
  },
  panelTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    textWrap: "balance",
  },
  panelNote: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  panelNoteInverse: {
    color: color.onInverseMuted,
  },

  /* ------------------------------------------------------------- badges */
  badge: {
    display: "inline-flex",
    alignItems: "center",
    // `fit-content` + `nowrap`: a status badge that wraps mid-word reads as
    // broken, and these strings are short enough to never need two lines.
    width: "fit-content",
    whiteSpace: "nowrap",
    paddingBlock: space["3xs"],
    paddingInline: space["2xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
  },
  badgePublished: {
    backgroundColor: "rgba(1, 52, 5, 0.12)",
    color: color.onSurface,
  },
  badgeDraft: {
    backgroundColor: "rgba(255, 178, 3, 0.24)",
    // Not gold-on-cream (1.9:1). A darkened gold clears 4.5:1 and still reads
    // as the same status colour.
    color: "#7a5400",
  },
  badgeScheduled: {
    backgroundColor: "rgba(47, 74, 133, 0.16)",
    color: "#2f4a85",
  },
  badgeAuto: {
    backgroundColor: "rgba(47, 74, 133, 0.16)",
    color: "#2f4a85",
  },
  badgeGlobal: {
    backgroundColor: "rgba(1, 52, 5, 0.07)",
    color: color.onSurfaceSubtle,
  },

  /* ------------------------------------------------------------- pills */
  /*
   * A state chip for a *thing* (an account, a submission) rather than a CMS
   * entry status. The leading dot is decorative: it is the fastest scan of a
   * column of rows, because a column of words forces a read and a column of
   * dots only forces a look.
   */
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: space["3xs"],
    width: "fit-content",
    whiteSpace: "nowrap",
    paddingBlock: space["3xs"],
    paddingInline: space["2xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
  },
  pillDot: {
    flexShrink: 0,
    width: "0.4rem",
    height: "0.4rem",
    borderRadius: "50%",
    backgroundColor: "currentColor",
  },
  pillNeutral: {
    backgroundColor: "rgba(1, 52, 5, 0.07)",
    color: color.onSurfaceSubtle,
  },
  pillPositive: {
    backgroundColor: "rgba(1, 52, 5, 0.12)",
    color: color.onSurface,
  },
  pillWarning: {
    backgroundColor: "rgba(255, 178, 3, 0.24)",
    // Not gold-on-cream (1.9:1). A darkened gold clears 4.5:1 and still reads
    // as the same status colour.
    color: "#7a5400",
  },
  pillDanger: {
    backgroundColor: "rgba(165, 25, 25, 0.12)",
    color: color.danger,
  },

  /* ----------------------------------------------------------- notices */
  /*
   * The one place a screen speaks. A notice is a full-width, self-contained
   * statement inside a panel - a result the operator has to acknowledge, or a
   * problem they have to clear. Because it is a bordered surface and not a
   * tinted `<p>`, it cannot be confused with the helper text under a field.
   */
  notice: {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    alignItems: "start",
    gap: space["2xs"],
    paddingBlock: space.xs,
    paddingInline: space.xs,
    borderWidth: space.px,
    borderStyle: "solid",
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    textWrap: "pretty",
  },
  noticeIcon: {
    flexShrink: 0,
    width: "1.05rem",
    height: "1.05rem",
    // Nudged down so the icon's optical centre sits on the first line of text
    // rather than floating above it.
    marginBlockStart: "0.16rem",
  },
  noticeInfo: {
    backgroundColor: "rgba(1, 52, 5, 0.05)",
    borderColor: color.border,
    color: color.onSurface,
  },
  noticeSuccess: {
    backgroundColor: "rgba(1, 52, 5, 0.08)",
    borderColor: color.borderStrong,
    color: color.onSurface,
  },
  noticeWarning: {
    backgroundColor: "rgba(255, 178, 3, 0.18)",
    borderColor: "rgba(122, 84, 0, 0.35)",
    color: "#7a5400",
  },
  noticeDanger: {
    backgroundColor: "rgba(165, 25, 25, 0.08)",
    borderColor: "rgba(165, 25, 25, 0.4)",
    color: color.danger,
  },

  /* -------------------------------------------------------- empty state */
  emptyState: {
    display: "grid",
    justifyItems: "start",
    gap: space["3xs"],
    paddingBlock: space.md,
    // Never a full panel wide: an empty state is a sentence, and a sentence
    // stretched across a 1500px panel is one very long line.
    maxWidth: "38rem",
  },
  emptyTitle: {
    margin: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
  },
  emptyNote: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },

  /* ------------------------------------------------------- record list */
  recordList: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  recordRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: {
      default: space["2xs"],
      [bp.md]: space.sm,
    },
    minWidth: 0,
    paddingBlock: space.sm,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  recordMain: {
    // `16rem` basis: the record keeps its own text and its actions on one line
    // until the record would be narrower than that, then the actions drop below.
    flex: "1 1 16rem",
    minWidth: 0,
  },
  recordActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    marginInlineStart: {
      default: 0,
      [bp.md]: "auto",
    },
  },
  recordTitle: {
    margin: 0,
    minWidth: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    overflowWrap: "break-word",
  },
  recordMeta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: space["3xs"],
    margin: 0,
    marginBlockStart: space["3xs"],
    minWidth: 0,
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },

  /* ------------------------------------------------------------- fields */
  fieldGrid: {
    display: "grid",
    gap: space.md,
    // One column on a phone, two once there is room for a label and a control
    // side by side without either being squeezed.
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.lg]: "repeat(2, minmax(0, 1fr))",
    },
  },
  fieldWide: {
    gridColumn: {
      default: "auto",
      [bp.lg]: "1 / -1",
    },
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
    minWidth: 0,
  },
  fieldRow: {
    display: "flex",
    gap: space["2xs"],
    alignItems: "stretch",
  },
  fieldRowControl: {
    flex: "1 1 0",
    minWidth: 0,
  },
  clearButton: {
    flexShrink: 0,
    width: MIN_TARGET,
    minHeight: MIN_TARGET,
    display: "grid",
    placeItems: "center",
    padding: 0,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.borderStrong,
      ":hover": color.danger,
    },
    backgroundColor: {
      default: color.surfaceSunken,
      ":hover": color.danger,
    },
    color: {
      default: color.onSurfaceMuted,
      ":hover": color.surface,
    },
    fontFamily: font.body,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    cursor: "pointer",
    transitionProperty: "background-color, color, border-color",
    transitionDuration: motionToken.fast,
  },
  label: {
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurface,
  },
  control: {
    width: "100%",
    minHeight: MIN_TARGET,
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.borderStrong,
      ":hover": color.onSurfaceSubtle,
    },
    color: color.onSurface,
    fontFamily: font.body,
    // 16px minimum on the control itself: iOS Safari zooms the whole page in
    // when a focused input's text is smaller than that, which on a phone looks
    // exactly like the layout breaking.
    fontSize: "1rem",
    lineHeight: font.leadingNormal,
    transitionProperty: "border-color, background-color",
    transitionDuration: motionToken.fast,
  },
  controlDirty: {
    backgroundColor: "rgba(255, 178, 3, 0.12)",
    borderColor: color.accent,
  },
  customSelect: {
    position: "relative",
    width: "100%",
  },
  customSelectButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    minHeight: MIN_TARGET,
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.borderStrong,
      ":hover": color.onSurfaceSubtle,
    },
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: "1rem",
    lineHeight: font.leadingNormal,
    textAlign: "start",
    cursor: "pointer",
    transitionProperty: "border-color, background-color",
    transitionDuration: motionToken.fast,
  },
  customSelectButtonOpen: {
    borderColor: color.onSurfaceSubtle,
  },
  customSelectChevron: {
    width: "1rem",
    height: "1rem",
    flexShrink: 0,
    marginInlineStart: space.xs,
    transitionProperty: "transform",
    transitionDuration: motionToken.fast,
  },
  customSelectChevronOpen: {
    transform: "rotate(180deg)",
  },
  customSelectMenu: {
    position: "absolute",
    insetBlockStart: "100%",
    insetInlineStart: 0,
    insetInlineEnd: 0,
    zIndex: 1000,
    marginTop: space.px,
    maxHeight: "15rem",
    overflowY: "auto",
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    boxShadow: "0 8px 28px rgba(0, 0, 0, 0.18)",
  },
  /*
   * Opened upwards, anchored to the trigger's top edge instead of its bottom.
   *
   * A select near the bottom of a scroll container has no room below it, and a
   * menu that cannot fit is a menu whose last options cannot be reached — the
   * scroller simply clips it. Anchoring up is the other half of the answer;
   * `placeMenu` measures and picks, this style is what "up" looks like.
   */
  customSelectMenuAbove: {
    insetBlockStart: "auto",
    insetBlockEnd: "100%",
    marginTop: 0,
    marginBlockStart: space.px,
  },
  customSelectOption: {
    display: "block",
    width: "100%",
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    borderWidth: 0,
    borderStyle: "none",
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(1, 52, 5, 0.08)",
    },
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: "1rem",
    lineHeight: font.leadingNormal,
    textAlign: "start",
    cursor: "pointer",
  },
  customSelectOptionActive: {
    backgroundColor: "rgba(1, 52, 5, 0.12)",
  },
  customSelectOptionSelected: {
    backgroundColor: "rgba(255, 178, 3, 0.18)",
    color: color.onSurface,
    fontWeight: font.weightSemibold,
  },
  textarea: {
    minHeight: "6rem",
    resize: "vertical",
  },
  readonly: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: space["2xs"],
    minHeight: MIN_TARGET,
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    backgroundColor: "rgba(1, 52, 5, 0.05)",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    color: color.onSurfaceMuted,
    fontSize: font.sizeSm,
  },
  hint: {
    margin: 0,
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceSubtle,
    textWrap: "pretty",
  },

  /* ------------------------------------------------------------ switch */
  switchRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.sm,
    paddingBlock: space.xs,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  switchText: {
    // `16rem` basis: the row keeps label and control on one line until the text
    // would be narrower than that, then the control drops below it.
    flex: "1 1 16rem",
    minWidth: 0,
  },
  switchLabel: {
    margin: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    color: color.onSurface,
  },
  switchDesc: {
    margin: 0,
    marginBlockStart: "0.1rem",
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  switchControls: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    marginInlineStart: "auto",
  },
  /*
   * A real <button role="switch">, not a styled <span>. It is reachable by Tab,
   * toggles on Space and Enter, and announces its state - none of which the
   * comp's clickable <span> would have done.
   */
  switchButton: {
    position: "relative",
    flexShrink: 0,
    width: "2.875rem",
    height: MIN_TARGET,
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    cursor: {
      default: "pointer",
      ":disabled": "not-allowed",
    },
    opacity: {
      default: 1,
      ":disabled": 0.45,
    },
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
  },
  switchTrack: {
    position: "absolute",
    insetBlockStart: "50%",
    insetInlineStart: 0,
    width: "2.875rem",
    height: "1.625rem",
    marginBlockStart: "-0.8125rem",
    borderRadius: "999px",
    transitionProperty: "background-color",
    transitionDuration: motionToken.fast,
  },
  switchTrackOn: { backgroundColor: color.surfaceInverse },
  switchTrackOff: { backgroundColor: "rgba(1, 52, 5, 0.25)" },
  switchKnob: {
    position: "absolute",
    insetBlockStart: "0.1875rem",
    width: "1.25rem",
    height: "1.25rem",
    borderRadius: "50%",
    backgroundColor: color.surface,
    transitionProperty: "inset-inline-start",
    transitionDuration: motionToken.fast,
    transitionTimingFunction: motionToken.ease,
  },
  switchKnobOn: { insetInlineStart: "1.4375rem" },
  switchKnobOff: { insetInlineStart: "0.1875rem" },

  /* ------------------------------------------------------------ buttons */
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space["3xs"],
    minHeight: MIN_TARGET,
    paddingBlock: space["2xs"],
    paddingInline: space.md,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: "transparent",
    fontFamily: font.body,
    fontSize: font.sizeXs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color, color, border-color",
    transitionDuration: motionToken.fast,
  },
  buttonPrimary: {
    backgroundColor: {
      default: color.accent,
      ":hover": color.accentHover,
    },
    color: color.onAccent,
  },
  buttonDark: {
    backgroundColor: {
      default: color.surfaceInverse,
      ":hover": color.surfaceInverseDeep,
    },
    color: color.accentOnInverse,
  },
  buttonQuiet: {
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(1, 52, 5, 0.06)",
    },
    borderColor: color.borderStrong,
    color: color.onSurface,
  },
  buttonDanger: {
    backgroundColor: {
      default: "transparent",
      ":hover": color.danger,
    },
    borderColor: "rgba(165, 25, 25, 0.45)",
    color: {
      default: color.danger,
      ":hover": color.onInverse,
    },
  },
  buttonBlock: {
    width: {
      default: "100%",
      [bp.sm]: "auto",
    },
  },
  buttonDisabled: {
    cursor: "not-allowed",
    opacity: 0.45,
  },
  /*
   * The link's own weight, deliberately below the surrounding body text's bold.
   * `text-underline-offset` keeps the rule off the descenders of a `y` or `g`,
   * and `textDecorationThickness` stops it disappearing at small sizes.
   */
  textLink: {
    display: "inline-block",
    padding: 0,
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: font.sizeSm,
    fontWeight: font.weightSemibold,
    textDecorationLine: "underline",
    textDecorationThickness: "1px",
    textUnderlineOffset: "0.18em",
    textDecorationColor: color.borderStrong,
    transitionProperty: "color, text-decoration-color",
    transitionDuration: motionToken.fast,
    ":hover": {
      color: color.accentOnSurface,
      textDecorationColor: color.accentOnSurface,
    },
    ":focus-visible": {
      outline: `2px solid ${color.focusRing}`,
      outlineOffset: "2px",
    },
  },
  highlightFlash: {
    animationName: {
      default: highlightPulse,
      [bp.reducedMotion]: "none",
    },
    animationDuration: "1.5s",
    animationTimingFunction: "ease-out",
  },
});

const STATUS_STYLE: Record<EntryStatus, stylex.StyleXStyles> = {
  published: styles.badgePublished,
  draft: styles.badgeDraft,
  scheduled: styles.badgeScheduled,
  auto: styles.badgeAuto,
  global: styles.badgeGlobal,
};

export const StatusBadge = ({ status }: { status: EntryStatus }) => (
  <span {...stylex.props(styles.badge, STATUS_STYLE[status])}>
    {STATUS_LABEL[status]}
  </span>
);

/* ------------------------------------------------------------------ pill */

export type PillTone = "neutral" | "positive" | "warning" | "danger";

const PILL_TONE: Record<PillTone, stylex.StyleXStyles> = {
  neutral: styles.pillNeutral,
  positive: styles.pillPositive,
  warning: styles.pillWarning,
  danger: styles.pillDanger,
};

/**
 * A short state label for a record - "Provisioned", "Banned", "Pending".
 *
 * Deliberately capped at one or two words: a pill is a scan target, so anything
 * that needs a sentence to explain belongs in the record's meta line instead.
 */
export const Pill = ({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: PillTone;
}) => (
  <span {...stylex.props(styles.pill, PILL_TONE[tone])}>
    <span aria-hidden="true" {...stylex.props(styles.pillDot)} />
    {children}
  </span>
);

/* ---------------------------------------------------------------- notice */

export type NoticeTone = "info" | "success" | "warning" | "danger";

const NOTICE_TONE: Record<NoticeTone, stylex.StyleXStyles> = {
  info: styles.noticeInfo,
  success: styles.noticeSuccess,
  warning: styles.noticeWarning,
  danger: styles.noticeDanger,
};

const NOTICE_ICON: Record<NoticeTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  danger: XCircle,
};

/**
 * A result the operator has to read: an action that succeeded, a gap that
 * blocks the next step, a request that failed.
 *
 * An `<output>`, so it carries an implicit `role="status"` and announces
 * itself when it appears - a mutation result is exactly the case a live region
 * exists for, and the operator is often looking at the button, not the message.
 * The icon is `aria-hidden` because the tone is already carried by the wording
 * and by the border; announcing "warning" on top of "Photography Club has no
 * administrator account yet" just makes a screen reader say it twice. Errors
 * name the problem and the way out - a bare "Something went wrong" is not a
 * notice.
 */
export const Notice = ({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: NoticeTone;
}) => {
  const Icon = NOTICE_ICON[tone];

  return (
    <output {...stylex.props(styles.notice, NOTICE_TONE[tone])}>
      <Icon aria-hidden="true" {...stylex.props(styles.noticeIcon)} />
      <span>{children}</span>
    </output>
  );
};

/* ----------------------------------------------------------- empty state */

export const EmptyState = ({
  title,
  note,
}: {
  title: string;
  note?: string;
}) => (
  <div {...stylex.props(styles.emptyState)}>
    <p {...stylex.props(styles.emptyTitle)}>{title}</p>
    {note ? <p {...stylex.props(styles.emptyNote)}>{note}</p> : null}
  </div>
);

/* ---------------------------------------------------------- record list */

/**
 * A ledger of records: accounts, activity, anything an operator scans by row.
 *
 * One DOM at every width. `RecordRow` wraps its actions below the record on a
 * phone and pushes them to the far edge from a tablet up, so the same markup
 * serves both without a second, mobile-only copy of the list.
 */
export const RecordList = ({
  children,
  label,
}: {
  children: ReactNode;
  /** Accessible name for the list, e.g. "Club accounts". */
  label: string;
}) => (
  <ul aria-label={label} {...stylex.props(styles.recordList)}>
    {children}
  </ul>
);

export const RecordRow = ({
  actions,
  meta,
  name,
}: {
  /** The record's own name - a club, an account, an action. */
  name: ReactNode;
  /** The line under it: handle, role, actor, target. */
  meta?: ReactNode;
  /**
   * The trailing slot. Buttons for the record, or read-only content that
   * belongs at the far edge - a timestamp, an amount, a status pill.
   */
  actions?: ReactNode;
}) => (
  <li {...stylex.props(styles.recordRow)}>
    <div {...stylex.props(styles.recordMain)}>
      <p {...stylex.props(styles.recordTitle)}>{name}</p>
      {meta ? <p {...stylex.props(styles.recordMeta)}>{meta}</p> : null}
    </div>
    {actions ? (
      <div {...stylex.props(styles.recordActions)}>{actions}</div>
    ) : null}
  </li>
);

export const Panel = ({
  children,
  tone = "default",
  accent = false,
  style,
}: {
  children: ReactNode;
  tone?: "default" | "inverse";
  accent?: boolean;
  style?: stylex.StyleXStyles;
}) => (
  <section
    {...stylex.props(
      styles.panel,
      accent && styles.panelAccent,
      tone === "inverse" && styles.panelInverse,
      style
    )}
  >
    {children}
  </section>
);

export const PanelHead = ({
  eyebrow,
  title,
  note,
  action,
  inverse = false,
  titleId,
}: {
  eyebrow?: string;
  title: string;
  /**
   * One or two sentences saying what this panel is for and what happens next.
   *
   * `ReactNode` rather than `string` because a note that has to carry a value -
   * who sent it, when, what a link is for - should not have to be flattened
   * into prose to be displayed. Rendered inside a `<p>`, so keep it inline.
   */
  note?: ReactNode;
  action?: ReactNode;
  inverse?: boolean;
  titleId?: string;
}) => (
  <div {...stylex.props(styles.panelHead)}>
    <div>
      {eyebrow ? (
        <p
          {...stylex.props(
            styles.panelEyebrow,
            inverse && styles.panelEyebrowInverse
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2 id={titleId} {...stylex.props(styles.panelTitle)}>
        {title}
      </h2>
      {note ? (
        <p
          {...stylex.props(
            styles.panelNote,
            inverse && styles.panelNoteInverse
          )}
        >
          {note}
        </p>
      ) : null}
    </div>
    {action}
  </div>
);

export const FieldGrid = ({ children }: { children: ReactNode }) => (
  <div {...stylex.props(styles.fieldGrid)}>{children}</div>
);

const CUSTOM_OPTION_VALUE = "__custom_link__";

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...stylex.props(
      styles.customSelectChevron,
      open && styles.customSelectChevronOpen
    )}
  >
    <path d="M4 6l4 4 4-4" />
  </svg>
);

/** The tallest a select menu is ever allowed to be, in px. */
const MENU_MAX = 240;
/** Below this, a menu is treated as having nowhere to go and flips instead. */
const MENU_MIN_SPACE = 120;
/** Breathing room between the menu and the viewport edge. */
const MENU_GUTTER = 12;

const CustomSelect = ({
  "aria-describedby": ariaDescribedBy,
  dirty,
  id,
  onChange,
  options,
  selectedValue,
}: {
  "aria-describedby"?: string;
  dirty: boolean;
  id: string;
  onChange: ((next: string) => void) | undefined;
  options: { label: string; value: string }[] | undefined;
  selectedValue: string | undefined;
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Whether the menu opens above the trigger, and how tall it may be.
   *
   * ## Why this is measured rather than styled
   *
   * A select's menu used to open strictly downwards at a fixed `15rem`, inside
   * whatever scroll container held it. Inside `Dialog` — whose body is
   * `overflow-y: auto` — that combination is a trap: a select in the lower half
   * of the dialog had its menu clipped by the very scroller holding it, so the
   * last one or two options were simply unreachable. No amount of `z-index`
   * fixes that; the clipping ancestor is the problem.
   *
   * So the menu is sized to the space that actually exists and flips to the side
   * with more of it. Both numbers come from the trigger's rect against the
   * viewport, because a top-layer `<dialog>` is what the select is being measured
   * inside of, and the viewport is the one edge that does not move.
   *
   * `MENU_MAX` is the same ceiling the old fixed `maxHeight` had: this can only
   * ever make the menu *smaller* than before, never taller.
   */
  const [placement, setPlacement] = useState<{
    above: boolean;
    maxHeight: number;
  } | null>(null);

  const placeMenu = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - MENU_GUTTER;
    const above = rect.top - MENU_GUTTER;
    const useAbove = below < MENU_MIN_SPACE && above > below;

    setPlacement({
      above: useAbove,
      maxHeight: Math.max(
        MENU_MIN_SPACE,
        Math.min(MENU_MAX, useAbove ? above : below)
      ),
    });
  }, []);

  const selectedLabel =
    options?.find((o) => o.value === selectedValue)?.label ?? "Custom link...";

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    setPlacement(null);
    buttonRef.current?.focus();
  }, []);

  const openMenu = useCallback(() => {
    placeMenu();
    setActiveIndex(0);
    setOpen(true);
  }, [placeMenu]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    /*
     * Re-measure, and close on anything that moves the trigger out from under an
     * already-open menu. Scrolling a dialog body, resizing the window and
     * rotating a phone all invalidate the placement, and a menu left pointing at
     * a rectangle that no longer exists is worse than no menu.
     */
    const handleReflow = () => {
      placeMenu();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleReflow);
    window.addEventListener("scroll", handleReflow, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleReflow);
      window.removeEventListener("scroll", handleReflow, true);
    };
  }, [open, close, placeMenu]);

  useEffect(() => {
    if (open && activeIndex >= 0 && optionRefs.current[activeIndex]) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  const allOptions = options ?? [];

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setActiveIndex((prev) => (prev < allOptions.length - 1 ? prev + 1 : 0));
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : allOptions.length - 1));
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        {
          const option = allOptions[activeIndex];
          if (option) {
            onChange?.(option.value);
            close();
          }
        }
        break;
      }
      case "Home": {
        event.preventDefault();
        setActiveIndex(0);
        break;
      }
      case "End": {
        event.preventDefault();
        setActiveIndex(allOptions.length - 1);
        break;
      }
      default: {
        break;
      }
    }
  };

  return (
    <div {...stylex.props(styles.customSelect)}>
      <button
        aria-describedby={ariaDescribedBy}
        aria-expanded={open}
        aria-haspopup="listbox"
        id={id}
        onClick={() => {
          if (open) {
            close();
            return;
          }
          openMenu();
        }}
        onKeyDown={handleKeyDown}
        ref={buttonRef}
        type="button"
        {...stylex.props(
          styles.customSelectButton,
          styles.control,
          dirty && styles.controlDirty,
          open && styles.customSelectButtonOpen
        )}
      >
        <span>{selectedLabel}</span>
        <ChevronIcon open={open} />
      </button>
      {open ? (
        /* oxlint-disable jsx-a11y/prefer-tag-over-role -- custom dropdown, not native select */
        <div
          aria-labelledby={id}
          data-lenis-prevent
          ref={menuRef}
          role="listbox"
          style={
            placement ? { maxHeight: `${placement.maxHeight}px` } : undefined
          }
          {...stylex.props(
            styles.customSelectMenu,
            placement?.above && styles.customSelectMenuAbove
          )}
        >
          {allOptions.map((option, index) => (
            <button
              aria-selected={option.value === selectedValue}
              key={option.value}
              onClick={() => {
                onChange?.(option.value);
                close();
              }}
              onMouseEnter={() => setActiveIndex(index)}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              role="option"
              type="button"
              {...stylex.props(
                styles.customSelectOption,
                index === activeIndex && styles.customSelectOptionActive,
                option.value === selectedValue &&
                  styles.customSelectOptionSelected
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : /* oxlint-enable jsx-a11y/prefer-tag-over-role */
      null}
    </div>
  );
};

const renderSelectControl = (
  id: string,
  hintId: string,
  value: string | undefined,
  dirty: boolean,
  onChange: ((next: string) => void) | undefined,
  hint: string | undefined,
  options: { label: string; value: string }[] | undefined
) => {
  const knownValue = options?.some((option) => option.value === value);
  const selectedValue = knownValue ? value : CUSTOM_OPTION_VALUE;

  return (
    <CustomSelect
      aria-describedby={hint ? hintId : undefined}
      dirty={dirty}
      id={id}
      onChange={onChange}
      options={options}
      selectedValue={selectedValue}
    />
  );
};

const INPUT_TYPE: Record<
  string,
  "text" | "email" | "password" | "datetime-local" | "url"
> = {
  datetime: "datetime-local",
  email: "email",
  password: "password",
  url: "url",
};

/**
 * Autocorrect and autocapitalise are for prose. On a credential field they are
 * a silent corruption: Android rewrites the first character to upper case and
 * iOS offers to "fix" a word it does not recognise, so a password the operator
 * retypes from paper stops matching.
 */
const CREDENTIAL_KEYBOARD = {
  autoCapitalize: "none",
  autoCorrect: "off",
  spellCheck: false,
} as const;

const renderControl = (
  kind: string,
  id: string,
  hintId: string,
  value: string | undefined,
  dirty: boolean,
  onChange: ((next: string) => void) | undefined,
  hint: string | undefined,
  options: { label: string; value: string }[] | undefined,
  autoComplete: string | undefined,
  autoFocus: boolean
) => {
  if (kind === "select") {
    return renderSelectControl(
      id,
      hintId,
      value,
      dirty,
      onChange,
      hint,
      options
    );
  }

  if (kind === "readonly") {
    return (
      <div id={id} {...stylex.props(styles.readonly)}>
        <span>{value || "—"}</span>
      </div>
    );
  }

  if (kind === "textarea") {
    return (
      <textarea
        aria-describedby={hint ? hintId : undefined}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        id={id}
        onChange={(event) => onChange?.(event.target.value)}
        rows={3}
        value={value ?? ""}
        {...stylex.props(
          styles.control,
          styles.textarea,
          dirty && styles.controlDirty
        )}
      />
    );
  }

  const inputType = INPUT_TYPE[kind] ?? "text";
  return (
    <input
      aria-describedby={hint ? hintId : undefined}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      id={id}
      onChange={(event) => onChange?.(event.target.value)}
      // Issued credentials are lower case with hyphens. Without these, a phone
      // keyboard silently rewrites the first letter to upper case and the
      // operator cannot sign in with the password they were just given.
      {...(inputType === "password" ? CREDENTIAL_KEYBOARD : null)}
      type={inputType}
      value={value ?? ""}
      {...stylex.props(styles.control, dirty && styles.controlDirty)}
    />
  );
};

/**
 * The label / control / reset / hint frame every editor field shares.
 *
 * Split out of `Field` so a control that cannot be a plain `<input>` — the
 * rich text editor, the media field — can drop its own control inside the same
 * frame instead of reimplementing the label association, the reset button and
 * the hint wiring. `htmlFor` is only correct when the control really is the
 * element with that id, so the caller decides whether to pass one.
 */
export const FieldShell = ({
  children,
  hint,
  hintId,
  highlightFlash,
  label,
  labelFor,
  onReset,
  showClear,
  wide = false,
}: {
  children: ReactNode;
  label: string;
  hint?: string;
  /** Id given to the hint paragraph, for the control's `aria-describedby`. */
  hintId?: string;
  /**
   * Id of the control the label points at. Omitted when the control cannot
   * take one — the rich text editor is a `contenteditable` region, so it is
   * labelled with `aria-labelledby` on the region itself instead.
   */
  labelFor?: string;
  highlightFlash?: boolean;
  showClear?: boolean;
  onReset?: () => void;
  wide?: boolean;
}) => (
  <div
    {...stylex.props(
      styles.field,
      wide && styles.fieldWide,
      highlightFlash && styles.highlightFlash
    )}
  >
    {labelFor ? (
      <label htmlFor={labelFor} {...stylex.props(styles.label)}>
        {label}
      </label>
    ) : (
      <span {...stylex.props(styles.label)}>{label}</span>
    )}

    <div {...stylex.props(styles.fieldRow)}>
      <div {...stylex.props(styles.fieldRowControl)}>{children}</div>
      {showClear && onReset ? (
        <button
          aria-label={`Reset ${label}`}
          onClick={onReset}
          type="button"
          {...stylex.props(styles.clearButton)}
        >
          ×
        </button>
      ) : null}
    </div>

    {hint ? (
      <p id={hintId} {...stylex.props(styles.hint)}>
        {hint}
      </p>
    ) : null}
  </div>
);

/**
 * A labelled control.
 *
 * The label is a real `<label htmlFor>` rather than a wrapping `<span>`, so
 * tapping it focuses the control - which on a phone is most of the hit area an
 * editor actually aims at.
 */
export const Field = ({
  label,
  kind = "text",
  value,
  hint,
  wide = false,
  dirty = false,
  highlighted = false,
  autoComplete,
  autoFocus = false,
  onChange,
  onReset,
  options,
}: {
  label: string;
  kind?:
    | "text"
    | "textarea"
    | "readonly"
    | "select"
    | "email"
    | "password"
    | "datetime"
    | "url";
  value?: string;
  hint?: string;
  wide?: boolean;
  dirty?: boolean;
  highlighted?: boolean;
  /**
   * Passed to the control verbatim. Browsers key off this to offer a generated
   * password instead of the one the operator is typing over, and to keep a
   * credential form out of the "fill your address" autofill queue.
   */
  autoComplete?: string;
  /**
   * For a field that appears *because* of an action - the one control the
   * operator is expected to type into next. Only the one; autofocusing a whole
   * form moves focus past whatever the operator was reading.
   */
  autoFocus?: boolean;
  onChange?: (next: string) => void;
  onReset?: () => void;
  options?: { label: string; value: string }[];
}) => {
  const id = useId();
  const hintId = `${id}-hint`;
  // `&&` over a function would yield the function, not a boolean.
  const showClear = dirty && Boolean(onReset);

  return (
    <FieldShell
      hint={hint}
      hintId={hintId}
      highlightFlash={highlighted}
      label={label}
      labelFor={id}
      onReset={onReset}
      showClear={showClear}
      wide={wide}
    >
      {renderControl(
        kind,
        id,
        hintId,
        value,
        dirty,
        onChange,
        hint,
        options,
        autoComplete,
        autoFocus
      )}
    </FieldShell>
  );
};

export const SwitchRow = ({
  label,
  description,
  checked,
  onToggle,
  disabled = false,
  badge,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  badge?: ReactNode;
}) => {
  const labelId = useId();

  return (
    <div {...stylex.props(styles.switchRow)}>
      <div {...stylex.props(styles.switchText)}>
        <p id={labelId} {...stylex.props(styles.switchLabel)}>
          {label}
        </p>
        {description ? (
          <p {...stylex.props(styles.switchDesc)}>{description}</p>
        ) : null}
      </div>
      <div {...stylex.props(styles.switchControls)}>
        {badge}
        <button
          aria-checked={checked}
          aria-labelledby={labelId}
          disabled={disabled}
          onClick={onToggle}
          role="switch"
          type="button"
          {...stylex.props(styles.switchButton)}
        >
          <span
            {...stylex.props(
              styles.switchTrack,
              checked ? styles.switchTrackOn : styles.switchTrackOff
            )}
          />
          <span
            {...stylex.props(
              styles.switchKnob,
              checked ? styles.switchKnobOn : styles.switchKnobOff
            )}
          />
        </button>
      </div>
    </div>
  );
};

type ButtonTone = "primary" | "dark" | "quiet" | "danger";

/**
 * Exported alongside `styles.button` below so a control that must render as a
 * real anchor \u2014 a row action that navigates rather than mutates \u2014 can look
 * like a `CmsButton` without being one. See `RowActionLink`.
 */
export const BUTTON_TONE: Record<ButtonTone, stylex.StyleXStyles> = {
  primary: styles.buttonPrimary,
  dark: styles.buttonDark,
  quiet: styles.buttonQuiet,
  danger: styles.buttonDanger,
};

export type { ButtonTone };

/** The button's base shape, undecorated by tone. See `BUTTON_TONE`. */
export const BUTTON_BASE_STYLE = styles.button;

export const CmsButton = ({
  children,
  tone = "quiet",
  block = false,
  disabled = false,
  onClick,
  type = "button",
  style,
}: {
  children: ReactNode;
  tone?: ButtonTone;
  block?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  style?: stylex.StyleXStyles;
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    type={type === "submit" ? "submit" : "button"}
    {...stylex.props(
      styles.button,
      BUTTON_TONE[tone],
      block && styles.buttonBlock,
      disabled && styles.buttonDisabled,
      style
    )}
  >
    {children}
  </button>
);

/**
 * An anchor that looks like a `CmsButton`.
 *
 * Spread props pass through so a router `<Link>` can drive the navigation while
 * the visual weight stays identical to the button beside it - an action the
 * operator reads as "the next step" should not change shape because it happens
 * to change the URL. `CmsLinkProps` is what the app passes, `onClick` included.
 */
export type CmsLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  tone?: ButtonTone;
  external?: boolean;
};

export const CmsLink = ({
  children,
  href,
  tone = "quiet",
  external = false,
  rel,
  target,
  ...rest
}: CmsLinkProps) => (
  <a
    href={href}
    rel={external ? "noopener noreferrer" : rel}
    target={external ? "_blank" : target}
    {...rest}
    {...stylex.props(styles.button, BUTTON_TONE[tone])}
  >
    {children}
  </a>
);

/**
 * A link that reads as a link: inline, underlined, no box.
 *
 * `CmsLink` is a button that happens to navigate, which is right for "the next
 * step" and wrong for "a place this panel points at". As a boxed uppercase
 * button in a panel's top-right corner it outweighed the panel's own title —
 * a secondary jump rendered at primary-button weight.
 */
export type CmsTextLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  external?: boolean;
};

/** `CmsTextLink`'s look, for a caller that must render a real router `<Link>`. */
export const TEXT_LINK_STYLE = styles.textLink;

export const CmsTextLink = ({
  children,
  href,
  external = false,
  rel,
  target,
  ...rest
}: CmsTextLinkProps) => (
  <a
    href={href}
    rel={external ? "noopener noreferrer" : rel}
    target={external ? "_blank" : target}
    {...rest}
    {...stylex.props(styles.textLink)}
  >
    {children}
  </a>
);
