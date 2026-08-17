"use client";

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PaginationState, SortingState } from "@tanstack/react-table";
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
import { EntityDialog } from "@aloysius-web/ui/lib/form-builder";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import { IconPlus, IconDotsVertical, IconPencil, IconTrash } from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import type { UniversityAdmissionRow } from "@/lib/api-types";
import { SL_UNIVERSITIES, UNIVERSITY_COURSES } from "@/lib/exam-results";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function DatalistField({
  value,
  onChange,
  placeholder,
  list,
  listId,
}: {
  value: unknown;
  onChange: (val: unknown) => void;
  placeholder: string;
  list: readonly string[];
  listId: string;
}) {
  return (
    <>
      <input
        type="text"
        list={listId}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      <datalist id={listId}>
        {list.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </>
  );
}

type AdmissionFormValues = {
  examResultId: string;
  studentName: string;
  university: string;
  course: string;
  sortOrder: number;
};

function ExamResultSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data } = useQuery(
    orpc.examResults.list.queryOptions({
      input: { page: 1, pageSize: 100, status: "published", examType: "al" },
    }),
  );
  const results = data?.rows ?? [];
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger className="h-9">
        <SelectValue placeholder="Select an A/L exam result" />
      </SelectTrigger>
      <SelectContent>
        {results.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            G.C.E. A/L {r.examYear}
            {r.examYear !== r.resultsYear ? ` (held ${r.resultsYear})` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const admissionFields: FieldEntry<AdmissionFormValues>[] = [
  {
    name: "examResultId",
    kind: "custom",
    label: "A/L Exam Result",
    required: true,
    customRenderer: ({ value, onChange }) => (
      <ExamResultSelect value={(value as string) ?? ""} onChange={onChange} />
    ),
  },
  {
    name: "studentName",
    kind: "text",
    label: "Student Name",
    placeholder: "e.g. Nethmi Jayawardena",
    required: true,
  },
  {
    name: "university",
    kind: "custom",
    label: "University",
    required: true,
    customRenderer: ({ value, onChange }) => (
      <DatalistField
        value={value}
        onChange={onChange}
        placeholder="e.g. University of Moratuwa"
        list={SL_UNIVERSITIES}
        listId="admission-universities"
      />
    ),
  },
  {
    name: "course",
    kind: "custom",
    label: "Course",
    required: true,
    customRenderer: ({ value, onChange }) => (
      <DatalistField
        value={value}
        onChange={onChange}
        placeholder="e.g. BSc Software Engineering"
        list={UNIVERSITY_COURSES}
        listId="admission-courses"
      />
    ),
  },
  { name: "sortOrder", kind: "number", label: "Sort Order" },
];

const admissionConfig: FormConfig<AdmissionFormValues> = {
  fields: admissionFields,
  layout: [
    { columns: [{ fields: ["examResultId"], span: 12 }] },
    { columns: [{ fields: ["studentName"], span: 12 }] },
    { columns: [{ fields: ["university", "course"], span: 6 }] },
    { columns: [{ fields: ["sortOrder"], span: 6 }] },
  ],
};

function DeleteDialog({
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
          <DialogTitle>Delete University Admission</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the admission for <strong>{title}</strong>? This action
            cannot be undone.
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

function ActionsMenu({ item, onEdit }: { item: UniversityAdmissionRow; onEdit: () => void }) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation(
    orpc.admin.universityAdmissions.delete.mutationOptions({
      onSuccess: () => {
        toast.success("University admission deleted");
        queryClient.invalidateQueries({ queryKey: orpc.admin.universityAdmissions.key() });
        setDeleteOpen(false);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

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
        onConfirm={() => deleteMutation.mutate({ id: item.id })}
        title={`${item.studentName} — ${item.university}`}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}

export const Route = createFileRoute("/admin/university-admissions")({
  component: AdminUniversityAdmissions,
});

function AdminUniversityAdmissions() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UniversityAdmissionRow | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const sort = sorting[0];

  const { data, isLoading } = useQuery(
    orpc.admin.universityAdmissions.list.queryOptions({
      input: {
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        sort: sort?.id,
        sortDir: sort?.desc ? "desc" : "asc",
      },
    }),
  );

  const items = data?.rows ?? [];
  const pageCount = data?.pageCount ?? 0;

  const createMutation = useMutation(
    orpc.admin.universityAdmissions.create.mutationOptions({
      onSuccess: () => {
        toast.success("University admission created");
        queryClient.invalidateQueries({ queryKey: orpc.admin.universityAdmissions.key() });
        setCreateOpen(false);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const updateMutation = useMutation(
    orpc.admin.universityAdmissions.update.mutationOptions({
      onSuccess: () => {
        toast.success("University admission updated");
        queryClient.invalidateQueries({ queryKey: orpc.admin.universityAdmissions.key() });
        setEditOpen(false);
        setEditingItem(null);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const columns: ColumnDef<UniversityAdmissionRow, any>[] = [
    {
      accessorKey: "studentName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
      cell: ({ row }) => <span className="font-medium">{row.original.studentName}</span>,
    },
    {
      accessorKey: "university",
      header: ({ column }) => <DataTableColumnHeader column={column} title="University" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {row.original.university}
        </span>
      ),
    },
    {
      accessorKey: "course",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Course" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.course}</span>,
    },
    {
      id: "exam",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Exam" />,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <span className="text-muted-foreground">
            A/L {r.examYear}
            {r.resultsYear !== r.examYear ? ` (held ${r.resultsYear})` : ""}
          </span>
        );
      },
    },
    {
      accessorKey: "sortOrder",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.sortOrder}</span>,
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
        <h1 className="text-lg font-semibold">University Admissions</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <IconPlus className="mr-1 size-4" />
            Add Admission
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
          onPaginationChange={setPagination}
          onSortingChange={setSorting}
          toolbar={(table) => (
            <div className="flex items-center justify-between">
              <div />
              <DataTableViewOptions table={table} />
            </div>
          )}
          paginationBar={(table) => <DataTablePagination table={table} />}
        />

        <EntityDialog<AdmissionFormValues>
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="New University Admission"
          config={admissionConfig}
          defaultValues={{
            examResultId: "",
            studentName: "",
            university: "",
            course: "",
            sortOrder: 0,
          }}
          onSubmit={async (values) => {
            await createMutation.mutateAsync({
              examResultId: values.examResultId,
              studentName: values.studentName,
              university: values.university,
              course: values.course,
              sortOrder: values.sortOrder,
            });
          }}
          queryKeysToInvalidate={[orpc.admin.universityAdmissions.key()]}
          size="lg"
        />

        <EntityDialog<AdmissionFormValues>
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditingItem(null);
          }}
          title="Edit University Admission"
          description={editingItem ? `Editing: ${editingItem.studentName}` : undefined}
          config={admissionConfig}
          defaultValues={
            editingItem
              ? {
                  examResultId: editingItem.examResultId,
                  studentName: editingItem.studentName,
                  university: editingItem.university,
                  course: editingItem.course,
                  sortOrder: editingItem.sortOrder,
                }
              : {
                  examResultId: "",
                  studentName: "",
                  university: "",
                  course: "",
                  sortOrder: 0,
                }
          }
          onSubmit={async (values) => {
            if (!editingItem) return;
            await updateMutation.mutateAsync({
              id: editingItem.id,
              examResultId: values.examResultId,
              studentName: values.studentName,
              university: values.university,
              course: values.course,
              sortOrder: values.sortOrder,
            });
          }}
          queryKeysToInvalidate={[orpc.admin.universityAdmissions.key()]}
          size="lg"
        />
      </div>
    </div>
  );
}