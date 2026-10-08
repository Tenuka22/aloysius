import * as stylex from "@stylexjs/stylex";
import type {
  Column,
  Header,
  ReactTable,
  RowData,
} from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, radius, space } from "../../tokens/tokens.stylex";
import type { listTableFeatures } from "./list-table-features";

/**
 * The placeholder pulse.
 *
 * Named as a bare string in `animationName` before, which meant the animation
 * simply never ran — there was no `@keyframes skeleton-pulse` anywhere in the
 * project — and every first paint of a list showed eight static grey bars.
 */
const skeletonPulse = stylex.keyframes({
  "0%": { opacity: 1 },
  "100%": { opacity: 0.35 },
});

/**
 * The frame every list table in this app is built in: a caption that names the
 * table and its slice, a real header, and a body that is one of four different
 * things depending on what is true.
 *
 * ## Why the four states are in here and not in each surface
 *
 * Loading, failed, filtered-empty and empty are four different facts. Rendered
 * loosely they collapse into one, and a request that 500s then reads "No records
 * yet" — a sentence about the school that is false, on a screen whose whole job is
 * to describe the school. So a surface passes its own words for the empty states and
 * gets the loading and failed ones for free, because those two are the same
 * everywhere and only ever were accidentally different.
 *
 * The loading state is a **real table with placeholder cells**, not a stack of grey
 * bars, because the header is rendered from the real column definitions: a loading
 * state that promises seven columns and then delivers six is the defect this
 * arrangement exists to prevent.
 *
 * ## Why the table type is not generic over its features
 *
 * It is typed against `listTableFeatures` — one concrete feature set for every list
 * in the app. A table typed as `ReactTable<TFeatures, TData>` with an unresolved
 * `TFeatures` exposes none of the feature APIs at all, because it cannot know whether
 * sorting or paging is one of them: `getIsSorted` and `getPageCount` simply
 * do not exist on that type. The row type stays generic, which is the part that
 * genuinely varies.
 */
export interface DataTableFrameProps<TData extends RowData> {
  table: ReactTable<typeof listTableFeatures, TData>;
  /** The table's accessible name, and where the slice on screen is announced. */
  caption: string;
  /** First read: no data at all, so the body is placeholders. */
  isLoading?: boolean;
  /** A refetch over rows already on screen. Announced, not hidden. */
  isFetching?: boolean;
  /** A failed read. Replaces the table entirely: a failure is not an empty list. */
  isError?: boolean;
  /** What to offer when the request failed. Usually a retry button. */
  errorContent?: ReactNode;
  /** What to show when there are no rows. Two surfaces-worth of words, per list. */
  emptyContent?: ReactNode;
  /** Placeholder rows on a first read, at this table's row height. */
  skeletonRows?: number;
}

const DEFAULT_SKELETON_ROWS = 8;

/**
 * `aria-sort` on the `<th>`, which is the only element allowed to carry it, and
 * only where the column can actually be sorted.
 *
 * A column that cannot be sorted is not "sorted by nothing" — it is not sorted at
 * all, and `none` would tell a screen-reader user the table has an order they can
 * change. So the attribute is absent for those columns.
 *
 * Generic in the column's value type because each accessor column has its own, and
 * none of them is the `unknown` a non-generic parameter would ask for.
 */
export const ariaSortFor = <TData extends RowData, TValue>(
  candidate: Column<typeof listTableFeatures, TData, TValue>
): "ascending" | "descending" | "none" | undefined => {
  if (!candidate.getCanSort()) {
    return undefined;
  }

  const sorted = candidate.getIsSorted();

  if (sorted === "asc") {
    return "ascending";
  }

  if (sorted === "desc") {
    return "descending";
  }

  return "none";
};

