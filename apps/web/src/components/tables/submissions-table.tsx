import {
  CmsButton,
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
import { listTableFeatures } from "@aloysius/ui/components/data-table/list-table-features";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useId, useMemo } from "react";

import {
  describeTarget,
  operationTone,
  relativeDay,
  titleFromPayload,
} from "@/components/club/format";
import { orpc } from "@/utils/orpc";

import type { SubmissionRow } from "./list-types";

/**
 * A club's own submissions for one screen, as a table.
 *
 * Same kit and the same URL contract as the review queue — search, sort and
 * paging are the server's, the route's loader fetched the page, and the table
 * owns nothing beyond the withdraw action. Where the review queue decides a
 * row, this table only lets the sender take it back: `target` is fixed by the
 * caller (this is *this* screen's submissions, not every screen's), so the
 * columns describe operation and status rather than which target a row is.
 */
const columnHelper = createColumnHelper<
  typeof listTableFeatures,
  SubmissionRow
>();

const PAGE_SIZES = [10, 25, 50, 100] as const;

interface WithdrawMutations {
  club: UseMutationResult<unknown, Error, { submissionId: string }>;
  global: UseMutationResult<unknown, Error, { submissionId: string }>;
}

const buildColumns = ({ club, global }: WithdrawMutations) => [
  columnHelper.accessor((row) => titleFromPayload(row.payload), {
    id: "title",
    meta: { label: "Submission" },
    enableSorting: false,
    cell: (cell) => cell.getValue() || "Untitled",
  }),
  columnHelper.accessor((row) => describeTarget(row.target), {
    id: "target",
    meta: { label: "Where" },
    enableSorting: false,
    cell: (cell) => cell.getValue(),
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
    meta: { label: "" },
    enableSorting: false,
    cell: (cell) => {
      const row = cell.row.original;
      const mutation = row.scope === "club" ? club : global;
      const busy =
        mutation.isPending && mutation.variables?.submissionId === row.id;
      return (
        <CmsButton
          disabled={busy}
          onClick={() => {
            mutation.mutate({ submissionId: row.id });
          }}
          tone="danger"
        >
          {busy ? "Withdrawing…" : "Withdraw"}
        </CmsButton>
      );
    },
  }),
];

export interface SubmissionsTableProps {
  rows: readonly SubmissionRow[];
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
  emptyTitle: string;
  emptyNote: string;
}

export const SubmissionsTable = ({
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
  emptyTitle,
  emptyNote,
}: SubmissionsTableProps) => {
  const ids = useId();
  const queryClient = useQueryClient();

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: orpc.clubs.listMySubmissions.key(),
    });
  };

  const withdraw = useMutation(
    orpc.clubs.withdrawClubSubmission.mutationOptions({ onSuccess: refresh })
  );
  const withdrawGlobal = useMutation(
    orpc.clubs.withdrawGlobalSubmission.mutationOptions({ onSuccess: refresh })
  );

  const columns = useMemo(
    () => buildColumns({ club: withdraw, global: withdrawGlobal }),
    [withdraw, withdrawGlobal]
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

  return (
    <Panel>
      <PanelHead
        eyebrow="Queue"
        note={`${total} waiting. Withdraw a submission to pull it back before a CMS editor decides it.`}
        title="Awaiting review"
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "flex-end",
        }}
      >
        <DataTableSearchField
          id={`${ids}-search`}
          onCommit={onSearchChange}
          placeholder="Title"
          value={search}
        />
      </div>

      {isError ? (
        <Notice tone="danger">
          Your submissions could not be loaded. Reload the page to try again.
        </Notice>
      ) : null}

      <DataTableFrame
        caption={`Your pending submissions. ${total} waiting.`}
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
          noun="submission"
          pageSizes={PAGE_SIZES}
          table={table}
          total={total}
        />
      )}
    </Panel>
  );
};
