"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  IconEye,
  IconArchive,
  IconBrandAppgallery,
  IconPhoto,
} from "@tabler/icons-react";
import { client, orpc } from "@/utils/orpc";
import type { OBDonation } from "@/lib/api-types";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

type OBDonationGallery = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  obDonationId: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function DeleteDonationDialog({
  open,
  onOpenChange,
  onConfirm,
  name,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  name: string;
  isPending: boolean;
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

function ViewDonationDialog({
  open,
  onOpenChange,
  donation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donation: OBDonation | null;
}) {
  if (!donation) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(90vw,560px)]">
        <DialogHeader>
          <DialogTitle>{donation.isAnonymous ? "Anonymous" : donation.donorName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {donation.image ? (
            <img
              src={donation.image}
              alt=""
              className="w-full aspect-video rounded-lg border object-cover"
            />
          ) : (
            <div className="flex w-full aspect-video items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
              No image
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold">
              {donation.amount ? `${donation.currency} ${donation.amount.toLocaleString()}` : "-"}
            </span>
            <span className="text-sm text-muted-foreground">
              {donation.donatedAt ? new Date(donation.donatedAt).toLocaleDateString() : "-"}
            </span>
          </div>
          {donation.purpose && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Purpose</div>
              <div className="text-sm">{donation.purpose}</div>
            </div>
          )}
          {donation.message && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Message</div>
              <div className="text-sm whitespace-pre-line">{donation.message}</div>
            </div>
          )}
          {donation.donorEmail && !donation.isAnonymous && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Donor Email</div>
              <div className="text-sm">{donation.donorEmail}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            render={
              <Link to={`/admin/ob/donations/$id/edit`} params={{ id: donation.id }} />
            }
          >
            Edit
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReleaseGalleryDialog({
  open,
  onOpenChange,
  onConfirm,
  donorName,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  donorName: string;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release Donation Gallery</DialogTitle>
          <DialogDescription>
            Create and release a gallery in recognition of <strong>{donorName}</strong>'s support?
            The gallery will be published and visible to the public.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? "Releasing…" : "Release Gallery"}
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseDonationId, setReleaseDonationId] = useState<string | null>(null);
  const [releaseDonorName, setReleaseDonorName] = useState("");
  const { data: donations = [], isLoading } = useQuery(
    orpc.ob.obDonations.list.queryOptions({ input: {} }),
  );

  const { data: galleries = [] } = useQuery({
    queryKey: ["ob-donation-galleries"],
    queryFn: async () => {
      const all: OBDonationGallery[] = [];
      for (const d of donations) {
        const result = await client.ob.obDonationGalleries.list({ obDonationId: d.id });
        all.push(...result);
      }
      return all;
    },
    enabled: donations.length > 0,
  });

  const galleryByDonation = new Map<string, OBDonationGallery>();
  for (const g of galleries) {
    if (g.obDonationId) galleryByDonation.set(g.obDonationId, g);
  }

  const deleteMutation = useMutation(
    orpc.ob.obDonations.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Donation deleted");
        setDeleteOpen(false);
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: orpc.ob.obDonations.key() });
      },
    }),
  );

  const confirmMutation = useMutation(
    orpc.ob.obDonations.update.mutationOptions({
      onSuccess: () => {
        toast.success("Donation confirmed");
        queryClient.invalidateQueries({ queryKey: orpc.ob.obDonations.key() });
      },
    }),
  );

  const cancelMutation = useMutation(
    orpc.ob.obDonations.update.mutationOptions({
      onSuccess: () => {
        toast.success("Donation cancelled");
        queryClient.invalidateQueries({ queryKey: orpc.ob.obDonations.key() });
      },
    }),
  );

  const releaseGalleryMutation = useMutation({
    mutationFn: () => {
      if (!releaseDonationId) return Promise.resolve(null);
      return client.admin.ob.donationGalleries.create({
        obDonationId: releaseDonationId,
        title: `${releaseDonorName || "Donor"} Support Gallery`,
      });
    },
    onSuccess: async (gallery) => {
      if (gallery) {
        await client.admin.ob.donationGalleries.release({ id: gallery.id });
        toast.success("Gallery released");
      }
      setReleaseOpen(false);
      setReleaseDonationId(null);
      setReleaseDonorName("");
      queryClient.invalidateQueries({ queryKey: orpc.ob.obDonationGalleries.key() });
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
        return <img src={url} alt="" className="h-10 aspect-video rounded-md object-cover" />;
      },
      size: 90,
    },
    {
      accessorKey: "gallery",
      header: "Gallery",
      cell: ({ row }) => {
        const g = galleryByDonation.get(row.original.id);
        if (!g) return <span className="text-xs text-muted-foreground">No gallery</span>;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${g.status === "published" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}
          >
            {g.status === "published" ? "Released" : "Draft"}
          </span>
        );
      },
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
                onClick={() => {
                  setViewId(d.id);
                  setViewOpen(true);
                }}
              >
                <IconEye className="size-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link to={`/admin/ob/donations/$id/edit`} params={{ id: d.id }} />}
              >
                <IconPencil className="size-4" /> Edit
              </DropdownMenuItem>
              {d.status === "pending" && (
                <>
                  <DropdownMenuItem
                    onClick={() => confirmMutation.mutate({ id: d.id, status: "confirmed" })}
                  >
                    <IconCheck className="size-4" /> Confirm
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => cancelMutation.mutate({ id: d.id, status: "cancelled" })}
                  >
                    <IconX className="size-4" /> Cancel
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              {(() => {
                const gallery = galleryByDonation.get(d.id);
                if (!gallery) {
                  return (
                    <DropdownMenuItem
                      onClick={() => {
                        setReleaseDonationId(d.id);
                        setReleaseDonorName(d.isAnonymous ? "Anonymous" : d.donorName);
                        setReleaseOpen(true);
                      }}
                    >
                      <IconBrandAppgallery className="size-4" /> Release Gallery
                    </DropdownMenuItem>
                  );
                }
                return (
                  <>
                    {gallery.status === "published" ? (
                      <DropdownMenuItem
                        onClick={async () => {
                          await client.admin.ob.donationGalleries.unrelease({ id: gallery.id });
                          toast.success("Gallery unreleased");
                          queryClient.invalidateQueries({
                            queryKey: orpc.ob.obDonationGalleries.key(),
                          });
                        }}
                      >
                        <IconArchive className="size-4" /> Unrelease Gallery
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={async () => {
                          await client.admin.ob.donationGalleries.release({ id: gallery.id });
                          toast.success("Gallery released");
                          queryClient.invalidateQueries({
                            queryKey: orpc.ob.obDonationGalleries.key(),
                          });
                        }}
                      >
                        <IconCheck className="size-4" /> Release Gallery
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      render={<Link to="/admin/gallery/$id/images" params={{ id: gallery.id }} />}
                    >
                      <IconPhoto className="size-4" /> Manage Photos
                    </DropdownMenuItem>
                  </>
                );
              })()}
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
        onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })}
        name={deleteId ? donations.find((d) => d.id === deleteId)?.donorName || "" : ""}
        isPending={deleteMutation.isPending}
      />
      <ViewDonationDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        donation={viewId ? donations.find((d) => d.id === viewId) || null : null}
      />
      <ReleaseGalleryDialog
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        onConfirm={() => releaseGalleryMutation.mutate()}
        donorName={releaseDonorName}
        isPending={releaseGalleryMutation.isPending}
      />
    </div>
  );
}
