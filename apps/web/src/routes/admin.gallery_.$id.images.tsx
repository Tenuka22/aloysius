"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar"
import { Separator } from "@aloysius-web/ui/components/separator"
import { Button } from "@aloysius-web/ui/components/button"
import { Input } from "@aloysius-web/ui/components/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog"
import { IconTrash } from "@tabler/icons-react"
import { Dropzone } from "@/components/file-upload"
import { cn } from "@aloysius-web/ui/lib/utils"
import { client } from "@/utils/orpc"
import { convertToWebp } from "@/utils/convert-to-webp"
import { toast } from "sonner"

type GalleryImage = {
  id: string
  galleryId: string
  url: string
  caption: string | null
  sortOrder: number
  createdAt: string
}

export const Route = createFileRoute("/admin/gallery_/$id/images")({
  component: GalleryImagesPage,
})

function GalleryImagesPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const { data: gallery } = useQuery({
    queryKey: ["gallery", id],
    queryFn: () => client.gallery.get({ id }),
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["gallery", id, "images"],
    queryFn: ({ pageParam = 1 }) =>
      client.gallery.listImages({ galleryId: id, page: pageParam, pageSize: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pageCount ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  })

  const images = data?.pages.flatMap((page) => page.rows) ?? []

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const addImage = useMutation({
    mutationFn: (body: { galleryId: string; url: string; caption?: string }) =>
      client.gallery.addImage(body),
    onSuccess: () => {
      toast.success("Image added")
      queryClient.invalidateQueries({ queryKey: ["gallery", id, "images"] })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const removeImage = useMutation({
    mutationFn: (imageId: string) => client.gallery.removeImage({ id: imageId }),
    onSuccess: () => {
      toast.success("Image removed")
      queryClient.invalidateQueries({ queryKey: ["gallery", id, "images"] })
      setDeleteImageId(null)
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const updateImage = useMutation({
    mutationFn: (body: { id: string; caption?: string; sortOrder?: number }) =>
      client.gallery.updateImage(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery", id, "images"] })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setUploading(true)
    try {
      for (const file of files) {
        const webp = await convertToWebp(file)
        const result = await client.files.uploadFile(webp)
        await addImage.mutateAsync({ galleryId: id, url: result.url })
      }
    } catch {
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }, [id, addImage])

  const handleCaptionChange = useCallback((imageId: string, caption: string) => {
    updateImage.mutate({ id: imageId, caption })
  }, [updateImage])

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link to="/admin/gallery" />}>
            Gallery
          </Button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-semibold">{gallery?.title ?? "Album"}</h1>
        </div>
      </header>
      <div className="flex-1 p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Cover Image (16:9)</label>
          {gallery?.coverImage ? (
            <div className="relative overflow-hidden rounded-xl border max-w-md">
              <img src={gallery.coverImage} alt="Cover" className="w-full aspect-video object-cover pointer-events-none" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No cover image set.</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Images ({images.length})</label>

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
                <div className="text-muted-foreground py-4 text-center text-sm">Loading more...</div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={!!deleteImageId} onOpenChange={(open) => { if (!open) setDeleteImageId(null) }}>
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
              onClick={() => { if (deleteImageId) removeImage.mutate(deleteImageId) }}
              disabled={removeImage.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ImageCard({
  image,
  onCaptionChange,
  onDelete,
}: {
  image: GalleryImage
  onCaptionChange: (id: string, caption: string) => void
  onDelete: () => void
}) {
  const [caption, setCaption] = useState(image.caption ?? "")

  const handleBlur = useCallback(() => {
    if (caption !== (image.caption ?? "")) {
      onCaptionChange(image.id, caption)
    }
  }, [caption, image.id, image.caption, onCaptionChange])

  return (
    <div className="group relative overflow-hidden rounded-lg border">
      <div className="relative">
        <img
          src={image.url}
          alt={image.caption ?? ""}
          className="aspect-video w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100 flex items-start justify-end p-2 pointer-events-none group-hover:pointer-events-auto">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="shadow-lg"
          >
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
  )
}
