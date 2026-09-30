import {
  CmsButton,
  EmptyState,
  Notice,
  Panel,
  PanelHead,
  Pill,
} from "@aloysius/ui/components/cms/cms-primitives";
import { DataTableFrame } from "@aloysius/ui/components/data-table/data-table-frame";
import { DataTableColumnHeader } from "@aloysius/ui/components/data-table/data-table-column-header";
import { DataTablePagination } from "@aloysius/ui/components/data-table/data-table-pagination";
import { DataTableSearchField } from "@aloysius/ui/components/data-table/data-table-search-field";
import { listTableFeatures } from "@aloysius/ui/components/data-table/list-table-features";
import { useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useId, useMemo, useState } from "react";

import {
  describeTarget,
  operationTone,
  relativeDay,
  titleFromPayload,
} from "@/components/club/format";
import { ReviewCard } from "@/components/club/review";

import type { QueueRow } from "./list-types";

/**
 * The pending-submissions table, shared by /cms/clubs and the photography page.
 *
 * Search, sort and paging are the **server's**: they live in the URL, the route's
 * loader fetched the page before it was sent, and the table is handed one page of
 * rows and a total with both `manual*` flags set. The table owns nothing — and
 * column visibility was dropped from this kit deliberately, because every column
 * here is part of the review decision and a column a reviewer could hide is a
 * fact about a submission they could approve without seeing.
 *
 * The row's action is **Review**, and it opens the decision card for that row
 * below the table. The card is where approve, reject and edit-payload live, and
 * it is the same card the old queue rendered inline for every row — one card per
 * page, opened on purpose, is what stops a long queue becoming a scroll of
 * approve buttons that all look armed at once.
 *
 * `getRowId` returns the submission id with its scope, so a row key is stable
 * across a page change and the opened card is diffable by React.
 */
const columnHelper =
  createColumnHelper<typeof listTableFeatures, QueueRow>();

const PAGE_SIZES = [10, 25, 50, 100] as const;

const buildColumns = (onReview: (row: QueueRow) => void) => [
  columnHelper.accessor(
    (row) => titleFromPayload(row.payload),
    {
      id: "title",
      meta: { label: "Submission" },
      enableSorting: false,
      cell: (cell) => (
        <>
          <strong>{cell.getValue() || "Untitled"}</strong>
          <span style={{ display: "block", opacity: 0.7 }}>
            {describeTarget(cell.row.original.target)}
          </span>
        </>
      ),
    }
  ),
  columnHelper.accessor("clubName", {
    id: "club",
    meta: { label: "Club" },
    enableSorting: false,
    cell: (cell) => cell.getValue() ?? "—",
  }),
  columnHelper.accessor("operation", {
    id: "operation",
    meta: { label: "Change" },
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
      <Pill tone={operationTone(cell.getValue())}>{cell.getValue()}</Pill>
    ),
  }),
  columnHelper.accessor("submittedAt", {
    id: "submittedAt",
    meta: { label: "Sent" },
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
      <span style={{ whiteSpace: "nowrap" }}>
        {relativeDay(cell.getValue())}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    meta: { label: "Decision" },
    cell: (cell) => (
      <CmsButton
        onClick={() => {
          onReview(cell.row.original);
        }}
        tone="primary"
      >
        Review
      </CmsButton>
    ),
    enableSorting: false,
  }),
];

export interface QueueTableProps {
  rows: readonly QueueRow[];
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
  onDecided: (message: string) => void;
  emptyTitle: string;
  emptyNote: string;
  /** Which page of rows a decision refreshes; the caller names its procedure. */
  refreshKeys: readonly (readonly unknown[])[];
}

export const QueueTable = ({
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
  onDecided,
  emptyTitle,
  emptyNote,
  refreshKeys,
}: QueueTableProps) => {
  const ids = useId();
  const queryClient = useQueryClient();
  const [reviewing, setReviewing] = useState<QueueRow | null>(null);

  const columns = useMemo(
    () => buildColumns((row) => setReviewing(row)),
    []
  ) as never;

  const table = useTable({
    features: listTableFeatures,
    columns,
    data: isLoading || isError ? [] : rows,
    getRowId: (row) => `${row.scope}-${row.id}`,
    rowCount: total,
    manualPagination: true,
    manualSorting: true,
    enableRowSelection: false,
    state: { pagination, sorting },
    onPaginationChange,
    onSortingChange,
  });

  /*
   * A decision leaves the row pending no longer, so the opened card is closed
   * and every page of the queue is re-read: the review may have happened on
   * page 3, but the queue the reviewer came from was filtered by the same
   * decision, and a stale count is what makes them doubt the approval took.
   */
  const onDecidedAndClose = async (message: string) => {
    onDecided(message);
    await Promise.all(
      refreshKeys.map((key) =>
        queryClient.invalidateQueries({ queryKey: [...key] })
      )
    );
    setReviewing(null);
  };

  return (
    <>
      <Panel>
        <PanelHead
          eyebrow="Queue"
          note={`${total} waiting. Open a row to decide it; the decision card appears below the table.`}
          title="Pending submissions"
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          <DataTableSearchField
            id={`${ids}-search`}
            onCommit={onSearchChange}
            placeholder="Title, club, or target"
            value={search}
          />
        </div>

        {isError ? (
          <Notice tone="danger">
            The queue could not be loaded. Reload the page to try again.
          </Notice>
        ) : null}

        <DataTableFrame
          caption={`Pending submissions. ${total} waiting.`}
          emptyContent={
            <EmptyState note={emptyNote} title={emptyTitle} />
          }
          isError={isError}
          isFetching={isFetching}
          isLoading={isLoading}
          skeletonRows={5}
          table={table}
        />

        {!isError ? (
          <DataTablePagination
            id={ids}
            noun="submission"
            pageSizes={PAGE_SIZES}
            table={table}
            total={total}
          />
        ) : null}
      </Panel>

      {reviewing ? (
        <ReviewCard
          key={`${reviewing.scope}-${reviewing.id}`}
          onDecided={onDecidedAndClose}
          row={reviewing}
        />
      ) : null}
    </>
  );
};