const SkeletonRows = ({
  columnCount,
  rows,
}: {
  columnCount: number;
  rows: number;
}) => (
  <>
    {Array.from({ length: rows }, (_unused, row) => (
      // The row index is the identity here on purpose: these are placeholders that
      // are never reordered, keyed or diffed.
      // oxlint-disable-next-line react/no-array-index-key -- static placeholder rows
      <tr key={`skeleton-row-${row}`} aria-hidden="true">
        {Array.from({ length: columnCount }, (_placeholder, cell) => (
          // oxlint-disable-next-line react/no-array-index-key -- static placeholder cells
          <td
            key={`skeleton-cell-${row}-${cell}`}
            {...stylex.props(styles.cell)}
          >
            <span aria-hidden="true" {...stylex.props(styles.skeleton)} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/**
 * One column's header, with the fallback that was missing.
 *
 * A column declares its own `header` only when the header is a *control* — today
 * that is `DataTableColumnHeader`, for a column the server can order by. For
 * everything else the name already lives in `columnDef.meta.label`, which
 * `listTableFeatures` declares as the app's one typed slot for it.
 *
 * Handing `flexRender` the column's `header` with nothing to fall back on is what
 * put `ACTORUSERNAME` in the audit trail's second column: no `header` of its own,
 * so the table rendered the raw accessor key and uppercased it. The same gap left
 * the target column, the queue's Decision column and both Controls columns
 * rendering *nothing at all* — a column with no name, which is unreadable for a
 * screen-reader user navigating cell by cell and easy to miss for a sighted one.
 *
 * Falling back to `meta.label` makes the declared slot load-bearing: a column
 * cannot leak its accessor key, and it cannot be shipped unlabelled by accident.
 *
 * ## The fallback's blind spot, and why it is not fixed here
 *
 * TanStack v9 does not carry `meta` onto a **`display`** column — only onto
 * accessor columns — so a display column with no `header` of its own still falls
 * through to nothing. The galleries list hit exactly this: its `Cover` column
 * rendered a thumbnail and a `NO COVER` pill under a header that said nothing,
 * and the next cell along sat under `STATUS` looking like the cover's own state.
 *
 * Making the frame reach into a feature it does not own is not the fix. The
 * honest one is for display columns to say their own name, as
 * `clubs-table`'s `actions` and `activity-table`'s `target` already do — which
 * they now do *because* the fallback made the accessor case safe enough that the
 * remaining gap is visible instead of silent.
 */
const renderHeader = <TData extends RowData>(
  header: Header<typeof listTableFeatures, TData, unknown>
) => {
  const { columnDef } = header.column;

  if (columnDef.header) {
    return flexRender(columnDef.header, header.getContext());
  }

  return columnDef.meta?.label ?? null;
};

export const DataTableFrame = <TData extends RowData>({
  table,
  caption,
  isLoading = false,
  isFetching = false,
  isError = false,
  errorContent,
  emptyContent,
  skeletonRows = DEFAULT_SKELETON_ROWS,
}: DataTableFrameProps<TData>) => {
  if (isError) {
    return <>{errorContent}</>;
  }

  const { rows } = table.getRowModel();
  const columnCount = table.getVisibleLeafColumns().length;

  /**
   * The body, as one of three things.
   *
   * An if-chain rather than a nested ternary in the markup, because the three are
   * three different screens and a reader should see all three side by side.
   */
  const renderBody = (): ReactNode => {
    if (isLoading) {
      return <SkeletonRows columnCount={columnCount} rows={skeletonRows} />;
    }

    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={columnCount} {...stylex.props(styles.emptyCell)}>
            {emptyContent}
          </td>
        </tr>
      );
    }

    return rows.map((row) => (
      <tr key={row.id} {...stylex.props(styles.row)}>
        {row.getVisibleCells().map((cell) => (
          <td key={cell.id} {...stylex.props(styles.cell)}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <div {...stylex.props(styles.frame)}>
      <table {...stylex.props(styles.table)}>
        {/*
          A `<caption>`, not an `aria-label`: the caption travels with the table
          when it is navigated cell by cell, which is the difference between "50" and
          "50 of 340 accounts". It is visually hidden because a visible caption above
          a dense records table is a second heading competing with the page's.
        */}
        <caption {...stylex.props(styles.caption)}>{caption}</caption>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => (
                <th
                  key={header.id}
                  aria-sort={ariaSortFor(header.column)}
                  scope="col"
                  {...stylex.props(
                    styles.head,
                    index === 0 ? styles.headGrow : styles.headNarrow
                  )}
                >
                  {header.isPlaceholder ? null : renderHeader(header)}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody aria-busy={isFetching}>{renderBody()}</tbody>
      </table>
    </div>
  );
};

const styles = stylex.create({
  /*
   * No border and no fill of its own.
   *
   * It sits inside a `Panel`, which is already `color.surface` with a hairline
   * border — so a second border here is a box drawn inside a box, and the
   * header band is the only thing in the frame that actually needs to read as
   * chrome. The horizontal scroll lives here and nowhere else, so a table that
   * is wider than its panel scrolls inside the panel instead of pushing it
   * wider.
   */
  frame: {
    overflowX: "auto",
    borderRadius: radius.sm,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: font.sizeSm,
  },
  caption: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
  /*
   * A calm band, not a banner.
   *
   * This was `surfaceInverse` with gold extrabold capitals. It was the loudest
   * thing on both admin screens — a near-black green bar with gold on it,
   * shouting over the page heading it is supposed to be subordinate to, and it
   * made every sortable column look like a warning. A sunken tint with muted
   * ink separates the header from the body just as well, and leaves the gold
   * and the crimson for things that are actually gold and actually alarming.
   *
   * `fontSize`/`fontWeight`/`letterSpacing` are `inherit` because the sort
   * control is a `<button>` inside the `<th>` and re-declaring them here is how
   * the two drifted apart in the first place.
   */
  head: {
    paddingInline: space.xs,
    paddingBlock: space["2xs"],
    backgroundColor: color.surfaceSunken,
    color: color.onSurfaceMuted,
    fontFamily: font.body,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    textAlign: "start",
    whiteSpace: "nowrap",
    // The one rule that says "everything below this is the data".
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.borderStrong,
  },
  /*
   * The first column is always the row's own title/description, and every
   * other column is a short, fixed-shape value (a pill, a date, a button) -
   * so the first column is the one asked to grow. Without this, `100%`-wide
   * table with five short header words spreads them evenly across the full
   * width, leaving the actual values stranded in wide gaps instead of read
   * next to their labels.
   */
  headGrow: {
    width: "auto",
  },
  /*
   * `width: 1%` is the standard trick for "shrink this column to its content":
   * browsers cannot honour 1% literally once the content is wider, so the
   * column collapses to its natural width and the remaining space in the
   * `100%` table goes to whichever column has no such constraint.
   *
   * `minWidth` is what keeps the trick from becoming a trap. Without a floor, a
   * row with more prose than the table can hold has its deficit distributed
   * across *every* `1%` column in proportion to their content — so the widest
   * prose column absorbs almost all of it and collapses to one word per line.
   * A prose cell becomes an unreadable ladder, and no amount of `max-width` on
   * the cell helps, because the column is being squeezed rather than the text.
   *
   * The floor is the point below which a cell stops being readable at all: a
   * pill, a short date, a count, or a two-word label. Anything longer than that
   * wants to be prose in the growing first column, not a column of its own.
   */
  headNarrow: {
    width: "1%",
    minWidth: "5.5rem",
  },
  row: {
    borderTopWidth: space.px,
    borderTopStyle: "solid",
    borderTopColor: color.border,
    transitionProperty: "background-color",
    ":hover": {
      backgroundColor: color.surfaceSunken,
    },
  },
  /*
   * `verticalAlign: middle` with the row's own line-height doing the work: the
   * two-line cells (a name over its slug, a target type over its id) stay
   * centred against the single-line ones instead of all sitting on one text
   * baseline, which is what made the audit rows look misaligned.
   */
  cell: {
    paddingInline: space.xs,
    paddingBlock: space["2xs"],
    color: color.onSurface,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    textAlign: "start",
    verticalAlign: "middle",
  },
  emptyCell: {
    padding: 0,
  },
  skeleton: {
    display: "block",
    width: "100%",
    maxWidth: "8rem",
    height: "0.875rem",
    backgroundColor: color.placeholder,
    animationName: {
      default: skeletonPulse,
      [bp.reducedMotion]: "none",
    },
    animationDuration: "1.4s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
    animationDirection: "alternate",
  },
});
