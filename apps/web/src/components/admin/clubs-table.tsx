import {
  CmsButton,
  EmptyState,
  Field,
  Notice,
  Panel,
  PanelHead,
  Pill,
} from "@aloysius/ui/components/cms/cms-primitives";
import type { PillTone } from "@aloysius/ui/components/cms/cms-primitives";
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
import { useNavigate } from "@tanstack/react-router";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useId, useMemo } from "react";

import { formatAuditTime } from "@/components/admin/audit";
import {
  CLUB_ACCOUNT_OPTIONS,
  CLUB_STATUS_OPTIONS,
} from "@/components/admin/club-list-search";
import type {
  ClubAccountFilter,
  ClubListSearch,
  ClubStatusFilter,
} from "@/components/admin/club-list-search";
import type { ClubAccountRow } from "@/components/tables/list-types";

/**
 * The club accounts table: one row per configured club, and the state of the one
 * administrator account that runs it.
 *
 * ## What is the server's and what is this component's
 *
 * Search, both filters, the order and the page all live in the URL; the route's
 * loader fetched the page before it was sent; and the table is handed one page of
 * rows plus a total with both `manual*` flags set. The table owns nothing. That
 * arrangement is the only one in which all three of these are true at once: the
 * server has been told, the rows cannot be reordered behind the filter's back,
 * and a refresh, a shared link and the Back button all arrive on the same page.
 *
 * The row action is **Manage**, and it opens that club's own screen rather than
 * expanding the row here. Per-club controls — the password, the ban, that club's
 * actions — are a second page's worth of state, and a table row that grows a
 * password field is a table row with two jobs.
 *
 * `getRowId` returns the club id, so a row key is stable across a page change and
 * across the account being created underneath it.
 */

const PAGE_SIZES = [10, 25, 50, 100] as const;

const styles = stylex.create({
  filters: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: space.sm,
  },
  clubCell: {
    display: "grid",
    gap: space["3xs"],
  },
  clubName: {
    fontFamily: font.display,
    fontSize: font.sizeSm,
    fontWeight: font.weightSemibold,
    color: color.onSurface,
  },
  clubMeta: {
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
  },
  timestamp: {
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
    whiteSpace: "nowrap",
  },
  count: {
    fontFamily: font.mono,
    fontVariantNumeric: "tabular-nums",
  },
});

/**
 * The account column's label and tone.
 *
 * A pill rather than a word, because "the club's editor can sign in" is the one
 * thing on this row an administrator scans for, and it is the difference between
 * a club that is running and a club that has nobody to run it.
 */
const ACCOUNT_STATE: Record<
  "provisioned" | "banned",
  { label: string; tone: PillTone }
> = {
  provisioned: { label: "Can sign in", tone: "positive" },
  banned: { label: "Banned", tone: "danger" },
};

const accountState = (row: ClubAccountRow) => {
  if (row.banned) {
    return ACCOUNT_STATE.banned;
  }
  if (!row.provisioned) {
    return { label: "No account yet", tone: "warning" as const };
  }
  return ACCOUNT_STATE.provisioned;
};

/**
 * The waiting count, said in words when there is nothing waiting.
 *
 * A bare `0` in a column of numbers reads as "not measured" next to a `3`, and
 * "— costs an administrator one extra look per row to find out what it means".
 */
const waitingOf = (row: ClubAccountRow) =>
  row.pendingClubSubmissions + row.pendingGlobalSubmissions;

/**
 * The three states the account column may hold, as the values it sorts by.
 *
 * Spelled from the row rather than from `accountState`, because that one returns
 * a label and a tone - a shape no column header can order by.
 */
const accountSortValue = (row: ClubAccountRow) => {
  if (row.banned) {
    return "banned";
  }
  return row.provisioned ? "provisioned" : "none";
};

const columnHelper = createColumnHelper<
  typeof listTableFeatures,
  ClubAccountRow
>();

