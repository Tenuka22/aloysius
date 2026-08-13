"use client";

import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { Input } from "@aloysius-web/ui/components/input";
import { Textarea } from "@aloysius-web/ui/components/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { Dropzone } from "@/components/file-upload";
import { IconPhoto, IconPlus, IconTrash, IconStar, IconX } from "@tabler/icons-react";
import { cn } from "@aloysius-web/ui/lib/utils";
import { client } from "@/utils/orpc";
import { convertToWebp } from "@/utils/convert-to-webp";
import { toast } from "sonner";

type Album = {
  id: string;
  activityId: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  reviewStatus: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  featuredOnHome: boolean;
  userId: string;
  imageCount: number;
  clubName: string | null;
  createdAt: string;
  updatedAt: string;
};

type AlbumImage = {
  id: string;
  albumId: string;
  url: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
};

const reviewStyles: Record<string, string> = {
  approved: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const reviewLabels: Record<string, string> = {
  approved: "Approved",
  pending: "Pending Review",
  rejected: "Rejected",
};

export function ClubAlbums({
  activityId,
  isSiteAdmin,
  isClubAdmin = false,
  myUserId,
}: {
  activityId: string;
  isSiteAdmin: boolean;
  isClubAdmin?: boolean;
  myUserId?: string | null;
}) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["clubAlbums", activityId],
    queryFn: () => client.clubAlbums.list({ activityId, pageSize: 50 }),
  });

  const albums = (data?.rows ?? []) as Album[];

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["clubAlbums", activityId] });
    queryClient.invalidateQueries({ queryKey: ["clubAlbums", viewId] });
  }, [queryClient, activityId, viewId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Photo albums released by this club. Albums go live after a site admin approves them.
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <IconPlus className="mr-1 size-4" />
          New Album
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <IconPhoto className="size-8 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No albums yet</h3>
          <p className="text-sm text-muted-foreground">
            Upload a photo album to share moments with the club. It will be reviewed by a site
            admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((album) => (
            <button
              key={album.id}
              type="button"
              onClick={() => setViewId(album.id)}
              className="group rounded-xl border bg-card overflow-hidden text-left hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                {album.coverImage ? (
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IconPhoto className="size-8 text-muted-foreground/40" />
                  </div>
                )}
                <span
                  className={cn(
                    "absolute top-2 left-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    reviewStyles[album.reviewStatus] ?? reviewStyles.pending,
                  )}
                >
                  {reviewLabels[album.reviewStatus] ?? "Pending Review"}
                </span>
                {album.featuredOnHome && (
                  <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
                    <IconStar className="mr-1 size-3" />
                    Featured
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold group-hover:text-primary transition-colors">
                    {album.title}
                  </h4>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {album.imageCount} photo{album.imageCount === 1 ? "" : "s"}
                  </span>
                </div>
                {album.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {album.description}
                  </p>
                )}
                {album.rejectionReason && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Reason: {album.rejectionReason}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {createOpen && (
        <CreateAlbumDialog
          activityId={activityId}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={() => {
            setCreateOpen(false);
            invalidate();
          }}
        />
      )}

      {viewId && (
        <ViewAlbumDialog
          albumId={viewId}
          open={!!viewId}
          onOpenChange={(open) => {
            if (!open) {
              setViewId(null);
              invalidate();
            }
          }}
          isSiteAdmin={isSiteAdmin}
          canManage={isSiteAdmin || isClubAdmin}
          myUserId={myUserId}
        />
      )}
    </div>
  );
}

function CreateAlbumDialog({
  activityId,
  open,
  onOpenChange,
  onSuccess,
}: {
  activityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const createAlbum = useMutation({
    mutationFn: () =>
      client.clubAlbums.create({ activityId, title, description: description || undefined }),
    onSuccess: async (data) => {
      const album = data as Album;
      // Upload any photos first, then attach them to the album
      for (const url of photos) {
        await client.clubAlbums.addImage({ albumId: album.id, url });
      }
      toast.success("Album created — pending site admin approval");
      queryClient.invalidateQueries({ queryKey: ["clubAlbums", activityId] });
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const webp = await convertToWebp(file);
        const result = await client.files.uploadFile(webp);
        urls.push(result.url);
      }
      setPhotos((prev) => [...prev, ...urls]);
    } catch {
      toast.error("Failed to upload photos");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Album title is required");
      return;
    }
    createAlbum.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(90vw,640px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Photo Album</DialogTitle>
          <DialogDescription>
            Upload photos from club activities. A site admin will approve the album before it is
            visible to others.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Sports Meet 2025"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this album about?"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">Photos ({photos.length})</label>
            <Dropzone
              onFilesSelected={handleFilesSelected}
              maxFiles={20}
              maxSize={10 * 1024 * 1024}
              disabled={uploading}
              className={cn("h-32", uploading && "opacity-50 pointer-events-none")}
            />
            {photos.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2">
                {photos.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="relative group overflow-hidden rounded-lg border"
                  >
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      type="button"
                      className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <IconX className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createAlbum.isPending || uploading}>
            {createAlbum.isPending ? "Creating..." : "Create Album"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewAlbumDialog({
  albumId,
  open,
  onOpenChange,
  isSiteAdmin,
  canManage,
  myUserId,
}: {
  albumId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSiteAdmin: boolean;
  canManage: boolean;
  myUserId?: string | null;
}) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["clubAlbums", albumId],
    queryFn: () => client.clubAlbums.get({ id: albumId }),
    enabled: open,
  });

  const album = (data?.album as Album | undefined) ?? null;
  const images = (data?.images as AlbumImage[] | undefined) ?? [];

  const isAuthor = !!myUserId && album?.userId === myUserId;
  const canEdit = canManage || isAuthor;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["clubAlbums", albumId] });
  }, [queryClient, albumId]);

  const addImages = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        const webp = await convertToWebp(file);
        const result = await client.files.uploadFile(webp);
        await client.clubAlbums.addImage({ albumId, url: result.url });
      }
    },
    onSuccess: () => {
      toast.success("Photos added");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeImage = useMutation({
    mutationFn: (id: string) => client.clubAlbums.removeImage({ id }),
    onSuccess: () => {
      toast.success("Photo removed");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteAlbum = useMutation({
    mutationFn: () => client.clubAlbums.delete({ id: albumId }),
    onSuccess: () => {
      toast.success("Album deleted");
      setDeleteOpen(false);
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleFeatured = useMutation({
    mutationFn: (featured: boolean) => client.clubAlbums.setFeatured({ id: albumId, featured }),
    onSuccess: () => {
      toast.success("Album feature updated");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setUploading(true);
      addImages.mutate(files, {
        onSettled: () => setUploading(false),
      });
    },
    [addImages],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[min(90vw,900px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 flex-wrap pr-8">
              <DialogTitle>{album?.title ?? "Album"}</DialogTitle>
              {album && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    reviewStyles[album.reviewStatus] ?? reviewStyles.pending,
                  )}
                >
                  {reviewLabels[album.reviewStatus] ?? "Pending Review"}
                </span>
              )}
            </div>
            <DialogDescription>
              {album?.description || `${album?.imageCount ?? images.length} photos`}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {album?.rejectionReason && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
                  Rejected: {album.rejectionReason}
                </p>
              )}

              {images.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                  No photos yet. Upload some below.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="group relative overflow-hidden rounded-lg border bg-muted"
                    >
                      <img
                        src={image.url}
                        alt={image.caption ?? "Album photo"}
                        className="aspect-square w-full object-cover"
                      />
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => removeImage.mutate(image.id)}
                          disabled={removeImage.isPending}
                          className="absolute top-2 right-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                          aria-label="Remove photo"
                        >
                          <IconTrash className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {canEdit && (
                <Dropzone
                  onFilesSelected={handleFilesSelected}
                  maxFiles={20}
                  maxSize={10 * 1024 * 1024}
                  disabled={uploading}
                  className={cn("h-32", uploading && "opacity-50 pointer-events-none")}
                />
              )}
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            {isSiteAdmin && album?.reviewStatus === "approved" && (
              <Button
                variant={album.featuredOnHome ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFeatured.mutate(!album.featuredOnHome)}
                disabled={toggleFeatured.isPending}
                className="mr-auto"
              >
                <IconStar className="mr-1 size-4" />
                {album.featuredOnHome ? "Featured on Home" : "Feature on Home"}
              </Button>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <IconTrash className="mr-1 size-4" />
                Delete Album
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Album</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this album and all its photos? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteAlbum.mutate()}
              disabled={deleteAlbum.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
