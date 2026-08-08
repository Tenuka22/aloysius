"use client"

import { useCallback, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@aloysius-web/ui/components/button"
import { Input } from "@aloysius-web/ui/components/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@aloysius-web/ui/components/dialog"
import { MinimalTiptapEditor } from "@aloysius-web/ui/components/minimal-tiptap"
import { Dropzone } from "@/components/file-upload"
import { IconX } from "@tabler/icons-react"
import { cn } from "@aloysius-web/ui/lib/utils"
import { client } from "@/utils/orpc"
import { convertToWebp } from "@/utils/convert-to-webp"
import { toast } from "sonner"

export const Route = createFileRoute("/admin/pages_/$id/edit")({
  component: EditPageDialog,
})

function EditPageDialog() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: page, isLoading } = useQuery({
    queryKey: ["pages", id],
    queryFn: () => client.pages.get({ id }),
  })

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [status, setStatus] = useState("draft")
  const [initialized, setInitialized] = useState(false)
  const [uploading, setUploading] = useState(false)

  if (page && !initialized) {
    setTitle(page.title)
    setContent(page.content)
    setExcerpt(page.excerpt ?? "")
    setCoverImage(page.coverImage ?? null)
    setStatus(page.status)
    setInitialized(true)
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      client.pages.update({
        id,
        title,
        content,
        excerpt: excerpt || undefined,
        coverImage: coverImage ?? undefined,
        status,
      }),
    onSuccess: () => {
      toast.success("Page updated")
      queryClient.invalidateQueries({ queryKey: ["pages"] })
      navigate({ to: "/admin/pages" })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const handleImageUpload = useCallback(async (file: File) => {
    const webp = await convertToWebp(file)
    const result = await client.files.uploadFile(webp)
    return result.url
  }, [])

  const handleCoverUpload = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    try {
      const webp = await convertToWebp(file)
      const result = await client.files.uploadFile(webp)
      setCoverImage(result.url)
    } catch {
      toast.error("Failed to upload cover image")
    } finally {
      setUploading(false)
    }
  }, [])

  const handleCoverRemove = useCallback(() => {
    setCoverImage(null)
  }, [])

  return (
    <Dialog open onOpenChange={(open) => { if (!open) navigate({ to: "/admin/pages" }) }}>
      <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Page</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6 p-1">
            <div className="h-10 rounded bg-muted animate-pulse" />
            <div className="h-10 rounded bg-muted animate-pulse" />
            <div className="h-[300px] rounded bg-muted animate-pulse" />
          </div>
        ) : !page ? (
          <div className="p-4 text-center text-muted-foreground">Page not found.</div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page title"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">Slug</label>
              <Input
                value={page.slug}
                readOnly
                disabled
                className="font-mono text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">Cover Image</label>
              {coverImage ? (
                <div className="relative overflow-hidden rounded-xl border">
                  <img src={coverImage} alt="Cover" className="w-full aspect-video object-cover pointer-events-none" />
                  <Button
                    variant="destructive"
                    size="sm"
                    type="button"
                    className="absolute top-2 right-2 z-10 gap-1.5"
                    onClick={handleCoverRemove}
                  >
                    <IconX className="size-4" />
                    Remove
                  </Button>
                </div>
              ) : (
                <Dropzone
                  onFilesSelected={handleCoverUpload}
                  maxFiles={1}
                  maxSize={10 * 1024 * 1024}
                  disabled={uploading}
                  crop
                  aspect={16 / 9}
                  cropTitle="Crop Cover Image"
                  className={cn("aspect-video", uploading && "opacity-50 pointer-events-none")}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">Excerpt</label>
              <Input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">Content</label>
              <MinimalTiptapEditor
                value={content}
                onChange={(val) => setContent(typeof val === "string" ? val : JSON.stringify(val))}
                onImageUpload={handleImageUpload}
                className="min-h-[300px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => navigate({ to: "/admin/pages" })}>
                Cancel
              </Button>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !title.trim()}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
