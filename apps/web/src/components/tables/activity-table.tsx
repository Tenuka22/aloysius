import {
  EmptyState,
  Notice,
  Panel,
  PanelHead,
} from "@aloysius/ui/components/cms/cms-primitives";
import { DataTableFrame } from "@aloysius/ui/components/data-table/data-table-frame";
import { DataTableColumnHeader } from "@aloysius/ui/components/data-table/data-table-column-header";
import { DataTablePagination } from "@aloysius/ui/components/data-table/data-table-pagination";
import { DataTableSearchField } from "@aloysius/ui/components/data-table/data-table-search-field";
import { listTableFeatures } from "@aloysius/ui/components/data-table/list-table-features";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useId, useMemo } from "react";

import { relativeDay } from "@/components/club/format";

import type { ActivityRow } from "./list-types";

/**
 * The activity trail, as a table.
 *
 * The same kit and the same URL contract as the queue table: search, sort and
 * paging are the server's, the route's loader fetched the page, and the table
 * owns nothing. Where the queue's rows act, this table's rows only describe —
 * an audit trail is history, and history has no buttons.
 *
 * `titleOf` is handed in rather than derived here because the two surfaces that
 * show this trail name an entry differently (the photography page reads the
 * stored payload; the general accounts page reads the action alone), and the
 * table should not own either decision.
 */
const columnHelper =
  createColumnHelper<typeof listTableFeatures, ActivityRow>();

const PAGE_SIZES = [10, 25, 50, 100] as const;

const buildColumns = (titleOf: (entry: ActivityRow) => string) => [
  columnHelper.accessor(
    (entry) => titleOf(entry),
    {
      id: "title",
      meta: { label: "What" },
      enableSorting: false,
      cell: (cell) => cell.getValue() || "—",
    }
  ),
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
    cell: (cell) => cell.getValue(),
  }),
  columnHelper.accessor("actorUsername", {
    id: "actor",
    meta: { label: "Who" },
    enableSorting: false,
    cell: (cell) => {
      const entry = cell.row.original;
      return entry.actorUsername
        ? `@${entry.actorUsername}`
        : (entry.actorRole ?? "system");
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
      <span style={{ whiteSpace: "nowrap" }}>{relativeDay(cell.getValue())}</span>
    ),
  }),
];

export interface ActivityTableProps {
  rows: readonly ActivityRow[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  /** The one row of a table, in the words the surface names it: "entry", "account". */
  noun: string;
  emptyTitle: string;
  emptyNote: string;
  titleOf: (entry: ActivityRow) => string;
}
// eslint note: `onDecided` was removed from this table on purpose - history has no buttons.

export const ActivityTable = ({
  rows,
  total,
  isLoading,
  isFetching,
  isError,
  search,
  onSearchChange,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  noun,
  emptyTitle,
  emptyNote,
  titleOf,
}: ActivityTableProps) => {
  const ids = useId();

  const columns = useMemo(
    () => buildColumns(titleOf),
    [titleOf]
  ) as never;

  const table = useTable({
    features: listTableFeatures,
    columns,
    data: isLoading || isError ? [] : rows,
    getRowId: (row) => row.id,
    rowCount: total,
    manualPagination: true,
    manualSorting: true,
    enableRowSelection: false,
    state: { pagination, sorting },
    onPaginationChange,
    onSortingChange,
  });

  return (
    <Panel>
      <PanelHead
        eyebrow="History"
        note="Credentials changed and submissions decided, newest first."
        title="Activity"
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
        <DataTableSearchField
          id={`${ids}-search`}
          onCommit={onSearchChange}
          placeholder="Action, actor, or target"
          value={search}
        />
      </div>

      {isError ? (
        <Notice tone="danger">
          The activity trail could not be loaded. Reload the page to try again.
        </Notice>
      ) : null}

      <DataTableFrame
        caption={`Administrator activity. ${total} ${noun}s.`}
        emptyContent={<EmptyState note={emptyNote} title={emptyTitle} />}
        isError={isError}
        isFetching={isFetching}
        isLoading={isLoading}
        skeletonRows={5}
        table={table}
      />

      {!isError ? (
        <DataTablePagination
          id={ids}
          noun={noun}
          pageSizes={PAGE_SIZES}
          table={table}
          total={total}
        />
      ) : null}
    </Panel>
  );
};
