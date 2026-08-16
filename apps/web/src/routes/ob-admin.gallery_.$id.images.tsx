"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import { IconTrash, IconCheck, IconArchive } from "@tabler/icons-react";
import { Dropzone } from "@/components/file-upload";
import { uploadImageWithRatio } from "@/lib/upload-image";
import { cn } from "@aloysius-web/ui/lib/utils";
import { client, orpc } from "@/utils/orpc";
import type { GalleryImage, OBEvent, OBDonation } from "@/lib/api-types";
import { convertToWebp } from "@/utils/convert-to-webp";
import { toast } from "sonner";

export const Route = createFileRoute("/ob-admin/gallery_/$id/images")({
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      orpc.gallery.get.queryOptions({ input: { id: params.id } }),
    );
  },
  component: OBGalleryImagesPage,
});

function OBGalleryImagesPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: gallery } = useSuspenseQuery(orpc.gallery.get.queryOptions({ input: { id } }));

  const backTo = gallery.obDonationId ? "/ob-admin/donations" : "/ob-admin/events";
  const backLabel = gallery.obDonationId ? "Donations" : "Events";

  const [title, setTitle] = useState(gallery.title);
  const [description, setDescription] = useState(gallery.description ?? "");
  const [uploadingCover, setUploadingCover] = useState(false);
  const initialLinkType: "none" | "event" | "donation" = gallery.obEventId
    ? "event"
    : gallery.obDonationId
      ? "donation"
      : "none";
  const [linkType, setLinkType] = useState<"none" | "event" | "donation">(initialLinkType);
  const [linkId, setLinkId] = useState(gallery.obEventId ?? gallery.obDonationId ?? "");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery(
    orpc.gallery.listImages.infiniteOptions({
      input: (pageParam) => ({ galleryId: id, page: pageParam, pageSize: 20 }),
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.pageCount ? lastPage.page + 1 : undefined,
      initialPageParam: 1,
    }),
  );

  const images = data?.pages.flatMap((page) => page.rows) ?? [];

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const addImage = useMutation(
    orpc.ob.obGallery.addImage.mutationOptions({
      onSuccess: () => {
        toast.success("Image added");
        queryClient.invalidateQueries({ queryKey: orpc.gallery.key() });
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const removeImage = useMutation(
    orpc.ob.obGallery.removeImage.mutationOptions({
      onSuccess: () => {
        toast.success("Image removed");
        queryClient.invalidateQueries({ queryKey: orpc.gallery.key() });
        setDeleteImageId(null);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const updateImage = useMutation(
    orpc.ob.obGallery.updateImage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.gallery.key() });
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const releaseMutation = useMutation(
    orpc.ob.obGallery.release.mutationOptions({
      onSuccess: () => {
        toast.success("Gallery published");
        queryClient.invalidateQueries({ queryKey: orpc.gallery.key() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const unreleaseMutation = useMutation(
    orpc.ob.obGallery.unrelease.mutationOptions({
      onSuccess: () => {
        toast.success("Gallery unpublished");
        queryClient.invalidateQueries({ queryKey: orpc.gallery.key() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const updateGalleryMutation = useMutation(
    orpc.ob.obGallery.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.gallery.key() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const { data: events = [] } = useQuery(orpc.ob.obEvents.list.queryOptions({ input: {} }));
  const { data: donations = [] } = useQuery(orpc.ob.obDonations.list.queryOptions({ input: {} }));

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setUploading(true);
      try {
        for (const file of files) {
          const webp = await convertToWebp(file);
          const result = await client.files.uploadFile(webp);
          await addImage.mutateAsync({ galleryId: id, url: result.url });
        }
      } catch {
        toast.error("Failed to upload image");
      } finally {
        setUploading(false);
      }
    },
    [id, addImage],
  );

  const handleCaptionChange = useCallback(
    (imageId: string, caption: string) => {
      updateImage.mutate({ id: imageId, caption });
    },
    [updateImage],
  );

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" render={<Link to={backTo} />}>
            {backLabel}
          </Button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-semibold truncate">{gallery.title}</h1>
        </div>
        <div className="ml-auto shrink-0">
          {gallery.status === "published" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => unreleaseMutation.mutate({ id })}
              disabled={unreleaseMutation.isPending}
            >
              <IconArchive className="mr-1 size-4" />
              {unreleaseMutation.isPending ? "Unpublishing…" : "Unpublish"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => releaseMutation.mutate({ id })}
              disabled={releaseMutation.isPending || images.length === 0}
              title={images.length === 0 ? "Add at least one photo first" : undefined}
            >
              <IconCheck className="mr-1 size-4" />
              {releaseMutation.isPending ? "Publishing…" : "Publish Gallery"}
            </Button>
          )}
        </div>
      </header>
      <div className="flex-1 p-6 space-y-6">
        <div className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim() && title !== gallery.title) {
                  updateGalleryMutation.mutate({ id, title: title.trim() });
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== (gallery.description ?? "")) {
                  updateGalleryMutation.mutate({ id, description });
                }
              }}
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cover Image (16:9)</label>
            <div className="flex items-center gap-3">
              {gallery.coverImage ? (
                <img
                  src={gallery.coverImage}
                  alt="Cover"
                  className="h-20 w-36 rounded-md border object-cover"
                />
              ) : (
                <div className="flex h-20 w-36 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                  No cover
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                id="gallery-cover-upload"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setUploadingCover(true);
                  try {
                    const url = await uploadImageWithRatio(file, 16 / 9);
                    updateGalleryMutation.mutate({ id, coverImage: url });
                  } catch {
                    toast.error("Failed to upload cover image");
                  } finally {
                    setUploadingCover(false);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingCover}
                onClick={() => document.getElementById("gallery-cover-upload")?.click()}
              >
                {uploadingCover ? "Uploading…" : gallery.coverImage ? "Replace" : "Upload"}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Link to</label>
            <Select
              value={linkType}
              onValueChange={(v) => {
                const next = (v as "none" | "event" | "donation") ?? "none";
                setLinkType(next);
                setLinkId("");
                if (next === "none") {
                  updateGalleryMutation.mutate({ id, link: { type: "none" } });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nothing — standalone gallery</SelectItem>
                <SelectItem value="event">An event</SelectItem>
                <SelectItem value="donation">A donation</SelectItem>
              </SelectContent>
            </Select>
            {linkType === "event" && (
              <Select
                value={linkId}
                onValueChange={(v) => {
                  if (!v) return;
                  setLinkId(v);
                  updateGalleryMutation.mutate({ id, link: { type: "event", id: v } });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e: OBEvent) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {linkType === "donation" && (
              <Select
                value={linkId}
                onValueChange={(v) => {
                  if (!v) return;
                  setLinkId(v);
                  updateGalleryMutation.mutate({ id, link: { type: "donation", id: v } });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a donation..." />
                </SelectTrigger>
                <SelectContent>
                  {donations.map((d: OBDonation) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.purpose || `Gift from ${d.isAnonymous ? "Anonymous" : d.donorName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Images ({images.length})</label>
          <p className="text-xs text-muted-foreground">
            Add every photo for this gallery, then publish it when it's ready to go live.
          </p>

          {isLoading ? (
            <div className="text-muted-foreground py-8">Loading images...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <Dropzone
                  onFilesSelected={handleFilesSelected}
                  maxFiles={10}
                  maxSize={10 * 1024 * 1024}
                  disabled={uploading}
                  className={cn("aspect-video", uploading && "opacity-50 pointer-events-none")}
                />
                {images.map((image: GalleryImage) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    onCaptionChange={handleCaptionChange}
                    onDelete={() => setDeleteImageId(image.id)}
                  />
                ))}
              </div>
              <div ref={loadMoreRef} className="h-4" />
              {isFetchingNextPage && (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  Loading more...
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog
        open={!!deleteImageId}
        onOpenChange={(open) => {
          if (!open) setDeleteImageId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteImageId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteImageId) removeImage.mutate({ id: deleteImageId });
              }}
              disabled={removeImage.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImageCard({
  image,
  onCaptionChange,
  onDelete,
}: {
  image: GalleryImage;
  onCaptionChange: (id: string, caption: string) => void;
  onDelete: () => void;
}) {
  const [caption, setCaption] = useState(image.caption ?? "");

  const handleBlur = useCallback(() => {
    if (caption !== (image.caption ?? "")) {
      onCaptionChange(image.id, caption);
    }
  }, [caption, image.id, image.caption, onCaptionChange]);

  return (
    <div className="group relative overflow-hidden rounded-lg border">
      <div className="relative">
        <img
          src={image.url}
          alt={image.caption ?? ""}
          className="aspect-video w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100 flex items-start justify-end p-2 pointer-events-none group-hover:pointer-events-auto">
          <Button variant="destructive" size="sm" onClick={onDelete} className="shadow-lg">
            <IconTrash className="size-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
      <div className="p-2">
        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={handleBlur}
          placeholder="Add caption..."
          className="h-7 text-xs"
        />
      </div>
    </div>
  );
}
