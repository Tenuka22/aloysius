import * as stylex from "@stylexjs/stylex";
import { Search } from "lucide-react";

import { color, font, radius, space } from "../../tokens/tokens.stylex";
import { useDebouncedListSearch } from "./use-debounced-list-search";

/**
 * A list's search box, wired to the debounce.
 *
 * ## One box, in one shape
 *
 * Every list's search box lives here, and a surface that needs a
 * differently-shaped search field says so in its own file rather than inventing a
 * third.
 *
 * The debounce is inside this component on purpose: a list's search writes to the
 * URL, so a surface that remembered to debounce and one that forgot would fail in
 * the same way — a request per keystroke, and a stale response repainting the list
 * with the rows for a term nobody finished typing.
 */

const CONTROL_HEIGHT = "2.75rem";

const styles = stylex.create({
  field: {
    display: "grid",
    gap: space["3xs"],
    minWidth: "14rem",
    /*
     * A basis, not `1 1 100%`. The search box used to claim the whole filter
     * row and squeeze the two selects into a corner; capped, it takes the room
     * it needs up to a readable measure and leaves the filters beside it.
     */
    flex: "1 1 18rem",
    maxWidth: "30rem",
  },
  label: {
    fontFamily: font.body,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceMuted,
  },
  controlRow: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    // Matched to `Field`'s control so the row sits on one line.
    minHeight: CONTROL_HEIGHT,
    paddingInline: space.xs,
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: radius.sm,
    ":focus-within": {
      borderColor: color.onSurface,
    },
  },
  glyph: {
    width: "1rem",
    height: "1rem",
    color: color.onSurfaceSubtle,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingBlock: space["2xs"],
    backgroundColor: "transparent",
    /*
     * Longhand, never the `border` shorthand: StyleX compiles `border: "none"`
     * to *nothing*, so the input kept its user-agent border and the search box
     * rendered with a second border drawn inside the one around it.
     */
    borderWidth: 0,
    borderStyle: "none",
    borderRadius: 0,
    color: color.onSurface,
    fontFamily: font.body,
    // 16px minimum on the control itself: iOS Safari zooms the whole page in
    // when a focused input's text is smaller than that.
    fontSize: "1rem",
    lineHeight: font.leadingNormal,
    ":focus": {
      outline: "none",
    },
    "::placeholder": {
      color: color.onSurfaceSubtle,
    },
    "::-webkit-search-cancel-button": {
      cursor: "pointer",
    },
  },
});

export const DataTableSearchField = ({
  id,
  label = "Search",
  onCommit,
  placeholder,
  value,
}: {
  /** Namespaced per table by the caller, so two tables on a page do not collide. */
  id: string;
  label?: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  /** The committed term — what the server was asked for, which is the URL. */
  value: string;
}) => {
  const { draft, setDraft } = useDebouncedListSearch(value, onCommit);

  return (
    <div {...stylex.props(styles.field)}>
      <label htmlFor={id} {...stylex.props(styles.label)}>
        {label}
      </label>
      <div {...stylex.props(styles.controlRow)}>
        <Search aria-hidden="true" {...stylex.props(styles.glyph)} />
        <input
          id={id}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          placeholder={placeholder}
          type="search"
          value={draft}
          {...stylex.props(styles.input)}
        />
      </div>
    </div>
  );
};
