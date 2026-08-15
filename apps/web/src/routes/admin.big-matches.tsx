"use client";

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
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
import { EntityDialog, useBuildForm } from "@aloysius-web/ui/lib/form-builder";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";
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
import { Dropzone } from "@/components/file-upload";
import { uploadImageWithRatio } from "@/lib/upload-image";
import { cn } from "@aloysius-web/ui/lib/utils";

type BigMatch = {
  id: string;
  name: string;
  opponent: string;
  coverImage: string | null;
  type: string;
  year: number | null;
  eventId: string | null;
  galleryId: string | null;
  sortOrder: number;
  status: string;
};

type BigMatchFormValues = {
  name: string;
  opponent: string;
  coverImage: string;
  type: string;
  year: string;
  sortOrder: number;
  status: "draft" | "published" | "archived";
};

function CoverImageField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const form = useBuildForm();
  const coverImage = value as string | undefined;
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const result = await client.files.uploadFile(files[0]!);
      form.setFieldValue("coverImage", result.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {coverImage ? (
        <div className="relative aspect-video rounded-lg overflow-hidden border">
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => form.setFieldValue("coverImage", "")}
          >
            Remove
          </Button>
        </div>
      ) : (
        <Dropzone
          onFilesSelected={handleFilesSelected}
          maxFiles={1}
          maxSize={5 * 1024 * 1024}
          disabled={uploading}
          aspect={16 / 9}
          crop={false}
          className={cn(
            "aspect-video justify-center",
            uploading && "opacity-50 pointer-events-none",
          )}
        />
      )}
    </div>
  );
}

const bigMatchFields: FieldEntry<BigMatchFormValues>[] = [
  {
    name: "coverImage",
    kind: "custom",
    label: "Cover Image",
    required: false,
    customRenderer: ({ value, onChange }) => <CoverImageField value={value} onChange={onChange} />,
  },
  {
    name: "name",
    kind: "text",
    label: "Match Name",
    placeholder: "e.g. Battle of the Two Cities",
    required: true,
  },
  {
    name: "opponent",
    kind: "text",
    label: "Opponent",
    placeholder: "e.g. Rahula College, Matara",
    required: true,
  },
  { name: "type", kind: "text", label: "Type", placeholder: "e.g. Cricket", required: true },
  { name: "year", kind: "text", label: "Year", placeholder: "e.g. 2024" },
  { name: "sortOrder", kind: "number", label: "Sort Order" },
  {
    name: "status",
    kind: "select",
    label: "Status",
    options: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
      { value: "archived", label: "Archived" },
    ],
  },
];

const bigMatchConfig: FormConfig<BigMatchFormValues> = {
  fields: bigMatchFields,
  layout: [
    { columns: [{ fields: ["name", "opponent"], span: 6 }] },
    { columns: [{ fields: ["coverImage"], span: 12 }] },
    { columns: [{ fields: ["type", "year"], span: 6 }] },
    { columns: [{ fields: ["sortOrder", "status"], span: 6 }] },
  ],
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
          <DialogTitle>Delete Big Match</DialogTitle>
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

function ActionsMenu({ item, onEdit }: { item: BigMatch; onEdit: () => void }) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => client.bigMatches.delete({ id: item.id }),
    onSuccess: () => {
      toast.success("Big match deleted");
      queryClient.invalidateQueries({ queryKey: ["bigMatches"] });
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
          <DropdownMenuItem onClick={onEdit}>
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

export const Route = createFileRoute("/admin/big-matches")({
  component: AdminBigMatches,
});

function AdminBigMatches() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BigMatch | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const rawStatus = columnFilters.find((f) => f.id === "status")?.value;
  const status =
    typeof rawStatus === "string" && rawStatus.length > 0
      ? (rawStatus as "draft" | "published" | "archived")
      : undefined;

  const { data: bigMatches, isLoading } = useQuery({
    queryKey: ["bigMatches", status],
    queryFn: () => client.bigMatches.list({ status }),
  });

  const allItems = bigMatches ?? [];
  const totalItems = allItems.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / pagination.pageSize));
  const pageStart = pagination.pageIndex * pagination.pageSize;
  const items = allItems.slice(pageStart, pageStart + pagination.pageSize);

  const columns: ColumnDef<BigMatch, any>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "opponent",
      header: "Opponent",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.opponent}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {row.original.type}
        </span>
      ),
    },
    {
      accessorKey: "year",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Year" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.year ?? "-"}</span>,
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ActionsMenu
          item={row.original}
          onEdit={() => {
            setEditingItem(row.original);
            setEditOpen(true);
          }}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Big Matches</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <IconPlus className="mr-1 size-4" />
            Add Match
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

        <EntityDialog<BigMatchFormValues>
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditingItem(null);
          }}
          title="Edit Big Match"
          description={editingItem ? `Editing: ${editingItem.name}` : undefined}
          config={bigMatchConfig}
          defaultValues={
            editingItem
              ? {
                  name: editingItem.name,
                  opponent: editingItem.opponent,
                  coverImage: editingItem.coverImage ?? "",
                  type: editingItem.type,
                  year: editingItem.year?.toString() ?? "",
                  sortOrder: editingItem.sortOrder,
                  status: editingItem.status as "draft" | "published" | "archived",
                }
              : {
                  name: "",
                  opponent: "",
                  coverImage: "",
                  type: "Cricket",
                  year: "",
                  sortOrder: 0,
                  status: "published",
                }
          }
          onSubmit={async (values) => {
            if (!editingItem) return;
            await client.bigMatches.update({
              id: editingItem.id,
              name: values.name,
              opponent: values.opponent,
              coverImage: values.coverImage || null,
              type: values.type,
              year: values.year ? Number(values.year) : null,
              sortOrder: values.sortOrder,
              status: values.status,
            });
            toast.success("Big match updated");
            queryClient.invalidateQueries({ queryKey: ["bigMatches"] });
            setEditOpen(false);
            setEditingItem(null);
          }}
          queryKeysToInvalidate={["bigMatches"]}
          size="full"
        />

        <EntityDialog<BigMatchFormValues>
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="New Big Match"
          config={bigMatchConfig}
          defaultValues={{
            name: "",
            opponent: "",
            coverImage: "",
            type: "Cricket",
            year: "",
            sortOrder: 0,
            status: "published",
          }}
          onSubmit={async (values) => {
            await client.bigMatches.create({
              name: values.name,
              opponent: values.opponent,
              coverImage: values.coverImage || undefined,
              type: values.type,
              year: values.year ? Number(values.year) : undefined,
              status: values.status,
            });
            toast.success("Big match created");
            queryClient.invalidateQueries({ queryKey: ["bigMatches"] });
            setCreateOpen(false);
          }}
          queryKeysToInvalidate={["bigMatches"]}
          size="full"
        />
      </div>
    </div>
  );
}
