"use client";

import { useState, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import { Input } from "@aloysius-web/ui/components/input";
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
} from "@aloysius-web/ui/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@aloysius-web/ui/components/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import { IconPlus, IconDotsVertical, IconPencil, IconTrash } from "@tabler/icons-react";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

type AnnouncementItem = {
  id: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[] | null;
  status: string;
  audience: string;
  addressedTo: string | null;
  publishedAt: string | null;
  createdAt: string;
};

const audienceLabels: Record<string, string> = {
  all: "Everyone",
  students: "Students",
  parents: "Parents",
  staff: "Staff",
  alumni: "Alumni",
};

function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Announcement</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{title}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActionsMenu({ item }: { item: AnnouncementItem }) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => client.announcements.delete({ id: item.id }),
    onSuccess: () => {
      toast.success("Announcement deleted");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setDeleteOpen(false);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <IconDotsVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={<Link to="/admin/announcements/$id/edit" params={{ id: item.id }} />}
          >
            <IconPencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <IconTrash className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => deleteMutation.mutate()}
        title={item.title}
      />
    </>
  );
}

const columns: ColumnDef<AnnouncementItem, any>[] = [
  {
    accessorKey: "coverImage",
    header: "Cover",
    cell: ({ row }) => {
      const url = row.original.coverImage;
      if (!url) return <span className="text-muted-foreground">-</span>;
      return <img src={url} alt="" className="h-10 w-16 rounded-md object-contain" />;
    },
    size: 80,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
  },
  {
    accessorKey: "audience",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Audience" />,
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
        {audienceLabels[row.original.audience] ?? row.original.audience}
      </span>
    ),
  },
  {
    accessorKey: "addressedTo",
    header: "Addressed To",
    cell: ({ row }) => (
      <span className="text-muted-foreground line-clamp-1">{row.original.addressedTo ?? "-"}</span>
    ),
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.original.tags;
      if (!tags || tags.length === 0) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            >
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
          row.original.status === "published"
            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : row.original.status === "archived"
              ? "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
              : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        }`}
      >
        {row.original.status === "published"
          ? "Published"
          : row.original.status === "archived"
            ? "Archived"
            : "Draft"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsMenu item={row.original} />,
  },
];

export const Route = createFileRoute("/admin/announcements")({
  component: AdminAnnouncementsList,
});

function AdminAnnouncementsList() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sort = sorting[0];
  const rawSearch = columnFilters.find((f) => f.id === "title")?.value;
  const search = typeof rawSearch === "string" && rawSearch.length > 0 ? rawSearch : undefined;
  const rawStatus = columnFilters.find((f) => f.id === "status")?.value;
  const status =
    typeof rawStatus === "string" && rawStatus.length > 0
      ? (rawStatus as "draft" | "published" | "archived")
      : undefined;
  const rawAudience = columnFilters.find((f) => f.id === "audience")?.value;
  const audience =
    typeof rawAudience === "string" && rawAudience.length > 0
      ? (rawAudience as "all" | "students" | "parents" | "staff" | "alumni")
      : undefined;

  const { data, isLoading } = useQuery({
    queryKey: [
      "announcements",
      pagination.pageIndex,
      pagination.pageSize,
      sort?.id,
      sort?.desc,
      search,
      status,
      audience,
    ],
    queryFn: () =>
      client.announcements.list({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        sort: sort?.id,
        sortDir: sort?.desc ? "desc" : "asc",
        search,
        status,
        audience,
      }),
  });

  const items = data?.rows ?? [];
  const pageCount = data?.pageCount ?? 0;

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Announcements</h1>
        <div className="ml-auto">
          <Button size="sm" render={<Link to="/admin/announcements/new" />} nativeButton={false}>
            <IconPlus className="mr-1 size-4" />
            New Announcement
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        <DataTable
          columns={columns}
          data={items}
          pageCount={pageCount}
          loading={isLoading}
          pagination={pagination}
          sorting={sorting}
          columnFilters={columnFilters}
          onPaginationChange={setPagination}
          onSortingChange={setSorting}
          onColumnFiltersChange={setColumnFilters}
          toolbar={(table) => {
            const filters = table.getState().columnFilters;
            const isFiltered = filters.length > 0;
            const setFilter = (id: string, value: string) => {
              const next = filters.filter((f) => f.id !== id);
              if (value) next.push({ id, value });
              table.setColumnFilters(next);
            };
            return (
              <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    ref={searchInputRef}
                    placeholder="Filter by title..."
                    value={(filters.find((f) => f.id === "title")?.value as string) ?? ""}
                    onChange={(e) => setFilter("title", e.target.value)}
                    className="h-8 w-[200px] lg:w-[250px]"
                  />
                  <Select
                    value={(filters.find((f) => f.id === "status")?.value as string) ?? ""}
                    onValueChange={(val) => setFilter("status", val ?? "")}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={(filters.find((f) => f.id === "audience")?.value as string) ?? ""}
                    onValueChange={(val) => setFilter("audience", val ?? "")}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="All audiences" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="parents">Parents</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="alumni">Alumni</SelectItem>
                    </SelectContent>
                  </Select>
                  {isFiltered && (
                    <Button
                      variant="ghost"
                      onClick={() => table.resetColumnFilters()}
                      className="h-8 px-2 lg:px-3"
                    >
                      Reset
                    </Button>
                  )}
                </div>
                <DataTableViewOptions table={table} />
              </div>
            );
          }}
          paginationBar={(table) => <DataTablePagination table={table} />}
        />
      </div>
    </div>
  );
}
