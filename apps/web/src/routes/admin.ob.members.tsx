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
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconCheck,
  IconX,
  IconRotate,
  IconUpload,
  IconShieldCheck,
  IconShieldX,
} from "@tabler/icons-react";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Dropzone } from "@/components/file-upload";
import { Textarea } from "@aloysius-web/ui/components/textarea";
import { cn } from "@aloysius-web/ui/lib/utils";

type OBMember = {
  id: string;
  userId: string | null;
  name: string;
  role: string;
  email: string | null;
  adminEmail: string | null;
  photo: string | null;
  bio: string | null;
  year: string;
  sortOrder: number;
  status: string;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function DeleteMemberDialog({ open, onOpenChange, onConfirm, name }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void; name: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Member</DialogTitle>
          <DialogDescription>Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute("/admin/ob/members")({
  component: AdminOBMembers,
});

function AdminOBMembers() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["ob-members"],
    queryFn: () => client.ob.obMembers.list({}),
  });

  const deleteMutation = useMutation({
    mutationFn: () => { if (!deleteId) return Promise.resolve({ success: true }); return client.ob.obMembers.delete({ id: deleteId }); },
    onSuccess: () => { toast.success("Member removed"); setDeleteOpen(false); setDeleteId(null); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => client.ob.obMembers.approveMember({ id }),
    onSuccess: () => { toast.success("Member approved"); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => client.ob.obMembers.rejectMember({ id }),
    onSuccess: () => { toast.success("Membership rejected"); },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => client.ob.obMembers.revokeMember({ id }),
    onSuccess: () => { toast.success("Membership revoked"); },
  });

  const grantAdminMutation = useMutation({
    mutationFn: (id: string) => client.ob.obMembers.update({ id, adminEmail: members.find((m) => m.id === id)?.email || "" }),
    onSuccess: () => { toast.success("OB admin privileges granted"); },
  });

  const revokeAdminMutation = useMutation({
    mutationFn: (id: string) => client.ob.obMembers.update({ id, adminEmail: null }),
    onSuccess: () => { toast.success("OB admin privileges revoked"); },
  });

  const columns: ColumnDef<OBMember, any>[] = [
    {
      accessorKey: "photo",
      header: "Photo",
      cell: ({ row }) => {
        const url = row.original.photo;
        if (!url) return <span className="text-muted-foreground">-</span>;
        return <img src={url} alt="" className="h-10 w-10 rounded-md object-cover" />;
      },
      size: 60,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.role}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email || "-"}</span>,
    },
    {
      accessorKey: "adminEmail",
      header: "Admin Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.adminEmail || "-"}</span>,
    },
    {
      accessorKey: "year",
      header: "Year",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.year || "-"}</span>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        const styles: Record<string, string> = {
          approved: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
          rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          revoked: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        };
        const labels: Record<string, string> = { approved: "Approved", pending: "Pending", rejected: "Rejected", revoked: "Revoked" };
        return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? styles.pending}`}>{labels[status] ?? status}</span>;
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const m = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <IconDotsVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link to={`/admin/ob/members/$id/edit`} params={{ id: m.id }} />}>
                <IconPencil className="size-4" /> Edit
              </DropdownMenuItem>
              {m.status === "pending" && (
                <>
                  <DropdownMenuItem onClick={() => approveMutation.mutate(m.id)}>
                    <IconCheck className="size-4" /> Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => rejectMutation.mutate(m.id)}>
                    <IconX className="size-4" /> Reject
                  </DropdownMenuItem>
                </>
              )}
              {m.status === "approved" && (
                <DropdownMenuItem variant="destructive" onClick={() => revokeMutation.mutate(m.id)}>
                  <IconRotate className="size-4" /> Revoke
                </DropdownMenuItem>
              )}
              {m.status === "approved" && !m.adminEmail && (
                <DropdownMenuItem onClick={() => grantAdminMutation.mutate(m.id)}>
                  <IconShieldCheck className="size-4" /> Make OB Admin
                </DropdownMenuItem>
              )}
              {m.status === "approved" && m.adminEmail && (
                <DropdownMenuItem onClick={() => revokeAdminMutation.mutate(m.id)}>
                  <IconShieldX className="size-4" /> Remove OB Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => { setDeleteId(m.id); setDeleteOpen(true); }}>
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
        <h1 className="text-lg font-semibold">OB Members</h1>
        <div className="ml-auto">
          <Button size="sm" render={<Link to="/admin/ob/members/new" />} nativeButton={false}>
            <IconUpload className="mr-1 size-4" />
            New Member
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        <DataTable
          columns={columns}
          data={members}
          loading={isLoading}
          pageCount={0}
          pagination={{ pageIndex: 0, pageSize: 10 }}
          onPaginationChange={() => {}}
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
                  <Input placeholder="Filter by name..." value={(filters.find((f) => f.id === "name")?.value as string) ?? ""} onChange={(e) => setFilter("name", e.target.value)} className="h-8 w-[200px] lg:w-[250px]" />
                   <Select value={(filters.find((f) => f.id === "status")?.value as string) ?? ""} onValueChange={(val) => setFilter("status", val ?? "")}>
                     <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="pending">Pending</SelectItem>
                       <SelectItem value="approved">Approved</SelectItem>
                       <SelectItem value="rejected">Rejected</SelectItem>
                       <SelectItem value="revoked">Revoked</SelectItem>
                     </SelectContent>
                   </Select>
                   <Select value={(filters.find((f) => f.id === "year")?.value as string) ?? ""} onValueChange={(val) => setFilter("year", val ?? "")}>
                     <SelectTrigger className="h-8 w-[120px]"><SelectValue placeholder="All years" /></SelectTrigger>
                     <SelectContent>
                       {[...new Set(members.map((m) => m.year).filter(Boolean))].sort().reverse().map((year) => (
                         <SelectItem key={year} value={year}>{year}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                  {isFiltered && <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">Reset</Button>}
                </div>
                <DataTableViewOptions table={table} />
              </div>
            );
          }}
        />
      </div>
      <DeleteMemberDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={() => deleteMutation.mutate()} name={deleteId ? members.find((m) => m.id === deleteId)?.name || "" : ""} />
    </div>
  );
}