const buildColumns = (onManage: (clubId: string) => void) => [
  columnHelper.accessor("name", {
    id: "name",
    meta: { label: "Club" },
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
      <span {...stylex.props(styles.clubCell)}>
        <span {...stylex.props(styles.clubName)}>{cell.getValue()}</span>
        <span {...stylex.props(styles.clubMeta)}>
          /{cell.row.original.slug}
        </span>
      </span>
    ),
  }),
  columnHelper.accessor("adminUsername", {
    id: "adminUsername",
    meta: { label: "Administrator" },
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
      <span {...stylex.props(styles.clubMeta)}>@{cell.getValue()}</span>
    ),
  }),
  /*
   * An accessor on a derived value rather than a plain display column, because
   * this column is sortable: its id has to be the server's `account` sort key or
   * the header would sort nothing.
   */
  columnHelper.accessor(accountSortValue, {
    id: "account",
    meta: { label: "Account" },
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
      const state = accountState(cell.row.original);

      return <Pill tone={state.tone}>{state.label}</Pill>;
    },
  }),
  columnHelper.accessor("status", {
    id: "status",
    meta: { label: "Status" },
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
      <Pill tone={cell.getValue() === "active" ? "neutral" : "warning"}>
        {cell.getValue() === "active" ? "Active" : "Archived"}
      </Pill>
    ),
  }),
  columnHelper.accessor((row) => waitingOf(row), {
    id: "pendingSubmissions",
    meta: { label: "Waiting" },
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
      <span {...stylex.props(styles.count)}>
        {cell.getValue() === 0 ? "—" : cell.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("lastActivityAt", {
    id: "lastActivityAt",
    meta: { label: "Last activity" },
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
      const value = cell.getValue();

      return value ? (
        <time
          dateTime={new Date(value).toISOString()}
          {...stylex.props(styles.timestamp)}
        >
          {formatAuditTime(value)}
        </time>
      ) : (
        <span {...stylex.props(styles.timestamp)}>Never</span>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    meta: { label: "Controls" },
    enableSorting: false,
    cell: (cell) => (
      <CmsButton
        onClick={() => {
          onManage(cell.row.original.id);
        }}
        tone="quiet"
      >
        Manage
      </CmsButton>
    ),
  }),
];

export interface ClubsTableProps {
  rows: readonly ClubAccountRow[];
  total: number;
  search: ClubListSearch;
  onSearchChange: (value: string) => void;
  onSortingChange: OnChangeFn<SortingState>;
  onPaginationChange: OnChangeFn<PaginationState>;
  onStatusChange: (value: ClubStatusFilter) => void;
  onAccountChange: (value: ClubAccountFilter) => void;
  onResetFilters: () => void;
  hasFilters: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

export const ClubsTable = ({
  rows,
  total,
  search,
  onSearchChange,
  onSortingChange,
  onPaginationChange,
  onStatusChange,
  onAccountChange,
  onResetFilters,
  hasFilters,
  isLoading,
  isFetching,
  isError,
}: ClubsTableProps) => {
  const ids = useId();
  const navigate = useNavigate();

  const columns = useMemo(
    () =>
      buildColumns((clubId) => {
        void navigate({ to: "/admin/clubs/$clubId", params: { clubId } });
      }),
    [navigate]
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
    state: {
      pagination: searchToPagination(search),
      sorting: searchToSorting(search),
    },
    onPaginationChange,
    onSortingChange,
  });

  return (
    <Panel>
      <PanelHead
        eyebrow="Club registry"
        note={`${total} ${total === 1 ? "club" : "clubs"}. Open a club to manage its password, its access, and everything it has done.`}
        title="Clubs and their administrators"
      />

      <div {...stylex.props(styles.filters)}>
        <DataTableSearchField
          id={`${ids}-search`}
          onCommit={onSearchChange}
          placeholder="Club name, slug, or handle"
          value={search.q}
        />

        <Field
          kind="select"
          label="Status"
          onChange={(next) => {
            onStatusChange(next as ClubStatusFilter);
          }}
          options={CLUB_STATUS_OPTIONS.map((option) => ({
            label: option.label,
            value: option.value,
          }))}
          value={search.status}
        />

        <Field
          kind="select"
          label="Account"
          onChange={(next) => {
            onAccountChange(next as ClubAccountFilter);
          }}
          options={CLUB_ACCOUNT_OPTIONS.map((option) => ({
            label: option.label,
            value: option.value,
          }))}
          value={search.account}
        />

        {hasFilters ? (
          <CmsButton onClick={onResetFilters} tone="quiet">
            Clear filters
          </CmsButton>
        ) : null}
      </div>

      {isError ? (
        <Notice tone="danger">
          The club list could not be loaded. Reload the page to try again.
        </Notice>
      ) : null}

      <DataTableFrame
        caption={`Clubs and their administrator accounts. ${total} listed.`}
        emptyContent={
          <EmptyState
            note={
              hasFilters
                ? "Loosen the filters, or clear them, to see the rest of the registry."
                : "A club appears here once it is added to the club configuration."
            }
            title={
              hasFilters ? "No club matches these filters." : "No clubs yet."
            }
          />
        }
        isError={isError}
        isFetching={isFetching}
        isLoading={isLoading}
        skeletonRows={5}
        table={table}
      />

      {isError ? null : (
        <DataTablePagination
          id={ids}
          noun="club"
          pageSizes={PAGE_SIZES}
          table={table}
          total={total}
        />
      )}
    </Panel>
  );
};
