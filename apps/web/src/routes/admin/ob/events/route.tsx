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
  IconArchive,
  IconBrandAppgallery,
  IconPhoto,
} from "@tabler/icons-react";
import { client, orpc } from "@/utils/orpc";
import type { OBEvent, OBEventGallery } from "@/lib/api-types";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

function DeleteEventDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{title}</strong>? This action cannot be undone.
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
  onConfirm,
  eventTitle,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  eventTitle: string;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release Event Gallery</DialogTitle>
          <DialogDescription>
            Create and release a gallery for <strong>{eventTitle}</strong>? The gallery will be
            published and visible to the public.
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

export const Route = createFileRoute("/admin/ob/events")({
  component: AdminOBEvents,
});

function AdminOBEvents() {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseEventId, setReleaseEventId] = useState<string | null>(null);
  const [releaseEventTitle, setReleaseEventTitle] = useState("");

  const { data: events = [], isLoading } = useQuery(
    orpc.ob.obEvents.list.queryOptions({ input: {} }),
  );

  const { data: galleries = [] } = useQuery({
    queryKey: ["ob-event-galleries"],
    queryFn: async () => {
      const all: OBEventGallery[] = [];
      for (const e of events) {
        const result = await client.ob.obEventGalleries.list({ obEventId: e.id });
        all.push(...result);
      }
      return all;
    },
    enabled: events.length > 0,
  });

  const galleryByEvent = new Map<string, OBEventGallery>();
  for (const g of galleries) {
    if (g.obEventId) galleryByEvent.set(g.obEventId, g);
  }

  const deleteMutation = useMutation(
    orpc.ob.obEvents.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Event deleted");
        setDeleteOpen(false);
        setDeleteId(null);
      },
    }),
  );

  const releaseGalleryMutation = useMutation({
    mutationFn: () => {
      if (!releaseEventId) return Promise.resolve(null);
      return client.admin.ob.eventGalleries.create({
        obEventId: releaseEventId,
        title: events.find((e) => e.id === releaseEventId)?.title || "Event Gallery",
      });
    },
    onSuccess: async (gallery) => {
      if (gallery) {
        await client.admin.ob.eventGalleries.release({ id: gallery.id });
        toast.success("Gallery released");
      }
      setReleaseOpen(false);
      setReleaseEventId(null);
      setReleaseEventTitle("");
      queryClient.invalidateQueries({ queryKey: orpc.ob.obEventGalleries.key() });
    },
  });

  const publishMutation = useMutation(
    orpc.ob.obEvents.update.mutationOptions({
      onSuccess: () => {
        toast.success("Event published");
      },
    }),
  );

  const archiveMutation = useMutation(
    orpc.ob.obEvents.update.mutationOptions({
      onSuccess: () => {
        toast.success("Event archived");
      },
    }),
  );

  const columns: ColumnDef<OBEvent, any>[] = [
    {
      accessorKey: "coverImage",
      header: "Cover",
      cell: ({ row }) => {
        const url = row.original.coverImage;
        if (!url) return <span className="text-muted-foreground">-</span>;
        return <img src={url} alt="" className="h-10 w-10 rounded-md object-cover" />;
      },
      size: 60,
    },
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1">{row.original.location || "-"}</span>
      ),
    },
    {
      accessorKey: "eventDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.eventDate ? new Date(row.original.eventDate).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      accessorKey: "gallery",
      header: "Gallery",
      cell: ({ row }) => {
        const g = galleryByEvent.get(row.original.id);
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
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        const styles: Record<string, string> = {
          published: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          archived: "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
          draft: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        };
        const labels: Record<string, string> = {
          published: "Published",
          archived: "Archived",
          draft: "Draft",
        };
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? styles.draft}`}
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
        const e = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <IconDotsVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                render={<Link to={`/admin/ob/events/$id/edit`} params={{ id: e.id }} />}
              >
                <IconPencil className="size-4" /> Edit
              </DropdownMenuItem>
              {e.status === "draft" && (
                <DropdownMenuItem
                  onClick={() =>
                    publishMutation.mutate({ id: e.id, status: "published", publishNow: true })
                  }
                >
                  <IconCheck className="size-4" /> Publish
                </DropdownMenuItem>
              )}
              {e.status === "published" && (
                <DropdownMenuItem onClick={() => archiveMutation.mutate({ id: e.id, status: "archived" })}>
                  <IconArchive className="size-4" /> Archive
                </DropdownMenuItem>
              )}
              {(e.status === "draft" || e.status === "archived") && (
                <DropdownMenuItem
                  onClick={() =>
                    publishMutation.mutate({ id: e.id, status: "published", publishNow: true })
                  }
                >
                  <IconCheck className="size-4" /> Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {(() => {
                const gallery = galleryByEvent.get(e.id);
                if (!gallery) {
                  return (
                    <DropdownMenuItem
                      onClick={() => {
                        setReleaseEventId(e.id);
                        setReleaseEventTitle(e.title);
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
                          await client.admin.ob.eventGalleries.unrelease({ id: gallery.id });
                          toast.success("Gallery unreleased");
                          queryClient.invalidateQueries({
                            queryKey: orpc.ob.obEventGalleries.key(),
                          });
                        }}
                      >
                        <IconArchive className="size-4" /> Unrelease Gallery
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={async () => {
                          await client.admin.ob.eventGalleries.release({ id: gallery.id });
                          toast.success("Gallery released");
                          queryClient.invalidateQueries({
                            queryKey: orpc.ob.obEventGalleries.key(),
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
                  setDeleteId(e.id);
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
        <h1 className="text-lg font-semibold">OB Events</h1>
        <div className="ml-auto">
          <Button size="sm" render={<Link to="/admin/ob/events/new" />} nativeButton={false}>
            <IconPencil className="mr-1 size-4" />
            New Event
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        <DataTable
          columns={columns}
          data={events}
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
                    placeholder="Filter by title..."
                    value={(filters.find((f) => f.id === "title")?.value as string) ?? ""}
                    onChange={(e) => setFilter("title", e.target.value)}
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
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
      <DeleteEventDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })}
        title={deleteId ? events.find((e) => e.id === deleteId)?.title || "" : ""}
        isPending={deleteMutation.isPending}
      />
      <ReleaseGalleryDialog
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        onConfirm={() => releaseGalleryMutation.mutate()}
        eventTitle={releaseEventTitle}
        isPending={releaseGalleryMutation.isPending}
      />
    </div>
  );
}
