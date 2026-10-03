import {
  EmptyState,
  Notice,
  Panel,
  PanelHead,
  Pill,
} from "@aloysius/ui/components/cms/cms-primitives";
import { DataTableColumnHeader } from "@aloysius/ui/components/data-table/data-table-column-header";
import { DataTableFrame } from "@aloysius/ui/components/data-table/data-table-frame";
import { DataTablePagination } from "@aloysius/ui/components/data-table/data-table-pagination";
import { DataTableSearchField } from "@aloysius/ui/components/data-table/data-table-search-field";
import {
  searchToPagination,
  searchToSorting,
} from "@aloysius/ui/components/data-table/list-search";
import { listTableFeatures } from "@aloysius/ui/components/data-table/list-table-features";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useId, useMemo } from "react";

import {
  describeActivity,
  formatAuditTime,
  submissionOutcome,
} from "@/components/admin/audit";
import type {
  ActivitySortKey,
  ClubActivityRow,
} from "@/components/tables/list-types";
import type { ListSearch } from "@/components/tables/queue-search";

/**
 * The audit trail, as a table.
 *
 * ## Read-only by construction
 *
 * There is no action column, and there is no prop through which to add one. An
 * audit trail is a record of what happened; a row that could approve or retry
 * something would be a second, quieter queue competing with the one place
 * decisions are made. The two screens that show it — the admin overview and a
 * single club's page — read it for the same reason, and neither of them decides
 * anything here.
 *
 * Search, order and page are the server's, reached through the URL by the shared
 * list contract, so this component is handed one page of rows and a total with
 * both `manual*` flags set.
 *
 * `actorUsername` and the target are deliberately **not** sortable: the server
 * merges three tables and sorts two of them alphabetically, so a header offering
 * a third order would be a control that quietly does not order anything. The
 * search box still reaches both, because filtering them is honest.
 */

const PAGE_SIZES = [10, 25, 50, 100] as const;

const styles = stylex.create({
  filters: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: space.sm,
  },
  actionCell: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space["2xs"],
  },
  actor: {
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    color: color.onSurface,
  },
  target: {
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
    textTransform: "capitalize",
  },
  timestamp: {
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
    whiteSpace: "nowrap",
  },
});

const columnHelper = createColumnHelper<
  typeof listTableFeatures,
  ClubActivityRow
>();

const buildColumns = () => [
  columnHelper.accessor("action", {
    id: "action",
    meta: { label: "Action" },
    header: (header) => (
      <DataTableColumnHeader
        label={header.column.columnDef.meta?.label ?? header.column.id}
        onSort={(direction) => {
          header.column.toggleSorting(direction === "desc");
        }}
        sorted={header.column.getIsSorted()}
      />
    ),
    cell: (cell) => {
      const outcome = submissionOutcome(cell.getValue());

      return (
        <span {...stylex.props(styles.actionCell)}>
          <span>{describeActivity(cell.getValue())}</span>
          {outcome ? <Pill tone={outcome.tone}>{outcome.label}</Pill> : null}
        </span>
      );
    },
  }),
  columnHelper.accessor("actorUsername", {
    id: "actor",
    meta: { label: "Who" },
    enableSorting: false,
    cell: (cell) => (
      <span {...stylex.props(styles.actor)}>
        {cell.getValue() ? `@${cell.getValue()}` : "Club portal"}
      </span>
    ),
  }),
  columnHelper.display({
    id: "target",
    meta: { label: "Target" },
    enableSorting: false,
    cell: (cell) => {
      const { targetId, targetType } = cell.row.original;

      return (
        <span {...stylex.props(styles.target)}>
          {targetType.replaceAll("_", " ")}
          {targetId ? ` · ${targetId}` : ""}
        </span>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    meta: { label: "When" },
    header: (header) => (
      <DataTableColumnHeader
        label={header.column.columnDef.meta?.label ?? header.column.id}
        onSort={(direction) => {
          header.column.toggleSorting(direction === "desc");
        }}
        sorted={header.column.getIsSorted()}
      />
    ),
    cell: (cell) => (
      <time
        dateTime={new Date(cell.getValue()).toISOString()}
        {...stylex.props(styles.timestamp)}
      >
        {formatAuditTime(cell.getValue())}
      </time>
    ),
  }),
];

export interface ActivityTableProps {
  rows: readonly ClubActivityRow[];
  total: number;
  /** What the table shows, as the URL says. Already validated by the route. */
  search: ListSearch<ActivitySortKey>;
  onSearchChange: (value: string) => void;
  onSortingChange: OnChangeFn<SortingState>;
  onPaginationChange: OnChangeFn<PaginationState>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  /** Names what the trail belongs to, for the panel and the caption. */
  title: string;
  note: string;
  emptyTitle: string;
  emptyNote: string;
}

export const ActivityTable = ({
  rows,
  total,
  search,
  onSearchChange,
  onSortingChange,
  onPaginationChange,
  isLoading,
  isFetching,
  isError,
  title,
  note,
  emptyTitle,
  emptyNote,
}: ActivityTableProps) => {
  const ids = useId();

  /*
   * `as never`, the same escape `queue-table.tsx` takes: the column helper
   * produces a union over every column-definition shape, and `useTable` takes the
   * union of those unions, which only lines up once both have been widened the
   * same way. The definitions are checked on the way in either way.
   */
  const columns = useMemo(() => buildColumns(), []) as never;

  const table = useTable({
    features: listTableFeatures,
    columns,
    data: isLoading || isError ? [] : rows,
    getRowId: (row) => row.id,
    rowCount: total,
    manualPagination: true,
    manualSorting: true,
    enableRowSelection: false,
    state: {
      pagination: searchToPagination(search),
      sorting: searchToSorting(search),
    },
    onPaginationChange,
    onSortingChange,
  });

  return (
    <Panel>
      <PanelHead eyebrow="Audit trail" note={note} title={title} />

      <div {...stylex.props(styles.filters)}>
        <DataTableSearchField
          id={`${ids}-search`}
          label="Search actions"
          onCommit={onSearchChange}
          placeholder="Action, person, or target"
          value={search.q}
        />
      </div>

      {isError ? (
        <Notice tone="danger">
          The audit trail could not be loaded. Reload the page to try again.
        </Notice>
      ) : null}

      <DataTableFrame
        caption={`${title}. ${total} recorded.`}
        emptyContent={<EmptyState note={emptyNote} title={emptyTitle} />}
        isError={isError}
        isFetching={isFetching}
        isLoading={isLoading}
        skeletonRows={5}
        table={table}
      />

      {isError ? null : (
        <DataTablePagination
          id={ids}
          noun="entry"
          pageSizes={PAGE_SIZES}
          table={table}
          total={total}
        />
      )}
    </Panel>
  );
};
