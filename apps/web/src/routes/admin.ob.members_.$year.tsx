"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
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
  DropdownMenuTrigger,
} from "@aloysius-web/ui/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import { IconArrowLeft, IconShieldCheck, IconDotsVertical, IconPencil } from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import type { OBMember } from "@/lib/api-types";
import type { ColumnDef } from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { OBCommitteeEditor } from "@/components-client/ob-committee-editor";

const OB_ADMIN_EMAIL_KEY = "ob_admin_email";

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
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      orpc.ob.obMembers.list.queryOptions({ input: { year: params.year } }),
    );
    await context.queryClient.prefetchQuery(
      orpc.settings.get.queryOptions({ input: { key: OB_ADMIN_EMAIL_KEY } }),
    );
  },
  component: AdminOBMembersYear,
});

function AdminOBMembersYear() {
  const { year } = Route.useParams();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: members } = useSuspenseQuery(
    orpc.ob.obMembers.list.queryOptions({ input: { year } }),
  );

  const { data: allMembers = [] } = useQuery(orpc.ob.obMembers.list.queryOptions({ input: {} }));

  const { data: adminEmailSetting } = useSuspenseQuery(
    orpc.settings.get.queryOptions({ input: { key: OB_ADMIN_EMAIL_KEY } }),
  );
  const obAdminEmail = adminEmailSetting?.value?.toLowerCase() ?? "";

  const visibleMembers = useMemo(
    () => members.filter((m: OBMember) => m.role !== "ADMINISTRATOR"),
    [members],
  );
  const visibleAllMembers = useMemo(
    () => allMembers.filter((m: OBMember) => m.role !== "ADMINISTRATOR"),
    [allMembers],
  );

  const approvedMembers = visibleMembers.filter((m: OBMember) => m.status === "approved");
  const pendingMembers = visibleMembers.filter((m: OBMember) => m.status === "pending");
  const pool = visibleAllMembers.filter((m: OBMember) => m.status === "approved");

  const filteredMembers =
    roleFilter === "all"
      ? visibleMembers
      : roleFilter === "head"
        ? visibleMembers.filter((m: OBMember) => isHeadRole(m.role))
        : visibleMembers.filter((m: OBMember) => !isHeadRole(m.role));

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
      cell: ({ row }) => {
        const role = row.original.role;
        const isHead = isHeadRole(role);
        return (
          <div className="flex items-center gap-2">
            <span className={isHead ? "text-primary font-medium" : "text-muted-foreground"}>
              {role}
            </span>
            {isHead && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold tracking-wider">
                HEAD
              </span>
            )}
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
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <IconDotsVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              render={
                <Link
                  to="/admin/ob/members/$id/edit"
                  params={{ id: row.original.id }}
                  search={{ returnTo: `/admin/ob/members/${year}` }}
                />
              }
            >
              <IconPencil className="size-4" /> Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 50,
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
            {pendingMembers.length > 0 && (
              <span className="text-yellow-600"> &bull; {pendingMembers.length} pending</span>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1 p-6 space-y-6">
        {/* Committee, then All members below */}
        <div className="space-y-6">
          {/* Committee — read-only for the site admin */}
          <section>
            <OBCommitteeEditor
              year={year}
              members={approvedMembers}
              pool={pool}
              readOnly
            />
          </section>

          {/* All members */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-[0.2em] text-foreground">ALL MEMBERS</h2>
              <Button
                size="sm"
                variant="outline"
                render={<Link to="/admin/ob/members/new" search={{ year }} />}
              >
                Add Member
              </Button>
            </div>
            {members.length > 0 && (
              <div className="rounded-lg border border-foreground/15 p-2 bg-card">
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
                          <Select
                            value={roleFilter}
                            onValueChange={(v) => setRoleFilter(v ?? "all")}
                          >
                            <SelectTrigger className="h-8 w-[140px]">
                              <SelectValue placeholder="All roles" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All roles</SelectItem>
                              <SelectItem value="head">Head Committee</SelectItem>
                              <SelectItem value="regular">Members</SelectItem>
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
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
