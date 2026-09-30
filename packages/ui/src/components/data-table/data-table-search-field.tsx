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

const styles = stylex.create({
  field: {
    display: "grid",
    gap: space["3xs"],
    minWidth: "16rem",
    flex: "1 1 16rem",
  },
  label: {
    fontFamily: font.body,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.onSurface,
  },
  controlRow: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: radius.sm,
    paddingInline: space["2xs"],
    ":focus-within": {
      borderColor: color.accent,
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
    border: "none",
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
