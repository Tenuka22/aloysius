"use client";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import {
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconCheck,
  IconArchive,
  IconPlus,
} from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import type { OBAnnouncement } from "@/lib/api-types";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

const audienceLabels: Record<string, string> = {
  all: "Everyone",
  students: "Students",
  parents: "Parents",
  staff: "Staff",
  alumni: "Alumni",
};

function DeleteAnnouncementDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Announcement</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{title}</strong>? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute("/admin/ob/announcements")({
  component: AdminOBAnnouncements,
});

function AdminOBAnnouncements() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: announcements = [], isLoading } = useQuery(
    orpc.ob.obAnnouncements.list.queryOptions({ input: {} }),
  );

  const deleteMutation = useMutation(
    orpc.admin.ob.announcements.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Announcement deleted");
        setDeleteOpen(false);
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: orpc.ob.obAnnouncements.key() });
      },
    }),
  );

  const publishMutation = useMutation(
    orpc.admin.ob.announcements.update.mutationOptions({
      onSuccess: () => {
        toast.success("Announcement published");
        queryClient.invalidateQueries({ queryKey: orpc.ob.obAnnouncements.key() });
      },
    }),
  );

  const archiveMutation = useMutation(
    orpc.admin.ob.announcements.update.mutationOptions({
      onSuccess: () => {
        toast.success("Announcement archived");
        queryClient.invalidateQueries({ queryKey: orpc.ob.obAnnouncements.key() });
      },
    }),
  );

  const columns: ColumnDef<OBAnnouncement, any>[] = [
    {
      accessorKey: "coverImage",
      header: "Cover",
      cell: ({ row }) => {
        const url = row.original.coverImage;
        if (!url) return <span className="text-muted-foreground">-</span>;
        return <img src={url} alt="" className="h-10 w-10 rounded-md object-cover" />;
      },
      size: 60,
    },
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    },
    {
      accessorKey: "audience",
      header: "Audience",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full bg-secondary/20 px-2 py-1 text-xs font-medium">
          {audienceLabels[row.original.audience] ?? row.original.audience}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        const styles: Record<string, string> = {
          published: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          archived: "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
          draft: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        };
        const labels: Record<string, string> = {
          published: "Published",
          archived: "Archived",
          draft: "Draft",
        };
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? styles.draft}`}
          >
            {labels[status] ?? status}
          </span>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const a = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <IconDotsVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                render={<Link to={`/admin/ob/announcements/$id/edit`} params={{ id: a.id }} />}
              >
                <IconPencil className="size-4" /> Edit
              </DropdownMenuItem>
              {(a.status === "draft" || a.status === "archived") && (
                <DropdownMenuItem
                  onClick={() =>
                    publishMutation.mutate({ id: a.id, status: "published", publishNow: true })
                  }
                >
                  <IconCheck className="size-4" /> Publish
                </DropdownMenuItem>
              )}
              {a.status === "published" && (
                <DropdownMenuItem onClick={() => archiveMutation.mutate({ id: a.id, status: "archived" })}>
                  <IconArchive className="size-4" /> Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setDeleteId(a.id);
                  setDeleteOpen(true);
                }}
              >
                <IconTrash className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">OB Announcements</h1>
        <div className="ml-auto">
          <Button
            size="sm"
            render={<Link to="/admin/ob/announcements/new" />}
            nativeButton={false}
          >
            <IconPlus className="mr-1 size-4" />
            New Announcement
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        <DataTable
          columns={columns}
          data={announcements}
          loading={isLoading}
          pageCount={0}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          columnFilters={columnFilters}
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
      <DeleteAnnouncementDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })}
        title={deleteId ? announcements.find((a) => a.id === deleteId)?.title || "" : ""}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
