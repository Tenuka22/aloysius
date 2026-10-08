import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { space } from "../../tokens/tokens.stylex";

const styles = stylex.create({
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: space.sm,
    marginBlockEnd: space.xs,
  },
});

/**
 * The controls above a list: search, filters, and whatever else changes what the
 * list contains.
 *
 * ## Why this is a component and not a style block
 *
 * Five surfaces grew their own `display: flex; flex-wrap: wrap; align-items:
 * flex-end` rule, and one — the galleries list — never grew one at all and
 * dropped a bare search field straight onto the table frame. Two consequences,
 * both of which shipped:
 *
 * - The search box's own bottom border sat flush against the table header band,
 *   and the two read as one control that had been drawn wrong.
 * - The control row's baseline drifted between surfaces, so the same search box
 *   sat at a different height above its table depending on which screen you were
 *   on. Nothing in the rule said how high it should be, so nothing held it there.
 *
 * `alignItems: flex-end` is the load-bearing part: the search field is a label
 * over a control and a `Field` is a label over a control, and flex-end aligns
 * their *last* lines, so the controls sit on one line even when a label wraps to
 * two. `flex-start` would align their tops and put the boxes out of line by
 * however much the taller label wrapped.
 *
 * The gap to the table is `space.xs` and it lives here rather than on the frame,
 * because it is a relationship between the toolbar and the table — not a property
 * of either one on its own.
 */
export const DataTableToolbar = ({ children }: { children: ReactNode }) => (
  <div {...stylex.props(styles.toolbar)}>{children}</div>
);
