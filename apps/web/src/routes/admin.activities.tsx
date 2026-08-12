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
import { Tabs, TabsList, TabsTrigger } from "@aloysius-web/ui/components/tabs";
import {
  IconPlus,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconRefresh,
} from "@tabler/icons-react";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

type ActivityItem = {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  images: string[];
  type: string;
  adminEmail: string | null;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
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
          <DialogTitle>Delete Activity</DialogTitle>
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

function ActionsMenu({ item }: { item: ActivityItem }) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => client.activities.delete({ id: item.id }),
    onSuccess: () => {
      toast.success("Activity deleted");
      queryClient.invalidateQueries({ queryKey: ["activities"] });
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
            render={<Link to="/admin/activities/$id/edit" params={{ id: item.id }} />}
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
        title={item.name}
      />
    </>
  );
}

const typeLabels: Record<string, string> = {
  club: "Club",
  sport: "Sport",
  other: "Other",
};

const columns: ColumnDef<ActivityItem, any>[] = [
  {
    accessorKey: "coverImage",
    header: "Cover",
    cell: ({ row }) => {
      const url = row.original.coverImage;
      if (!url) return <span className="text-muted-foreground">-</span>;
      return <img src={url} alt="" className="h-10 w-16 rounded-md object-cover" />;
    },
    size: 80,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {typeLabels[row.original.type] ?? row.original.type}
      </span>
    ),
  },
  {
    accessorKey: "images",
    header: "Images",
    cell: ({ row }) => {
      const count = row.original.images?.length ?? 0;
      return <span className="text-muted-foreground">{count}</span>;
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

export const Route = createFileRoute("/admin/activities")({
  component: AdminActivitiesList,
});

function AdminActivitiesList() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: () => client.activities.syncAdminMetadata(),
    onSuccess: (data) => {
      const result = data as {
        updated: number;
        cleared: number;
        errors: number;
        errorsList: string[];
      };
      const parts = [];
      if (result.updated > 0) parts.push(`${result.updated} user(s) updated`);
      if (result.cleared > 0) parts.push(`${result.cleared} user(s) cleared`);
      if (result.errors > 0) parts.push(`${result.errors} error(s)`);
      toast.success(
        result.errors > 0
          ? `Sync completed with issues: ${parts.join(", ")}`
          : `Sync completed: ${parts.join(", ") || "no changes"}`,
      );
      if (result.errorsList.length > 0) {
        for (const err of result.errorsList) {
          toast.error(err);
        }
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const sort = sorting[0];
  const rawSearch = columnFilters.find((f) => f.id === "name")?.value;
  const search = typeof rawSearch === "string" && rawSearch.length > 0 ? rawSearch : undefined;
  const rawStatus = columnFilters.find((f) => f.id === "status")?.value;
  const status =
    typeof rawStatus === "string" && rawStatus.length > 0
      ? (rawStatus as "draft" | "published" | "archived")
      : undefined;

  const { data, isLoading } = useQuery({
    queryKey: [
      "activities",
      pagination.pageIndex,
      pagination.pageSize,
      sort?.id,
      sort?.desc,
      search,
      status,
    ],
    queryFn: () =>
      client.activities.list({
        status,
      }),
  });

  const allItems = (data ?? []) as ActivityItem[];
  const filteredItems =
    typeFilter === "all" ? allItems : allItems.filter((item) => item.type === typeFilter);
  const items = filteredItems.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize,
  );
  const pageCount = Math.ceil(filteredItems.length / pagination.pageSize);

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Activities</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <IconRefresh
              className={`mr-1 size-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
            />
            {syncMutation.isPending ? "Syncing..." : "Sync Admins"}
          </Button>
          <Button size="sm" render={<Link to="/admin/activities/new" />} nativeButton={false}>
            <IconPlus className="mr-1 size-4" />
            New Activity
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        <Tabs
          value={typeFilter}
          onValueChange={(val) => {
            setTypeFilter(val);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <TabsList variant="line">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="club">Clubs</TabsTrigger>
            <TabsTrigger value="sport">Sports</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mt-4">
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
                      placeholder="Filter by name..."
                      value={(filters.find((f) => f.id === "name")?.value as string) ?? ""}
                      onChange={(e) => setFilter("name", e.target.value)}
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
    </div>
  );
}
