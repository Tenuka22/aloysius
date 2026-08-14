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
  IconArrowLeft,
  IconShieldCheck,
  IconShieldX,
  IconPlus,
} from "@tabler/icons-react";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

const HEAD_ROLES = [
  "PRESIDENT",
  "VICE PRESIDENT",
  "SECRETARY",
  "ASSISTANT SECRETARY",
  "TREASURER",
  "ASSISTANT TREASURER",
  "PATRON",
  "JESUIT REPRESENTATIVE",
  "PARISH PRIEST",
];

function isHeadRole(role: string): boolean {
  const upper = role.toUpperCase();
  return HEAD_ROLES.some((r) => upper.includes(r));
}

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

export const Route = createFileRoute("/admin/ob/members_/$year")({
  component: AdminOBMembersYear,
});

function AdminOBMembersYear() {
  const { year } = Route.useParams();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["ob-members", { year }],
    queryFn: () => client.ob.obMembers.list({ year }),
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

  const approvedMembers = members.filter((m: any) => m.status === "approved");
  const headCommittee = approvedMembers.filter((m: any) => isHeadRole(m.role));
  const regularMembers = approvedMembers.filter((m: any) => !isHeadRole(m.role));
  const pendingMembers = members.filter((m: any) => m.status === "pending");

  const filteredMembers = roleFilter === "all" ? members : roleFilter === "head" ? members.filter((m: any) => isHeadRole(m.role)) : members.filter((m: any) => !isHeadRole(m.role));

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
      cell: ({ row }) => {
        const role = row.original.role;
        const isHead = isHeadRole(role);
        return (
          <div className="flex items-center gap-2">
            <span className={isHead ? "text-gold font-medium" : "text-muted-foreground"}>{role}</span>
            {isHead && <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full font-bold tracking-wider">HEAD</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email || "-"}</span>,
    },
    {
      accessorKey: "adminEmail",
      header: "Admin Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {row.original.adminEmail ? (
            <>
              <IconShieldCheck className="size-3.5 text-gold" />
              <span className="text-gold text-xs font-medium">{row.original.adminEmail}</span>
            </>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
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
              <DropdownMenuItem render={<Link to={`/admin/ob/members/${m.id}/edit?returnTo=${encodeURIComponent(`/admin/ob/members/${year}`)}`} />}>
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
        <Button variant="ghost" size="sm" render={<Link to="/admin/ob/members" />}>
          <IconArrowLeft className="mr-1 size-4" />
          All Years
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div>
          <h1 className="text-lg font-semibold">{year} Committee</h1>
          <div className="text-xs text-muted-foreground">
            {headCommittee.length > 0 && <span>{headCommittee.length} head committee</span>}
            {headCommittee.length > 0 && regularMembers.length > 0 && <span> &bull; </span>}
            {regularMembers.length > 0 && <span>{regularMembers.length} members</span>}
            {pendingMembers.length > 0 && <span className="text-yellow-600"> &bull; {pendingMembers.length} pending</span>}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" render={<Link to={`/admin/ob/members/new?year=${encodeURIComponent(year)}`} />} nativeButton={false}>
            <IconPlus className="mr-1 size-4" />
            Add Member
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6 space-y-6">
        {headCommittee.length > 0 && (
          <section>
            <h2 className="text-sm font-bold tracking-[0.2em] text-gold mb-4">HEAD COMMITTEE</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {headCommittee.map((member: any) => (
                <Card key={member.id} className="overflow-hidden border-gold/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground shrink-0 overflow-hidden">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-green-dark truncate">{member.name}</div>
                        <div className="text-xs text-gold font-medium">{member.role}</div>
                        {member.adminEmail && (
                          <div className="flex items-center gap-1 text-[10px] text-gold mt-0.5">
                            <IconShieldCheck className="size-3" />
                            OB Admin
                          </div>
                        )}
                      </div>
                    </div>
                    {member.email && <div className="text-xs text-muted-foreground mt-2 truncate">{member.email}</div>}
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1" render={<Link to={`/admin/ob/members/${member.id}/edit?returnTo=${encodeURIComponent(`/admin/ob/members/${year}`)}`} />}>
                        <IconPencil className="size-3 mr-1" /> Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {regularMembers.length > 0 && (
          <section>
            <h2 className="text-sm font-bold tracking-[0.2em] text-muted-foreground mb-4">MEMBERS</h2>
            <div className="bg-white rounded-lg border">
              <DataTable
                columns={columns}
                data={filteredMembers}
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
                        <Input placeholder="Filter by name..." value={(filters.find((f) => f.id === "name")?.value as string) ?? ""} onChange={(e) => setFilter("name", e.target.value)} className="h-8 w-[200px] lg:w-[250px]" />
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue placeholder="All roles" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            <SelectItem value="head">Head Committee</SelectItem>
                            <SelectItem value="regular">Members</SelectItem>
                          </SelectContent>
                        </Select>
                        {isFiltered && <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">Reset</Button>}
                      </div>
                      <DataTableViewOptions table={table} />
                    </div>
                  );
                }}
                paginationBar={(table) => <DataTablePagination table={table} />}
              />
            </div>
          </section>
        )}

        {pendingMembers.length > 0 && (
          <section>
            <h2 className="text-sm font-bold tracking-[0.2em] text-yellow-600 mb-4">PENDING APPROVAL ({pendingMembers.length})</h2>
            <div className="space-y-3">
              {pendingMembers.map((member: any) => (
                <Card key={member.id} className="border-yellow-500/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground overflow-hidden">
                        {member.photo ? <img src={member.photo} alt={member.name} className="w-full h-full object-cover" /> : member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-green-dark">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.role} &bull; {member.email || "No email"}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveMutation.mutate(member.id)} className="bg-green-dark text-cream hover:bg-green-darker">
                        <IconCheck className="size-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(member.id)}>
                        <IconX className="size-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
      <DeleteMemberDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={() => deleteMutation.mutate()} name={deleteId ? members.find((m) => m.id === deleteId)?.name || "" : ""} />
    </div>
  );
}
