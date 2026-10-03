import * as stylex from "@stylexjs/stylex";
import type { ReactTable, RowData } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import {
  color,
  font,
  motionToken,
  radius,
  space,
} from "../../tokens/tokens.stylex";
import type { listTableFeatures } from "./list-table-features";

const styles = stylex.create({
  bar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.xs,
    color: color.onSurfaceMuted,
    fontFamily: font.body,
    fontSize: font.sizeXs,
  },
  count: {
    margin: 0,
    fontWeight: font.weightSemibold,
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.md,
  },
  group: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
  },
  label: {
    fontFamily: font.body,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    color: color.onSurface,
  },
  select: {
    minHeight: "2.25rem",
    paddingInline: space["2xs"],
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: radius.sm,
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: font.sizeSm,
    cursor: "pointer",
  },
  pageLabel: {
    fontWeight: font.weightBold,
    color: color.onSurface,
    whiteSpace: "nowrap",
  },
  pageButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.25rem",
    height: "2.25rem",
    backgroundColor: "transparent",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: radius.sm,
    color: color.onSurface,
    cursor: "pointer",
    touchAction: "manipulation",
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
      outlineOffset: "2px",
    },
  },
  glyph: {
    width: "1rem",
    height: "1rem",
  },
});
/** The slice of a list on screen, said in words as well as in buttons. */
const rangeText = (
  total: number,
  first: number,
  last: number,
  noun: string
) => {
  if (total === 0) {
    return `No ${noun}s`;
  }

  return `Showing ${first}–${last} of ${total} ${
    total === 1 ? noun : `${noun}s`
  }`;
};

/**
 * The page controls, which say exactly which slice of the list is on screen.
 *
 * The count is stated in words as well as in buttons, because a list that stops
 * silently at a cap reads as complete: a list showing every row and nothing more
 * looks finished, and an administrator managing a larger school saw a list that
 * looked finished when it was not.
 *
 * The page size is a select rather than a fixed number, because "50" chosen by the
 * code is a decision nobody made and nobody can change. It resets to the first page
 * in the same call as the new size, because a new size re-numbers every page and
 * page 6 of fifty rows is not page 6 of ten.
 */
export const DataTablePagination = <TData extends RowData>({
  id,
  noun,
  pageSizes,
  table,
  total,
}: {
  /** Namespaced per table by the caller, so two tables on a page do not collide. */
  id: string;
  /** What one row is called, for the count: "submission", "account", "entry". */
  noun: string;
  pageSizes: readonly number[];
  table: ReactTable<typeof listTableFeatures, TData>;
  /** The server's total for the filters in force, which is not the row count. */
  total: number;
}) => {
  const { pageIndex, pageSize } = table.state.pagination;
  const pageCount = table.getPageCount();
  const first = total === 0 ? 0 : pageIndex * pageSize + 1;
  const last = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div {...stylex.props(styles.bar)}>
      <p aria-live="polite" {...stylex.props(styles.count)}>
        {rangeText(total, first, last, noun)}
      </p>

      <div {...stylex.props(styles.controls)}>
        <div {...stylex.props(styles.group)}>
          <label htmlFor={`${id}-page-size`} {...stylex.props(styles.label)}>
            Rows per page
          </label>
          <select
            id={`${id}-page-size`}
            onChange={(event) => {
              table.setPagination({
                pageIndex: 0,
                pageSize: Number(event.target.value),
              });
            }}
            value={String(pageSize)}
            {...stylex.props(styles.select)}
          >
            {pageSizes.map((size) => (
              <option key={size} value={String(size)}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <span {...stylex.props(styles.pageLabel)}>
          Page {Math.min(pageIndex + 1, pageCount)} of {pageCount}
        </span>

        <div {...stylex.props(styles.group)}>
          <button
            aria-label="First page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => {
              table.firstPage();
            }}
            type="button"
            {...stylex.props(styles.pageButton)}
          >
            <ChevronsLeft aria-hidden="true" {...stylex.props(styles.glyph)} />
          </button>
          <button
            aria-label="Previous page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => {
              table.previousPage();
            }}
            type="button"
            {...stylex.props(styles.pageButton)}
          >
            <ChevronLeft aria-hidden="true" {...stylex.props(styles.glyph)} />
          </button>
          <button
            aria-label="Next page"
            disabled={!table.getCanNextPage()}
            onClick={() => {
              table.nextPage();
            }}
            type="button"
            {...stylex.props(styles.pageButton)}
          >
            <ChevronRight aria-hidden="true" {...stylex.props(styles.glyph)} />
          </button>
          <button
            aria-label="Last page"
            disabled={!table.getCanLastPage()}
            onClick={() => {
              table.lastPage();
            }}
            type="button"
            {...stylex.props(styles.pageButton)}
          >
            <ChevronsRight aria-hidden="true" {...stylex.props(styles.glyph)} />
          </button>
        </div>
      </div>
    </div>
  );
};
