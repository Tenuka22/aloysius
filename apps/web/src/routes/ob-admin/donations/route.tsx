"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  IconPlus,
  IconBrandAppgallery,
} from "@tabler/icons-react";
import { client, orpc } from "@/utils/orpc";
import type { OBDonation } from "@/lib/api-types";
import { uploadImageWithRatio } from "@/lib/upload-image";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { useState, useEffect } from "react";

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

function ReleaseGalleryDialog({
  open,
  onOpenChange,
  onCreateNew,
  onLinkExisting,
  donorName,
  availableGalleries,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNew: (values: { title: string; description: string; coverImage: string }) => void;
  onLinkExisting: (galleryId: string) => void;
  donorName: string;
  availableGalleries: { id: string; title: string; coverImage: string | null }[];
  isPending: boolean;
}) {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [selectedGalleryId, setSelectedGalleryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("new");
      setSelectedGalleryId("");
      setTitle(`Gift from ${donorName}`);
      setDescription("");
      setCoverImage("");
    }
  }, [open, donorName]);

  const handleCoverFile = async (file?: File) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      setCoverImage(await uploadImageWithRatio(file, 16 / 9));
    } catch {
      toast.error("Failed to upload cover image");
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Donation Gallery</DialogTitle>
          <DialogDescription>
            Attach a photo gallery for the gift from <strong>{donorName}</strong>. You'll add
            photos next, then publish it when it's ready.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={mode} onValueChange={(v) => setMode((v as "new" | "existing") ?? "new")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Create a new gallery</SelectItem>
              <SelectItem value="existing" disabled={availableGalleries.length === 0}>
                Link an existing gallery{availableGalleries.length === 0 ? " (none available)" : ""}
              </SelectItem>
            </SelectContent>
          </Select>

          {mode === "existing" ? (
            <Select value={selectedGalleryId} onValueChange={(v) => setSelectedGalleryId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a gallery..." />
              </SelectTrigger>
              <SelectContent>
                {availableGalleries.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Gallery title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Description <span className="text-muted-foreground/70">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Cover image <span className="text-muted-foreground/70">(optional, 16:9)</span>
                </label>
                <div className="flex items-center gap-3">
                  {coverImage ? (
                    <img src={coverImage} alt="" className="h-14 w-24 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-14 w-24 items-center justify-center rounded-md border border-dashed text-[10px] text-muted-foreground">
                      No cover
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    id="donation-gallery-cover"
                    className="hidden"
                    onChange={(e) => {
                      handleCoverFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingCover}
                    onClick={() => document.getElementById("donation-gallery-cover")?.click()}
                  >
                    {uploadingCover ? "Uploading…" : coverImage ? "Replace" : "Upload"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              mode === "new"
                ? onCreateNew({ title: title.trim(), description: description.trim(), coverImage })
                : onLinkExisting(selectedGalleryId)
            }
            disabled={
              isPending ||
              (mode === "existing" && !selectedGalleryId) ||
              (mode === "new" && !title.trim())
            }
          >
            {isPending ? "Saving…" : mode === "new" ? "Create Gallery" : "Link Gallery"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const donationsSearchSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
  search: z.string().optional(),
});

export const Route = createFileRoute("/ob-admin/donations")({
  validateSearch: (search) => donationsSearchSchema.parse(search),
  loaderDeps: ({ search: { status, search } }) => ({ status, search }),
  loader: async ({ context, deps }) => {
    await context.queryClient.prefetchQuery(orpc.ob.obDonations.list.queryOptions({ input: deps }));
  },
  component: OBAdminDonations,
});

function OBAdminDonations() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseDonationId, setReleaseDonationId] = useState<string | null>(null);
  const [releaseDonorName, setReleaseDonorName] = useState("");

  const { data: donations = [] } = useSuspenseQuery(
    orpc.ob.obDonations.list.queryOptions({ input: search }),
  );

  const { data: galleries = [] } = useQuery({
    queryKey: orpc.ob.obDonationGalleries.key(),
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

  const { data: availableGalleries = [] } = useQuery(
    orpc.ob.obDonationGalleries.listAvailable.queryOptions({ enabled: releaseOpen }),
  );

  const goToGalleryImages = (galleryId: string) => {
    setReleaseOpen(false);
    setReleaseDonationId(null);
    setReleaseDonorName("");
    queryClient.invalidateQueries({ queryKey: orpc.ob.obDonationGalleries.key() });
    navigate({ to: "/ob-admin/gallery/$id/images", params: { id: galleryId } });
  };

  const createGalleryMutation = useMutation(
    orpc.ob.obDonationGalleries.create.mutationOptions({
      onSuccess: (gallery) => {
        if (gallery) {
          toast.success("Gallery created — add photos, then publish");
          goToGalleryImages(gallery.id);
        }
      },
      onError: (err) => {
        toast.error(err.message || "Failed to create gallery");
      },
    }),
  );

  const linkGalleryMutation = useMutation(
    orpc.ob.obDonationGalleries.link.mutationOptions({
      onSuccess: (gallery) => {
        if (gallery) {
          toast.success("Gallery linked");
          goToGalleryImages(gallery.id);
        }
      },
      onError: (err) => {
        toast.error(err.message || "Failed to link gallery");
      },
    }),
  );

  const columns: ColumnDef<OBDonation, any>[] = [
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => {
        const url = row.original.image;
        if (!url) return <span className="text-muted-foreground">-</span>;
        return <img src={url} alt="" className="h-10 w-10 rounded-md object-cover" />;
      },
      size: 60,
    },
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
      id: "gallery",
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
                render={<Link to={`/ob-admin/donations/$id/edit`} params={{ id: d.id }} />}
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
                      <IconBrandAppgallery className="size-4" /> Add Gallery
                    </DropdownMenuItem>
                  );
                }
                return (
                  <DropdownMenuItem
                    render={<Link to="/ob-admin/gallery/$id/images" params={{ id: gallery.id }} />}
                  >
                    <IconBrandAppgallery className="size-4" /> Manage Gallery
                  </DropdownMenuItem>
                );
              })()}
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
        <h1 className="text-lg font-semibold">Donations</h1>
        <div className="ml-auto">
          <Button size="sm" render={<Link to="/ob-admin/donations/new" />} nativeButton={false}>
            <IconPlus className="mr-1 size-4" />
            Record Donation
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        <DataTable
          columns={columns}
          data={donations}
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
                  placeholder="Search by donor..."
                  value={search.search ?? ""}
                  onChange={(e) =>
                    navigate({ search: (prev) => ({ ...prev, search: e.target.value || undefined }) })
                  }
                  className="h-8 w-[200px] lg:w-[250px]"
                />
                <Select
                  value={search.status ?? "all"}
                  onValueChange={(val) =>
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        status: val === "all" ? undefined : (val as typeof search.status),
                      }),
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {(search.search || search.status) && (
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
      <DeleteDonationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => deleteMutation.mutate({ id: deleteId! })}
        name={donations.find((d) => d.id === deleteId)?.donorName || ""}
        isPending={deleteMutation.isPending}
      />
      <ReleaseGalleryDialog
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        onCreateNew={(values) =>
          createGalleryMutation.mutate({
            obDonationId: releaseDonationId!,
            title: values.title || `Gift from ${releaseDonorName}`,
            description: values.description || undefined,
            coverImage: values.coverImage || undefined,
          })
        }
        onLinkExisting={(galleryId) =>
          linkGalleryMutation.mutate({ id: galleryId, obDonationId: releaseDonationId! })
        }
        donorName={releaseDonorName}
        availableGalleries={availableGalleries}
        isPending={createGalleryMutation.isPending || linkGalleryMutation.isPending}
      />
    </div>
  );
}
