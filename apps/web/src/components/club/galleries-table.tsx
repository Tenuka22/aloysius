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
import {
  searchToPagination,
  searchToSorting,
} from "@aloysius/ui/components/data-table/list-search";
import { listTableFeatures } from "@aloysius/ui/components/data-table/list-table-features";
import { MediaThumb } from "@aloysius/ui/components/primitives/media-frame";
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

import { relativeDay } from "@/components/club/format";
import type {
  GalleryRow,
  GallerySortKey,
} from "@/components/tables/list-types";
import type { ListSearch } from "@/components/tables/queue-search";

const PAGE_SIZES = [10, 25, 50, 100] as const;

const styles = stylex.create({
  galleryCell: {
    display: "grid",
    gap: space["3xs"],
  },
  galleryName: {
    fontFamily: font.display,
    fontSize: font.sizeSm,
    fontWeight: font.weightSemibold,
    color: color.onSurface,
  },
  galleryMeta: {
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
  },
  about: {
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
  },
  count: {
    fontFamily: font.mono,
    fontVariantNumeric: "tabular-nums",
  },
});

/**
 * What a gallery is, in one line under its title.
 *
 * Three facts a club administrator needs before clicking into a gallery, because
 * all three are the reason a gallery is not finished: how many photographs it
 * has, whether anyone can be sent to the full album off-site, and what it is
 * about. A list that only showed a count left "is this the one?" unanswerable
 * without opening every gallery.
 */
const describeGallery = (gallery: GalleryRow) => {
  const parts = [
    gallery.albumUrl ? "Full album off-site" : "No off-site album",
  ];

  if (gallery.links.length === 0) {
    parts.push("Not linked to anything");
  } else {
    const named = gallery.links
      .map((link) => link.targetTitle)
      .filter((title): title is string => title !== null);
    parts.push(
      named.length > 0
        ? `About ${named.join(", ")}`
        : `${gallery.links.length} broken link${gallery.links.length === 1 ? "" : "s"}`
    );
  }

  return gallery.summary
    ? `${gallery.summary} — ${parts.join(" · ")}`
    : parts.join(" · ");
};

const columnHelper = createColumnHelper<typeof listTableFeatures, GalleryRow>();

const buildColumns = (onOpen: (galleryId: string) => void) => [
  columnHelper.accessor("title", {
    id: "title",
    meta: { label: "Gallery" },
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
      <span {...stylex.props(styles.galleryCell)}>
        <span {...stylex.props(styles.galleryName)}>{cell.getValue()}</span>
        <span {...stylex.props(styles.galleryMeta)}>
          {cell.row.original.slug}
        </span>
      </span>
    ),
  }),
  columnHelper.accessor((row) => row.items.length, {
    id: "itemCount",
    meta: { label: "Images" },
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
  /*
   * Cover as a display column rather than a sortable one: what it says is
   * "does this gallery have a picture in listings", which the club can only fix
   * on the gallery's own screen — so it is a to-do, and a to-do has no order to
   * be in.
   */
  columnHelper.display({
    id: "cover",
    meta: { label: "Cover" },
    enableSorting: false,
    cell: (cell) =>
      cell.row.original.coverItem ? (
        <MediaThumb src={cell.row.original.coverItem.imageUrl} />
      ) : (
        <Pill tone="warning">No cover</Pill>
      ),
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
      <Pill tone={cell.getValue() === "published" ? "positive" : "neutral"}>
        {cell.getValue() === "published" ? "Live" : "Archived"}
      </Pill>
    ),
  }),
  columnHelper.accessor((row) => describeGallery(row), {
    id: "about",
    meta: { label: "About" },
    enableSorting: false,
    cell: (cell) => (
      <span {...stylex.props(styles.about)}>{cell.getValue()}</span>
    ),
  }),
  columnHelper.accessor("publishedAt", {
    id: "publishedAt",
    meta: { label: "Published" },
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

      return (
        <span {...stylex.props(styles.galleryMeta)}>
          {value ? relativeDay(value) : "Not yet"}
        </span>
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
          onOpen(cell.row.original.id);
        }}
        tone="quiet"
      >
        {cell.row.original.items.length === 0 ? "Add images" : "Manage"}
      </CmsButton>
    ),
  }),
];

export interface GalleriesTableProps {
  rows: readonly GalleryRow[];
  total: number;
  search: ListSearch<GallerySortKey>;
  onSearchChange: (value: string) => void;
  onSortingChange: OnChangeFn<SortingState>;
  onPaginationChange: OnChangeFn<PaginationState>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

export const GalleriesTable = ({
  rows,
  total,
  search,
  onSearchChange,
  onSortingChange,
  onPaginationChange,
  isLoading,
  isFetching,
  isError,
}: GalleriesTableProps) => {
  const ids = useId();
  const navigate = useNavigate();

  const columns = useMemo(
    () =>
      buildColumns((galleryId) => {
        void navigate({
          to: "/club-admin/photography/galleries/$galleryId",
          params: { galleryId },
        });
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

  const searching = search.q !== "";

  return (
    <Panel>
      <PanelHead
        eyebrow="Your galleries"
        note={`${total} ${total === 1 ? "gallery" : "galleries"}. A gallery without a cover still shows — it just has no picture in listings.`}
        title="Everything your club has made"
      />

      <DataTableSearchField
        id={`${ids}-search`}
        onCommit={onSearchChange}
        placeholder="Title, summary, or address"
        value={search.q}
      />

      {isError ? (
        <Notice tone="danger">
          Your galleries could not be loaded. Reload the page to try again.
        </Notice>
      ) : null}

      <DataTableFrame
        caption={`Your galleries. ${total} listed.`}
        emptyContent={
          <EmptyState
            note={
              searching
                ? "Clear the search to see the rest of your galleries."
                : "Create your first gallery below. A CMS editor reviews it before it appears on the site."
            }
            title={
              searching
                ? "No gallery matches that search."
                : "No galleries yet."
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
          noun="gallery"
          pageSizes={PAGE_SIZES}
          table={table}
          total={total}
        />
      )}
    </Panel>
  );
};
