"use client";

import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@aloysius-web/ui/components/dropdown-menu";
import {
  IconPlus,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconCalendarEvent,
  IconHeart,
  IconPhoto,
} from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import type { OBGalleryRow } from "@/lib/api-types";
import { toast } from "sonner";
import { OBGalleryForm } from "@/components-client/ob-gallery-form";

function GalleryCard({ item, onDelete }: { item: OBGalleryRow; onDelete: () => void }) {
  const statusStyles: Record<string, string> = {
    published: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    archived: "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    draft: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <Link
        to="/ob-admin/gallery/$id/images"
        params={{ id: item.id }}
        className="relative aspect-video bg-muted overflow-hidden block"
      >
        {item.coverImage ? (
          <img src={item.coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <IconPhoto className="size-8" />
          </div>
        )}
        <span
          className={`absolute top-2 left-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[item.status] ?? statusStyles.draft}`}
        >
          {item.status === "published" ? "Published" : item.status === "archived" ? "Archived" : "Draft"}
        </span>
      </Link>
      <CardContent className="p-4 flex-1 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <IconDotsVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                render={<Link to="/ob-admin/gallery/$id/images" params={{ id: item.id }} />}
              >
                <IconPencil className="size-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <IconTrash className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {item.linkedTitle && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {item.obEventId ? (
              <IconCalendarEvent className="size-3.5 shrink-0" />
            ) : (
              <IconHeart className="size-3.5 shrink-0" />
            )}
            <span className="line-clamp-1">{item.linkedTitle}</span>
          </div>
        )}
        <div className="mt-auto pt-1 text-[11px] text-muted-foreground">
          {item.imageCount} {item.imageCount === 1 ? "photo" : "photos"}
        </div>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute("/ob-admin/gallery")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(orpc.ob.obGallery.list.queryOptions({}));
  },
  component: OBAdminGallery,
});

function OBAdminGallery() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: galleries = [] } = useSuspenseQuery(orpc.ob.obGallery.list.queryOptions({}));

  const deleteMutation = useMutation(
    orpc.ob.obGallery.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Gallery deleted");
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: orpc.ob.obGallery.key() });
      },
      onError: (err) => toast.error(err.message || "Failed to delete gallery"),
    }),
  );

  const deleteTarget = galleries.find((g) => g.id === deleteId);

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Gallery</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <IconPlus className="mr-1 size-4" />
            New Gallery
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        {galleries.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No galleries yet. Create one, add photos, then publish it when it's ready.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {galleries.map((item) => (
              <GalleryCard
                key={item.id}
                item={item}
                onDelete={() => setDeleteId(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Gallery</DialogTitle>
            <DialogDescription>
              Create a gallery on its own, or link it to an event or donation. You'll add photos
              next, then publish it when it's ready.
            </DialogDescription>
          </DialogHeader>
          <OBGalleryForm
            mode="create"
            onSuccess={(result) => {
              setCreateOpen(false);
              if (result?.id) {
                navigate({ to: "/ob-admin/gallery/$id/images", params: { id: result.id } });
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Gallery</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This removes
              every photo in it and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
