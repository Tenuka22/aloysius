import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

/**
 * Page furniture shared by every club-portal screen.
 *
 * These are the same things on all eight pages - a breadcrumb, a title, a
 * sentence saying what the page is for, a stack, a loading line and an error
 * line. They live here so a new club screen is four lines of JSX rather than
 * forty.
 *
 * The frame and the heading are the *shared* `ScreenWrap` / `ScreenHead` the CMS
 * editor screens use, not a club-only variant. That is the point: the club portal
 * and the CMS are the same product at different privilege levels, and they had
 * drifted - the club portal was using a smaller, non-display heading with no
 * breadcrumb and no page inset, so moving between the two felt like moving
 * between two applications.
 */

const styles = stylex.create({
  stack: {
    display: "grid",
    gap: space.md,
    alignContent: "start",
  },
  fieldStack: {
    display: "grid",
    gap: space.md,
    // Forms hold wide inputs; without this a grid track sized by its content
    // refuses to shrink and pushes a horizontal scrollbar onto the page.
    minWidth: 0,
  },
  loading: {
    margin: 0,
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
});

export const ClubPage = ({
  actions,
  children,
  eyebrow,
  note,
  title,
}: {
  title: string;
  /** One sentence on what this screen is for and what happens after submitting. */
  note: string;
  /** Breadcrumb above the title, e.g. "Club / Galleries". */
  eyebrow?: string;
  /** Buttons on the trailing edge of the heading row. */
  actions?: ReactNode;
  children: ReactNode;
}) => (
  <ScreenWrap>
    <ScreenHead
      actions={actions}
      eyebrow={eyebrow}
      heading={title}
      note={note}
    />
    <div {...stylex.props(styles.stack)}>{children}</div>
  </ScreenWrap>
);

export const ClubPageLoading = ({ what }: { what: string }) => (
  <p {...stylex.props(styles.loading)}>Loading {what}…</p>
);

/**
 * A vertical gap between a form's fields and its button.
 *
 * Every club screen is a stack of fields ending in one action, and the spacing
 * between the last field and that action is what makes the screen read as a
 * form rather than a list. It is a component rather than a class because
 * `className` is how Tailwind-shaped habits get into a StyleX codebase.
 */
export const FieldStack = ({ children }: { children: ReactNode }) => (
  <div {...stylex.props(styles.fieldStack)}>{children}</div>
);
