import * as stylex from "@stylexjs/stylex";
import type { ReactTable, RowData } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  color,
  font,
  motionToken,
  radius,
  shadow,
  space,
} from "../../tokens/tokens.stylex";
import type { listTableFeatures } from "./list-table-features";

/** Matches `DataTableSearchField` and `Field`, so a filter row and this trigger line up. */
const CONTROL_HEIGHT = "2.75rem";

const styles = stylex.create({
  root: {
    position: "relative",
    display: "inline-flex",
  },
  trigger: {
    display: "inline-flex",
    alignItems: "center",
    gap: space["2xs"],
    minHeight: CONTROL_HEIGHT,
    paddingInline: space.sm,
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: radius.sm,
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: font.sizeXs,
    cursor: "pointer",
    touchAction: "manipulation",
    transitionProperty: "background-color, border-color",
    transitionDuration: motionToken.fast,
    ":hover": {
      backgroundColor: color.surfaceSunken,
      borderColor: color.borderStrong,
    },
    ":focus-visible": {
      outline: `2px solid ${color.focusRing}`,
      outlineOffset: "2px",
    },
  },
  glyph: {
    width: "1rem",
    height: "1rem",
  },
  menu: {
    position: "absolute",
    insetBlockStart: `calc(${CONTROL_HEIGHT} + ${space["2xs"]})`,
    insetInlineEnd: 0,
    zIndex: 20,
    minWidth: "13rem",
    maxHeight: "20rem",
    overflowY: "auto",
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: radius.sm,
    boxShadow: shadow.md,
    paddingBlock: space["2xs"],
  },
  label: {
    paddingInline: space.sm,
    paddingBlock: space["2xs"],
    fontFamily: font.body,
    fontSize: font.sizeXs,
    fontWeight: font.weightSemibold,
    color: color.onSurfaceMuted,
  },
  separator: {
    marginBlock: space["2xs"],
    borderBlockStart: `${space.px} solid ${color.border}`,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: space.xs,
    width: "100%",
    paddingInline: space.sm,
    paddingBlock: space["2xs"],
    fontFamily: font.body,
    fontSize: font.sizeXs,
    color: color.onSurface,
    cursor: "pointer",
    ":hover": {
      backgroundColor: color.surfaceSunken,
    },
  },
  checkbox: {
    cursor: "pointer",
  },
});

/**
 * The Columns menu: which columns are on screen.
 *
 * The one piece of table state that is **the client's own** and never reaches the
 * server, because which columns an administrator can see is a property of their
 * screen and not of the school. It is deliberately not in the URL: a shared link
 * that also hid the status column would show a different table to the person it
 * was sent to, and `?columns=name,email` is a param nobody reads.
 *
 * The labels come from each column's `meta.label` rather than its id, for the same
 * reason the sort headers take a label: a menu offering `createdAt` and
 * `employmentStatus` is a list of implementation details wearing a menu's clothes.
 * A column that hides a value somebody needs should be hidden by somebody who
 * chose to, not by a default.
 *
 * Built on a native button + absolutely-positioned panel, in the pattern the
 * workspace's own `CustomSelect` (`cms-primitives.tsx`) already uses, rather than
 * a menu library: the panel closes on an outside pointerdown and on `Escape`, the
 * same two ways every other menu in this app closes.
 */
export const DataTableViewOptions = <TData extends RowData>({
  table,
}: {
  table: ReactTable<typeof listTableFeatures, TData>;
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const close = () => {
      setOpen(false);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // One pass, then one map: a `.filter().map()` chain walks the columns twice.
  const hideableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanHide());

  return (
    <div ref={rootRef} {...stylex.props(styles.root)}>
      <button
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Choose which columns to show"
        onClick={() => {
          setOpen((previous) => !previous);
        }}
        type="button"
        {...stylex.props(styles.trigger)}
      >
        <Settings2 aria-hidden="true" {...stylex.props(styles.glyph)} />
        Columns
      </button>

      {open ? (
        <div
          aria-label="Columns"
          data-lenis-prevent
          role="menu"
          {...stylex.props(styles.menu)}
        >
          <p {...stylex.props(styles.label)}>Columns</p>
          <div {...stylex.props(styles.separator)} />
          {hideableColumns.map((column) => (
            <label key={column.id} {...stylex.props(styles.item)}>
              <input
                checked={column.getIsVisible()}
                onChange={(event) => {
                  column.toggleVisibility(event.target.checked);
                }}
                type="checkbox"
                {...stylex.props(styles.checkbox)}
              />
              {column.columnDef.meta?.label ?? column.id}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
};
