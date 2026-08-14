"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import { Input } from "@aloysius-web/ui/components/input";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
} from "@aloysius-web/ui/components/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import { IconArrowLeft, IconShieldCheck } from "@tabler/icons-react";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { useState, useEffect, useMemo } from "react";
import { OBCommitteeEditor, type OBMember } from "@/components-client/ob-committee-editor";

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

export const Route = createFileRoute("/admin/ob/members_/$year")({
  component: AdminOBMembersYear,
});

function AdminOBMembersYear() {
  const { year } = Route.useParams();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [obAdminEmail, setObAdminEmail] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["ob-members", { year }],
    queryFn: () => client.ob.obMembers.list({ year }),
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ["ob-members", "all"],
    queryFn: () => client.ob.obMembers.list({}),
  });

  const visibleMembers = useMemo(() => members.filter((m: any) => m.role !== "ADMINISTRATOR"), [members]);
  const visibleAllMembers = useMemo(() => allMembers.filter((m: any) => m.role !== "ADMINISTRATOR"), [allMembers]);

  // The OB admin is any member of this year whose row carries the admin email —
  // not necessarily the President.
  useEffect(() => {
    const admin = visibleMembers.find((m: any) => m.adminEmail);
    setObAdminEmail(admin?.adminEmail || "");
  }, [visibleMembers, year]);

  const saveAdminMutation = useMutation({
    mutationFn: (email: string) => client.ob.obMembers.setOBAdmin({ year, email: email || null }),
    onSuccess: () => {
      toast.success("OB admin email saved");
      queryClient.invalidateQueries({ queryKey: ["ob-members"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const approvedMembers = visibleMembers.filter((m: any) => m.status === "approved");
  const pendingMembers = visibleMembers.filter((m: any) => m.status === "pending");
  const pool = visibleAllMembers.filter((m: any) => m.status === "approved");

  const filteredMembers =
    roleFilter === "all"
      ? visibleMembers
      : roleFilter === "head"
        ? visibleMembers.filter((m: any) => isHeadRole(m.role))
        : visibleMembers.filter((m: any) => !isHeadRole(m.role));

  const columns: ColumnDef<OBMember, any>[] = [
    {
      accessorKey: "photo",
      header: "Photo",
      cell: ({ row }) => {
        const url = row.original.photo;
        if (!url) return <span className="text-muted-foreground">-</span>;
        return <img src={url} alt="" className="h-10 w-10 rounded-full object-cover" />;
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
            {m.adminEmail && <IconShieldCheck className="size-3.5 text-gold shrink-0" title="OB Admin" />}
          </div>
        );
      },
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
            {approvedMembers.length > 0 && <span>{approvedMembers.length} members</span>}
            {pendingMembers.length > 0 && <span className="text-yellow-600"> &bull; {pendingMembers.length} pending</span>}
          </div>
        </div>
      </header>
      <div className="flex-1 p-6 space-y-6">
        {/* OB Admin — the only thing the site admin can change here */}
        <section>
          <h2 className="text-sm font-bold tracking-[0.2em] text-foreground mb-3">OB ADMIN</h2>
          <Card className="border-secondary/20">
            <CardContent className="p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[240px]">
                <label className="text-xs text-muted-foreground block mb-1">
                  OB Admin Email <span className="text-muted-foreground/70">(the member who manages the committee)</span>
                </label>
                <Input
                  placeholder="admin@example.com"
                  value={obAdminEmail}
                  onChange={(e) => setObAdminEmail(e.target.value)}
                  className="h-9"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Must match the email of an approved member in {year} — the admin is not necessarily the President.
                </p>
              </div>
              <div className="flex items-end gap-2">
                <Button size="sm" onClick={() => saveAdminMutation.mutate(obAdminEmail)} disabled={saveAdminMutation.isPending} className="self-end">
                  {saveAdminMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Committee + All members side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Committee — read-only for the site admin */}
          <section>
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : (
              <OBCommitteeEditor year={year} members={approvedMembers as OBMember[]} pool={pool as OBMember[]} readOnly />
            )}
          </section>

          {/* All members — read-only view */}
          {members.length > 0 && (
            <section>
              <h2 className="text-sm font-bold tracking-[0.2em] text-foreground mb-4">ALL MEMBERS</h2>
              <div className="rounded-lg border border-foreground/15 p-2 bg-card">
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
                          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
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
        </div>
      </div>
    </div>
  );
}
