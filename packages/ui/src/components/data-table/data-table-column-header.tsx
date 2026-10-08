import * as stylex from "@stylexjs/stylex";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  color,
  font,
  motionToken,
  radius,
  shadow,
  space,
} from "../../tokens/tokens.stylex";

/**
 * The direction glyph, and the fact that it is `aria-hidden`.
 *
 * The direction is already announced — through `aria-sort` on the `<th>`, which
 * the frame sets from the same state — so putting it in the accessible name as
 * well would say it twice. The glyph is for the reader looking at the table.
 */
const SortGlyph = ({ sorted }: { sorted: false | "asc" | "desc" }) => {
  if (sorted === "asc") {
    return <ArrowUp aria-hidden="true" {...stylex.props(styles.glyph)} />;
  }

  if (sorted === "desc") {
    return <ArrowDown aria-hidden="true" {...stylex.props(styles.glyph)} />;
  }

  return (
    <ArrowUpDown
      aria-hidden="true"
      {...stylex.props(styles.glyph, styles.glyphIdle)}
    />
  );
};

/**
 * The `title` on a sort control, **derived from the current state**.
 *
 * It says what the next click will do, which is the only question a sort control is
 * ever asked, and it changes when the state does: a fixed string reads correctly
 * once and then lies for the rest of the session.
 */
const sortHint = (sorted: false | "asc" | "desc", label: string): string => {
  const what = label.toLowerCase();

  if (sorted === "asc") {
    return `Sorted by ${what}, A to Z. Activate to sort Z to A.`;
  }

  if (sorted === "desc") {
    return `Sorted by ${what}, Z to A. Activate to sort A to Z.`;
  }

  return `Not sorted by ${what}. Activate to sort A to Z.`;
};

/**
 * A header that is also the sort control for its column.
 *
 * The name is passed in rather than read off `column.id`, because the two disagree
 * on the column a reader cares most about: the id is `submittedAt` and the name is
 * "Sent". A tooltip that offers `submittedAt` is an implementation detail wearing
 * a control's clothes.
 *
 * A **button that opens a menu of the three orders** rather than a two-state
 * toggle, because a list whose order is in the URL has a third state to reach —
 * its own default — and a toggle has nowhere to put it. The default belongs to the
 * list, so `onSort(null)` is what "back to the default" means here; the caller
 * decides what its default is.
 *
 * A column the server cannot order by gets a plain string in its column
 * definition, not this with a handler that does nothing.
 */
export const DataTableColumnHeader = ({
  label,
  onSort,
  sorted,
}: {
  label: string;
  /** `null` is the list's own default order. */
  onSort: (direction: "asc" | "desc" | null) => void;
  sorted: false | "asc" | "desc";
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} {...stylex.props(styles.root)}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          setOpen((previous) => !previous);
        }}
        title={sortHint(sorted, label)}
        type="button"
        {...stylex.props(styles.trigger, open && styles.triggerOpen)}
      >
        {label}
        <SortGlyph sorted={sorted} />
      </button>
      {open ? (
        <div role="menu" {...stylex.props(styles.menu)}>
          <button
            onClick={() => {
              setOpen(false);
              onSort("asc");
            }}
            role="menuitem"
            type="button"
            {...stylex.props(styles.item)}
          >
            <ArrowUp aria-hidden="true" {...stylex.props(styles.itemGlyph)} />
            Ascending
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onSort("desc");
            }}
            role="menuitem"
            type="button"
            {...stylex.props(styles.item)}
          >
            <ArrowDown aria-hidden="true" {...stylex.props(styles.itemGlyph)} />
            Descending
          </button>
          <div aria-hidden="true" {...stylex.props(styles.separator)} />
          <button
            disabled={sorted === false}
            onClick={() => {
              setOpen(false);
              onSort(null);
            }}
            role="menuitem"
            type="button"
            {...stylex.props(styles.item, styles.itemDisabled)}
          >
            <ArrowUpDown
              aria-hidden="true"
              {...stylex.props(styles.itemGlyph)}
            />
            Back to the default order
          </button>
        </div>
      ) : null}
    </div>
  );
};

const styles = stylex.create({
  root: {
    position: "relative",
    display: "inline-flex",
  },
  trigger: {
    display: "inline-flex",
    alignItems: "center",
    gap: space["3xs"],
    /*
     * The negative margin plus the matching padding is what puts the label on
     * the same optical line as the row's own first cell: the button's padding
     * box starts half a step outside the `<th>`'s content edge and the text
     * inside it lands exactly on that edge. Without the pair, every header
     * label sits visibly right of the column it names.
     */
    marginInlineStart: `-${space["2xs"]}`,
    paddingInline: space["2xs"],
    paddingBlock: space["3xs"],
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(1, 52, 5, 0.06)",
    },
    borderRadius: radius.sm,
    /*
     * Longhand, never the `border` shorthand. StyleX compiles `border: "none"`
     * to *nothing* — it has no expansion for it and drops it silently — so the
     * user-agent `button` border survived and every sortable header rendered
     * as a boxed control sitting in the middle of a table header.
     */
    borderWidth: 0,
    borderStyle: "none",
    color: "inherit",
    fontFamily: font.body,
    fontSize: "inherit",
    fontWeight: "inherit",
    letterSpacing: "inherit",
    textAlign: "start",
    cursor: "pointer",
    transitionProperty: "color, background-color",
    transitionDuration: motionToken.fast,
    ":hover": {
      color: color.onSurface,
    },
    ":focus-visible": {
      outline: `2px solid ${color.focusRing}`,
      outlineOffset: "1px",
    },
  },
  triggerOpen: {
    backgroundColor: "rgba(1, 52, 5, 0.1)",
    color: color.onSurface,
  },
  glyph: {
    width: "0.8125rem",
    height: "0.8125rem",
    flexShrink: 0,
  },
  glyphIdle: {
    opacity: 0.45,
  },
  menu: {
    position: "absolute",
    insetBlockStart: "calc(100% + 2px)",
    insetInlineStart: `-${space["2xs"]}`,
    zIndex: 30,
    minWidth: "13rem",
    padding: space["3xs"],
    backgroundColor: color.surfaceRaised,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: radius.sm,
    boxShadow: shadow.md,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    width: "100%",
    paddingInline: space["2xs"],
    paddingBlock: space["2xs"],
    backgroundColor: "transparent",
    borderWidth: 0,
    borderStyle: "none",
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: font.sizeSm,
    textAlign: "start",
    cursor: "pointer",
    transitionProperty: "background-color",
    transitionDuration: motionToken.fast,
    ":hover": {
      backgroundColor: color.surfaceSunken,
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.45,
    },
    ":focus-visible": {
      outline: `2px solid ${color.focusRing}`,
      outlineOffset: "-2px",
    },
  },
  itemDisabled: {
    cursor: "not-allowed",
    opacity: 0.45,
  },
  itemGlyph: {
    width: "0.875rem",
    height: "0.875rem",
    flexShrink: 0,
  },
  separator: {
    marginBlock: space["3xs"],
    marginInline: space["2xs"],
    height: space.px,
    backgroundColor: color.border,
  },
});
