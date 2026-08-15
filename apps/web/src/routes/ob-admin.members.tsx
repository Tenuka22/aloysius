"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@aloysius-web/ui/components/button";
import { Input } from "@aloysius-web/ui/components/input";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
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
  IconCheck,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconRotate,
  IconTrash,
  IconX,
  IconShieldCheck,
} from "@tabler/icons-react";
import { Avatar, AvatarImage, AvatarFallback } from "@aloysius-web/ui/components/avatar";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { OBMemberForm } from "@/components-client/ob-member-form";

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

export const Route = createFileRoute("/ob-admin/members")({
  component: OBAdminMembers,
});

function OBAdminMembers() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OBMember | null>(null);
  const [deleting, setDeleting] = useState<OBMember | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["ob-members", "admin"],
    queryFn: () => client.ob.obMembers.list({}),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["ob-members"] });

  const approveMutation = useMutation({
    mutationFn: (id: string) => client.ob.obMembers.approveMember({ id }),
    onSuccess: () => {
      toast.success("Member approved");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => client.ob.obMembers.rejectMember({ id }),
    onSuccess: () => {
      toast.success("Membership rejected");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => client.ob.obMembers.revokeMember({ id }),
    onSuccess: () => {
      toast.success("Membership revoked");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.ob.obMembers.delete({ id }),
    onSuccess: () => {
      toast.success("Member removed");
      setDeleting(null);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const visibleMembers = members.filter((m: any) => m.role !== "ADMINISTRATOR");
  const pendingMembers = visibleMembers.filter((m: any) => m.status === "pending");

  const columns: ColumnDef<OBMember, any>[] = [
    {
      accessorKey: "photo",
      header: "Photo",
      cell: ({ row }) => {
        const url = row.original.photo;
        if (!url) return <span className="text-muted-foreground">-</span>;
        return (
          <Avatar size="sm">
            <AvatarImage src={url} alt={row.original.name} />
            <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
          </Avatar>
        );
      },
      size: 60,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="flex items-center gap-2">
            <span>{m.name}</span>
            {m.adminEmail && (
              <IconShieldCheck className="size-3.5 text-gold shrink-0" title="OB Admin" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.role}</span>,
    },
    {
      accessorKey: "year",
      header: "Year",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.year || "-"}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email || "-"}</span>,
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
        const labels: Record<string, string> = {
          approved: "Approved",
          pending: "Pending",
          rejected: "Rejected",
          revoked: "Revoked",
        };
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? styles.pending}`}
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
        const m = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <IconDotsVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(m)}>
                <IconPencil className="size-4" /> Edit
              </DropdownMenuItem>
              {m.status === "pending" && (
                <>
                  <DropdownMenuItem onClick={() => approveMutation.mutate(m.id)}>
                    <IconCheck className="size-4" /> Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => rejectMutation.mutate(m.id)}
                  >
                    <IconX className="size-4" /> Reject
                  </DropdownMenuItem>
                </>
              )}
              {m.status === "approved" && (
                <DropdownMenuItem variant="destructive" onClick={() => revokeMutation.mutate(m.id)}>
                  <IconRotate className="size-4" /> Revoke
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(m)}>
                <IconTrash className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-green-dark">Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage every OB member — add, edit, and approve membership requests.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setFormOpen(true)}
          className="bg-green-dark text-cream hover:bg-green-darker"
        >
          <IconPlus className="mr-1 size-4" /> Add Member
        </Button>
      </div>

      {pendingMembers.length > 0 && (
        <section>
          <h2 className="text-sm font-bold tracking-[0.2em] text-yellow-600 mb-4">
            PENDING APPROVAL ({pendingMembers.length})
          </h2>
          <div className="space-y-3">
            {pendingMembers.map((member: any) => (
              <Card key={member.id} className="border-yellow-500/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar size="default">
                      <AvatarImage src={member.photo ?? undefined} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm text-green-dark">{member.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.role} &bull; {member.year || "No year"} &bull;{" "}
                        {member.email || "No email"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(member.id)}
                      className="bg-green-dark text-cream hover:bg-green-darker"
                    >
                      <IconCheck className="size-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectMutation.mutate(member.id)}
                    >
                      <IconX className="size-4 mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold tracking-[0.2em] text-muted-foreground mb-4">
          ALL MEMBERS ({visibleMembers.length})
        </h2>
        <div className="bg-white rounded-lg border p-2">
          <DataTable
            columns={columns}
            data={visibleMembers}
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
                      placeholder="Filter by name..."
                      value={(filters.find((f) => f.id === "name")?.value as string) ?? ""}
                      onChange={(e) => setFilter("name", e.target.value)}
                      className="h-8 w-[200px] lg:w-[250px]"
                    />
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
      </section>

      {/* Add / Edit member */}
      <Dialog
        open={formOpen || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Member" : "Add Member"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Update ${editing.name}`
                : "Create a new OB member. The OB admin approves pending requests."}
            </DialogDescription>
          </DialogHeader>
          {formOpen || editing ? (
            <OBMemberForm
              key={editing?.id ?? "new"}
              mode={editing ? "edit" : "create"}
              id={editing?.id}
              defaultYear={String(new Date().getFullYear())}
              onSuccess={() => {
                setFormOpen(false);
                setEditing(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
