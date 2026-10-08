import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";

import { color, font, space } from "../../tokens/tokens.stylex";
import {
  BUTTON_BASE_STYLE,
  BUTTON_TONE,
  CmsButton,
} from "../cms/cms-primitives";
import type { ButtonTone } from "../cms/cms-primitives";

const styles = stylex.create({
  title: {
    display: "block",
    fontFamily: font.display,
    fontSize: font.sizeMd,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    // A title is a phrase, not a token: breaking "Photography Club" after
    // "Photography" is fine, breaking it mid-word is not.
    overflowWrap: "break-word",
  },
  meta: {
    display: "block",
    marginBlockStart: space["3xs"],
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    overflowWrap: "break-word",
  },
  /*
   * `nowrap` for the opposite reason the title is allowed to wrap and this is
   * not: an identifier broken across two lines is not the identifier. The column
   * is shrink-to-fit, so the extra width costs less than the misreading.
   */
  metaMono: {
    fontFamily: font.mono,
    whiteSpace: "nowrap",
  },
  action: {
    minHeight: "2.125rem",
    paddingInline: space.sm,
  },
});

/**
 * The inside of a list row: what the row is, the fact under it, and the control
 * that acts on it.
 *
 * ## Why these are shared
 *
 * Five tables describe a row the same way, and they had drifted apart doing it.
 * Two used the display serif at `sizeMd`, one used `sizeSm`, one used a bare
 * `<strong>` at whatever the cell happened to be, and the identifiers under them
 * were mono in three places and plain prose in a fourth. Five row titles in one
 * product, at three sizes and two voices, is what made the list screens read as
 * assembled rather than designed.
 *
 * The title is the **display** face and the meta line is not, deliberately. A
 * club's name is a name — the same kind of object the page headings are — and a
 * `/slug` or `@handle` is data. Setting both in the serif made the identifiers
 * shout as loudly as the thing they identify.
 *
 * `RowMeta` takes a `mono` flag rather than picking for you, because the line
 * under a title is sometimes prose ("Gallery page · Live") and sometimes an
 * identifier (`/photography`, `@photography-admin`), and those want different
 * voices. Choosing per call site is the honest version of that decision.
 */
export const RowTitle = ({ children }: { children: ReactNode }) => (
  <span {...stylex.props(styles.title)}>{children}</span>
);

/**
 * The line under a row's title. `mono` for identifiers a reader may have to type
 * or compare character by character; left off for prose.
 */
export const RowMeta = ({
  children,
  mono = false,
}: {
  children: ReactNode;
  mono?: boolean;
}) => (
  <span {...stylex.props(styles.meta, mono && styles.metaMono)}>
    {children}
  </span>
);

/**
 * A row's control, at row scale.
 *
 * The shared `CmsButton` is `2.75rem` tall with `1.5rem` of inline padding —
 * sized to be a screen's primary action. Repeated down every row of a list that
 * sizing becomes a column of controls heavier than the data beside them, and on
 * the review queue it was a wall of filled gold buttons that all read as armed.
 * `2.125rem` and `.75rem` is the same button at the scale of one row's worth of
 * attention.
 *
 * `tone` is passed straight through, so a destructive row control can still say
 * so.
 */
export const RowAction = ({
  children,
  disabled = false,
  onClick,
  tone = "quiet",
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: ButtonTone;
  /** A row whose own mutation is in flight, so only that row is disabled. */
  disabled?: boolean;
}) => (
  <CmsButton
    disabled={disabled}
    onClick={onClick}
    style={styles.action}
    tone={tone}
  >
    {children}
  </CmsButton>
);

/**
 * `RowAction`'s look, for a row whose control navigates rather than mutates.
 *
 * A real `<Link>` rather than a button with an `onClick` that calls
 * `navigate()`: a row that opens a detail screen is a place on the site, and a
 * place is reached by a link - right-click, open-in-new-tab and the browser's
 * own "copy link" all have to work on it the way they do on every other link on
 * the page, which an `onClick` handler cannot offer.
 *
 * Styled from the same two pieces `CmsButton` is built from rather than from a
 * second copy of the button's shape, so the two can never drift apart. Typed off
 * a minimal shape rather than against one app's route tree: this package has no
 * route registry of its own, so `ComponentProps<typeof Link>` resolves against
 * `AnyRouter` here and would force every caller's `params`/`search` into the
 * generic reducer-function form that type degrades to. The cast below is the
 * same `as never` boundary `use-list-search-writer.ts` takes for the identical
 * reason \u2014 the caller's own `to`/`params`/`search` are still checked wherever
 * `Link` is imported with the app's real registry in scope, which is every call
 * site of this component.
 */
export const RowActionLink = ({
  children,
  tone = "quiet",
  ...linkProps
}: {
  to: string;
  params?: Record<string, string>;
  search?:
    | Record<string, unknown>
    | ((prev: Record<string, unknown>) => Record<string, unknown>);
  children: ReactNode;
  tone?: ButtonTone;
}) => (
  <Link
    {...(linkProps as unknown as ComponentProps<typeof Link>)}
    {...stylex.props(BUTTON_BASE_STYLE, BUTTON_TONE[tone], styles.action)}
  >
    {children}
  </Link>
);
