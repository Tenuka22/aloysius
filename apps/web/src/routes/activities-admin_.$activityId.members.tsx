"use client";

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import { Input } from "@aloysius-web/ui/components/input";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
} from "@aloysius-web/ui/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@aloysius-web/ui/components/dropdown-menu";
import {
  IconCheck,
  IconDotsVertical,
  IconRotate,
  IconX,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@aloysius-web/ui/components/avatar";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";

export const Route = createFileRoute("/activities-admin_/$activityId/members")({
  component: ActivityAdminMembers,
});

type ClubMember = {
  id: string;
  userId: string | null;
  name: string | null;
  role: string;
  status: string;
  reason: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function ActivityAdminMembers() {
  const { activityId } = useParams({ from: "/activities-admin_/$activityId" });
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: members = [] } = useQuery(
    orpc.clubs.listMembers.queryOptions({ input: { activityId } }),
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: orpc.clubs.key() });

  const approveMutation = useMutation(
    orpc.clubs.approveMember.mutationOptions({
      onSuccess: () => {
        toast.success("Member approved");
        setApproveId(null);
        invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const rejectMutation = useMutation(
    orpc.clubs.rejectMember.mutationOptions({
      onSuccess: () => {
        toast.success("Membership rejected");
        invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const revokeMutation = useMutation(
    orpc.clubs.revokeMember.mutationOptions({
      onSuccess: () => {
        toast.success("Membership revoked");
        setRevokeId(null);
        invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const filteredMembers = members.filter((m: any) =>
    (m.name ?? m.userId ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const columns: ColumnDef<ClubMember, any>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback>{member.name?.charAt(0) ?? "?"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{member.name || member.userId || "—"}</p>
              {member.name && member.userId && (
                <p className="text-xs text-muted-foreground truncate">{member.userId}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <span className="capitalize">{row.original.role}</span>,
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
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              styles[status] ?? styles.pending
            }`}
          >
            {labels[status] ?? status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <IconDotsVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {member.status === "pending" && (
                <>
                  <DropdownMenuItem onClick={() => setApproveId(member.id)}>
                    <IconCheck className="size-4" /> Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => rejectMutation.mutate({ id: member.id })}
                  >
                    <IconX className="size-4" /> Reject
                  </DropdownMenuItem>
                </>
              )}
              {member.status === "approved" && (
                <DropdownMenuItem variant="destructive" onClick={() => setRevokeId(member.id)}>
                  <IconRotate className="size-4" /> Revoke
                </DropdownMenuItem>
              )}
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
      </header>
      <div className="flex-1 p-6">
        <Card>
          <CardContent className="p-2">
            <DataTable
              columns={columns}
              data={filteredMembers}
              pageCount={0}
              pagination={pagination}
              onPaginationChange={setPagination}
              sorting={sorting}
              onSortingChange={setSorting}
              columnFilters={columnFilters}
              onColumnFiltersChange={setColumnFilters}
              toolbar={() => (
                <div className="flex items-center justify-between">
                  <Input
                    placeholder="Search members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-[200px] lg:w-[250px]"
                  />
                </div>
              )}
              paginationBar={(table) => <DataTablePagination table={table} />}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!approveId} onOpenChange={(open) => !open && setApproveId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to approve this membership request?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setApproveId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => approveId && approveMutation.mutate({ id: approveId })}
              disabled={approveMutation.isPending}
            >
              Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!revokeId} onOpenChange={(open) => !open && setRevokeId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Membership</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure? This will revoke the member&apos;s access.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRevokeId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => revokeId && revokeMutation.mutate({ id: revokeId })}
              disabled={revokeMutation.isPending}
            >
              Revoke
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
