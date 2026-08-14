"use client";

import { useState } from "react";
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
import {
  IconPlus,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconSend,
  IconArchive,
  IconRotate,
  IconExternalLink,
} from "@tabler/icons-react";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

const EXAM_TYPE_LABELS: Record<string, string> = {
  scholarship: "G5 Scholarship",
  ol: "GCE O/L",
  al: "GCE A/L",
};

type ExamResultItem = {
  id: string;
  examType: string;
  examYear: number;
  resultsYear: number;
  status: string;
  createdAt: string;
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
          <DialogTitle>Delete Exam Result</DialogTitle>
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

function ActionsMenu({ item }: { item: ExamResultItem }) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => client.examResults.delete({ id: item.id }),
    onSuccess: () => {
      toast.success("Exam result deleted");
      queryClient.invalidateQueries({ queryKey: ["examResults"] });
      setDeleteOpen(false);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: "draft" | "published" | "archived") =>
      client.examResults.update({ id: item.id, status }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["examResults"] });
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
            render={<Link to="/admin/exam-results/$id/edit" params={{ id: item.id }} />}
          >
            <IconPencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<a href="/exam-results" target="_blank" rel="noreferrer" />}
          >
            <IconExternalLink className="size-4" />
            View Page
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {item.status === "draft" && (
            <DropdownMenuItem onClick={() => statusMutation.mutate("published")}>
              <IconSend className="size-4" />
              Publish
            </DropdownMenuItem>
          )}
          {item.status === "published" && (
            <>
              <DropdownMenuItem onClick={() => statusMutation.mutate("draft")}>
                <IconRotate className="size-4" />
                Unpublish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => statusMutation.mutate("archived")}>
                <IconArchive className="size-4" />
                Archive
              </DropdownMenuItem>
            </>
          )}
          {item.status === "archived" && (
            <DropdownMenuItem onClick={() => statusMutation.mutate("draft")}>
              <IconRotate className="size-4" />
              Restore to Draft
            </DropdownMenuItem>
          )}
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
        title={`${EXAM_TYPE_LABELS[item.examType] ?? item.examType} ${item.examYear} (${item.resultsYear})`}
      />
    </>
  );
}

const columns: ColumnDef<ExamResultItem, any>[] = [
  {
    accessorKey: "examType",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Exam" />,
    cell: ({ row }) => (
      <span className="font-medium">
        {EXAM_TYPE_LABELS[row.original.examType] ?? row.original.examType}
      </span>
    ),
  },
  {
    accessorKey: "examYear",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Exam Year" />,
  },
  {
    accessorKey: "resultsYear",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Results Year" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.examYear} ({row.original.resultsYear})
      </span>
    ),
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

export const Route = createFileRoute("/admin/exam-results")({
  component: AdminExamResultsList,
});

function AdminExamResultsList() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const sort = sorting[0];
  const rawExamType = columnFilters.find((f) => f.id === "examType")?.value;
  const examType =
    typeof rawExamType === "string" && rawExamType.length > 0 ? rawExamType : undefined;
  const rawStatus = columnFilters.find((f) => f.id === "status")?.value;
  const status =
    typeof rawStatus === "string" && rawStatus.length > 0
      ? (rawStatus as "draft" | "published" | "archived")
      : undefined;

  const { data, isLoading } = useQuery({
    queryKey: [
      "examResults",
      pagination.pageIndex,
      pagination.pageSize,
      sort?.id,
      sort?.desc,
      examType,
      status,
    ],
    queryFn: () =>
      client.examResults.list({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        sort: sort?.id,
        sortDir: sort?.desc ? "desc" : "asc",
        examType: examType as any,
        status,
      }),
  });

  const items = data?.rows ?? [];
  const pageCount = data?.pageCount ?? 0;

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Exam Results</h1>
        <div className="ml-auto">
          <Button size="sm" render={<Link to="/admin/exam-results/new" />} nativeButton={false}>
            <IconPlus className="mr-1 size-4" />
            New Exam Result
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
                  <Select
                    value={(filters.find((f) => f.id === "examType")?.value as string) ?? ""}
                    onValueChange={(val) => setFilter("examType", val ?? "")}
                  >
                    <SelectTrigger className="h-8 w-[160px]">
                      <SelectValue placeholder="All exams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scholarship">G5 Scholarship</SelectItem>
                      <SelectItem value="ol">GCE O/L</SelectItem>
                      <SelectItem value="al">GCE A/L</SelectItem>
                    </SelectContent>
                  </Select>
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
  );
}
