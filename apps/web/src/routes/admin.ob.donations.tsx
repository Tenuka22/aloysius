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
  IconUpload,
} from "@tabler/icons-react";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

type OBDonation = {
  id: string;
  donorName: string;
  donorEmail: string | null;
  amount: number | null;
  currency: string;
  purpose: string | null;
  message: string | null;
  image: string | null;
  isAnonymous: boolean;
  status: string;
  donatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function DeleteDonationDialog({
  open,
  onOpenChange,
  onConfirm,
  name,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  name: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Donation</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the donation from <strong>{name}</strong>? This action
            cannot be undone.
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

export const Route = createFileRoute("/admin/ob/donations")({
  component: AdminOBDonations,
});

function AdminOBDonations() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["ob-donations"],
    queryFn: () => client.ob.obDonations.list({}),
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!deleteId) return Promise.resolve({ success: true });
      return client.ob.obDonations.delete({ id: deleteId });
    },
    onSuccess: () => {
      toast.success("Donation deleted");
      setDeleteOpen(false);
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["ob-donations"] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => client.ob.obDonations.update({ id, status: "confirmed" }),
    onSuccess: () => {
      toast.success("Donation confirmed");
      queryClient.invalidateQueries({ queryKey: ["ob-donations"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => client.ob.obDonations.update({ id, status: "cancelled" }),
    onSuccess: () => {
      toast.success("Donation cancelled");
      queryClient.invalidateQueries({ queryKey: ["ob-donations"] });
    },
  });

  const columns: ColumnDef<OBDonation, any>[] = [
    {
      accessorKey: "donorName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Donor" />,
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.isAnonymous ? "Anonymous" : row.original.donorName}
        </span>
      ),
    },
    {
      accessorKey: "image",
      header: "Cover Image",
      cell: ({ row }) => {
        const url = row.original.image;
        if (!url) return <span className="text-muted-foreground">-</span>;
        return <img src={url} alt="" className="h-10 w-10 rounded-md object-cover" />;
      },
      size: 80,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.amount
            ? `${row.original.currency} ${row.original.amount.toLocaleString()}`
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "purpose",
      header: "Purpose",
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1">{row.original.purpose || "-"}</span>
      ),
    },
    {
      accessorKey: "donatedAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.donatedAt ? new Date(row.original.donatedAt).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        const styles: Record<string, string> = {
          confirmed: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
          cancelled: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        };
        const labels: Record<string, string> = {
          confirmed: "Confirmed",
          pending: "Pending",
          cancelled: "Cancelled",
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
        const d = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <IconDotsVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                render={<Link to={`/admin/ob/donations/$id/edit`} params={{ id: d.id }} />}
              >
                <IconPencil className="size-4" /> Edit
              </DropdownMenuItem>
              {d.status === "pending" && (
                <>
                  <DropdownMenuItem onClick={() => confirmMutation.mutate(d.id)}>
                    <IconCheck className="size-4" /> Confirm
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => cancelMutation.mutate(d.id)}
                  >
                    <IconX className="size-4" /> Cancel
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setDeleteId(d.id);
                  setDeleteOpen(true);
                }}
              >
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
        <h1 className="text-lg font-semibold">OB Donations</h1>
        <div className="ml-auto">
          <Button size="sm" render={<Link to="/admin/ob/donations/new" />} nativeButton={false}>
            <IconUpload className="mr-1 size-4" />
            Record Donation
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        <DataTable
          columns={columns}
          data={donations}
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
                  <Input
                    placeholder="Filter by donor..."
                    value={(filters.find((f) => f.id === "donorName")?.value as string) ?? ""}
                    onChange={(e) => setFilter("donorName", e.target.value)}
                    className="h-8 w-[200px] lg:w-[250px]"
                  />
                  <Select
                    value={(filters.find((f) => f.id === "status")?.value as string) ?? ""}
                    onValueChange={(val) => setFilter("status", val ?? "")}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
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
        />
      </div>
      <DeleteDonationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => deleteMutation.mutate()}
        name={deleteId ? donations.find((d) => d.id === deleteId)?.donorName || "" : ""}
      />
    </div>
  );
}
