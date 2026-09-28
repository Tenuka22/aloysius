import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";

/**
 * The page frame and screen heading shared by every signed-in workspace.
 *
 * ## Why this exists
 *
 * The editor screens each declared their own copy of this - nine near-identical
 * `stylex.create` blocks with the same `wrap`, `screenHead`, `eyebrow`,
 * `heading` and `note` rules. They drifted: most of them padded the page at
 * `space.lg` above 40rem, two did not, and the club-review screen dropped the
 * eyebrow and the display heading entirely. A shared component is the only thing
 * that makes "the CMS and the club portal look the same" a property of the code
 * rather than a thing to remember.
 *
 * ## The spacing
 *
 * The padding here is *in addition to* the `paddingBlock` / `paddingInline` the
 * `Shell` already applies to `main`, so a workspace page sits further in than a
 * bare `<main>`. That is deliberate and matches what every editor screen already
 * rendered - the extra inset is what stops a wide panel from touching the
 * viewport edge on a tablet. Both paddings are kept in one place now so that if
 * it should be one or the other, it is a one-line change rather than eleven.
 */

const styles = stylex.create({
  /*
   * Responsive padding written as a per-property object rather than a nested
   * at-rule block. StyleX only accepts a breakpoint key with a single value, so
   * `[bp.md]: { padding… }` is a compile error; `{ default, [bp.md] }` per
   * property is the supported form and is what the rest of the design system
   * uses.
   */
  wrap: {
    paddingBlockStart: { default: space.md, [bp.md]: space.lg },
    paddingBlockEnd: { default: space.md, [bp.md]: space.lg },
    paddingInlineStart: { default: space.md, [bp.md]: space.lg },
    paddingInlineEnd: { default: space.md, [bp.md]: space.lg },
  },

  /*
   * A flex row rather than a plain stack so actions sit on the baseline of the
   * heading on a wide screen and drop beneath it on a narrow one. `flex-end`
   * alignment is what makes a row of buttons line up with the bottom of the note
   * rather than floating at the top next to the eyebrow.
   */
  screenHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space.sm,
    marginBlockEnd: space.md,
  },
  headingWrap: {
    // Without this a long heading and an actions row on one line both refuse to
    // shrink, and the row overflows instead of wrapping.
    minWidth: 0,
  },
  eyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  heading: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
    textWrap: "balance",
  },
  note: {
    margin: 0,
    marginBlockStart: space["3xs"],
    maxWidth: space.measure,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space["2xs"],
  },
});

/**
 * The padded page container. A component rather than a class so the padding
 * tokens stay in this file - `className` is how layout drift becomes invisible.
 */
export const ScreenWrap = ({ children }: { children: ReactNode }) => (
  <div {...stylex.props(styles.wrap)}>{children}</div>
);

/**
 * The heading block at the top of a workspace screen.
 *
 * `eyebrow` is the breadcrumb - "Pages / Media" on an editor, "Club / Galleries"
 * in the club portal - and is the one prop that makes two screens of the same
 * shape read as the same product. It is optional because the dashboard and the
 * club review queue have no meaningful parent to name.
 */
export const ScreenHead = ({
  actions,
  eyebrow,
  heading,
  note,
}: {
  heading: string;
  note?: ReactNode;
  eyebrow?: string;
  /** Rendered on the trailing edge: publish buttons, filters, and so on. */
  actions?: ReactNode;
}) => (
  <div {...stylex.props(styles.screenHead)}>
    <div {...stylex.props(styles.headingWrap)}>
      {eyebrow ? <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p> : null}
      <h1 {...stylex.props(styles.heading)}>{heading}</h1>
      {note ? <p {...stylex.props(styles.note)}>{note}</p> : null}
    </div>
    {actions ? <div {...stylex.props(styles.actions)}>{actions}</div> : null}
  </div>
);
