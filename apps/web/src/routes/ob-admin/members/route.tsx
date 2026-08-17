"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { z } from "zod";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
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
import { orpc } from "@/utils/orpc";
import { sortByRole } from "@/lib/ob-sort";
import type { OBMember } from "@/lib/api-types";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { OBMemberForm } from "@/components-client/ob-member-form";

const membersSearchSchema = z.object({
  search: z.string().optional(),
});

export const Route = createFileRoute("/ob-admin/members")({
  validateSearch: (search) => membersSearchSchema.parse(search),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(orpc.ob.obMembers.list.queryOptions({ input: {} })),
      context.queryClient.prefetchQuery(
        orpc.settings.get.queryOptions({ input: { key: "ob_admin_email" } }),
      ),
    ]);
  },
  component: OBAdminMembers,
});

function OBAdminMembers() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OBMember | null>(null);
  const [deleting, setDeleting] = useState<OBMember | null>(null);

  const { data: members = [] } = useSuspenseQuery(orpc.ob.obMembers.list.queryOptions({ input: {} }));
  const { data: adminEmailSetting } = useSuspenseQuery(
    orpc.settings.get.queryOptions({ input: { key: "ob_admin_email" } }),
  );
  const obAdminEmail = adminEmailSetting?.value?.toLowerCase() ?? "";

  const invalidate = () => queryClient.invalidateQueries({ queryKey: orpc.ob.obMembers.key() });

  const approveMutation = useMutation(
    orpc.ob.obMembers.approveMember.mutationOptions({
      onSuccess: () => {
        toast.success("Member approved");
        invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const rejectMutation = useMutation(
    orpc.ob.obMembers.rejectMember.mutationOptions({
      onSuccess: () => {
        toast.success("Membership rejected");
        invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const revokeMutation = useMutation(
    orpc.ob.obMembers.revokeMember.mutationOptions({
      onSuccess: () => {
        toast.success("Membership revoked");
        invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const deleteMutation = useMutation(
    orpc.ob.obMembers.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Member removed");
        setDeleting(null);
        invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const visibleMembers = members.filter((m: OBMember) => m.role !== "ADMINISTRATOR");
  const pendingMembers = visibleMembers.filter((m: OBMember) => m.status === "pending");
  const filteredMembers = sortByRole(search.search
    ? visibleMembers.filter((m: OBMember) =>
        m.name.toLowerCase().includes(search.search!.toLowerCase()),
      )
    : visibleMembers,
  );

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
            {!!obAdminEmail && m.email?.toLowerCase() === obAdminEmail && (
              <IconShieldCheck className="size-3.5 text-primary shrink-0" title="OB Admin" />
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
                  <DropdownMenuItem onClick={() => approveMutation.mutate({ id: m.id })}>
                    <IconCheck className="size-4" /> Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => rejectMutation.mutate({ id: m.id })}
                  >
                    <IconX className="size-4" /> Reject
                  </DropdownMenuItem>
                </>
              )}
              {m.status === "approved" && (
                <DropdownMenuItem variant="destructive" onClick={() => revokeMutation.mutate({ id: m.id })}>
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
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Members</h1>
        <Button size="sm" className="ml-auto" onClick={() => setFormOpen(true)}>
          <IconPlus className="mr-1 size-4" /> Add Member
        </Button>
      </header>
      <div className="flex-1 space-y-6 p-6">
        {pendingMembers.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Pending approval ({pendingMembers.length})
            </h2>
            <Card>
              <CardContent className="-mx-(--card-spacing) divide-y divide-border">
                {pendingMembers.map((member: OBMember) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-4 px-(--card-spacing) py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar size="default">
                        <AvatarImage src={member.photo ?? undefined} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {member.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {member.role} &bull; {member.year || "No year"} &bull;{" "}
                          {member.email || "No email"}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" onClick={() => approveMutation.mutate({ id: member.id })}>
                        <IconCheck className="size-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectMutation.mutate({ id: member.id })}
                      >
                        <IconX className="size-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            All members ({visibleMembers.length})
          </h2>
          <div className="rounded-lg border bg-card p-2">
            <DataTable
              columns={columns}
              data={filteredMembers}
              pageCount={0}
              pagination={pagination}
              onPaginationChange={setPagination}
              sorting={sorting}
              columnFilters={columnFilters}
              onSortingChange={setSorting}
              onColumnFiltersChange={setColumnFilters}
              toolbar={(table) => (
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      placeholder="Search by name..."
                      value={search.search ?? ""}
                      onChange={(e) =>
                        navigate({
                          search: (prev) => ({ ...prev, search: e.target.value || undefined }),
                        })
                      }
                      className="h-8 w-[200px] lg:w-[250px]"
                    />
                    {search.search && (
                      <Button
                        variant="ghost"
                        onClick={() => navigate({ search: {} })}
                        className="h-8 px-2 lg:px-3"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                  <DataTableViewOptions table={table} />
                </div>
              )}
              paginationBar={(table) => <DataTablePagination table={table} />}
            />
          </div>
        </section>
      </div>


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
              onClick={() => deleting && deleteMutation.mutate({ id: deleting.id })}
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
