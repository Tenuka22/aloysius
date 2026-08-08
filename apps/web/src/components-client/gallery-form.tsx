"use client"

import { useCallback, useState } from "react"
import { useStore } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@aloysius-web/ui/components/button"
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder"
import { TagInput } from "@/components-client/tag-input"
import { Dropzone } from "@/components/file-upload"
import { IconX } from "@tabler/icons-react"
import { cn } from "@aloysius-web/ui/lib/utils"
import { client } from "@/utils/orpc"
import { convertToWebp } from "@/utils/convert-to-webp"
import { toast } from "sonner"
import * as v from "valibot"
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder"

const createGallerySchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  description: v.optional(v.string()),
  eventId: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
})

type CreateGalleryValues = v.InferOutput<typeof createGallerySchema>

const updateGallerySchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  description: v.optional(v.string()),
  eventId: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
})

type UpdateGalleryValues = v.InferOutput<typeof updateGallerySchema>

const fields: FieldEntry<CreateGalleryValues | UpdateGalleryValues>[] = [
  { name: "title", kind: "text", label: "Title", placeholder: "Enter album title", required: true },
  { name: "description", kind: "textarea", label: "Description", placeholder: "Brief description of this album", required: false },
  { name: "eventId", kind: "text", label: "Event ID", placeholder: "Optional event ID to link", required: false },
  { name: "coverImage", kind: "text", label: "Cover Image", hidden: true, required: false },
  { name: "tags", kind: "text", label: "Tags", hidden: true, required: false },
  { name: "publishNow", kind: "checkbox", label: "Publish immediately", required: false },
]

function CoverImageField() {
  const form = useBuildForm()
  const coverImage = useStore(form.store, (state: any) => state.values.coverImage) as string | undefined
  const [uploading, setUploading] = useState(false)

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    try {
      const webp = await convertToWebp(file)
      const result = await client.files.uploadFile(webp)
      form.setFieldValue("coverImage", result.url)
    } catch {
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }, [form])

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    form.setFieldValue("coverImage", "")
  }, [form])

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Cover Image (16:9)</label>
      {coverImage ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img src={coverImage} alt="Cover" className="w-full aspect-[16/9] object-cover pointer-events-none" />
          <Button
            variant="destructive"
            size="sm"
            type="button"
            className="absolute top-2 right-2 z-10 gap-1.5"
            onClick={handleRemove}
          >
            <IconX className="size-4" />
            Remove
          </Button>
        </div>
      ) : (
        <Dropzone
          onFilesSelected={handleFilesSelected}
          maxFiles={1}
          maxSize={10 * 1024 * 1024}
          disabled={uploading}
          crop
          aspect={16 / 9}
          cropTitle="Crop Cover Image"
          className={cn("aspect-[16/9] justify-center", uploading && "opacity-50 pointer-events-none")}
        />
      )}
    </div>
  )
}

function TagsField() {
  const form = useBuildForm()
  const tags = (form.state.values.tags as string[]) ?? []

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Tags</label>
      <TagInput
        value={tags}
        onChange={(newTags) => form.setFieldValue("tags", newTags)}
        placeholder="Add a tag"
      />
    </div>
  )
}

export function GalleryForm({
  mode,
  id,
  onSuccess,
}: {
  mode: "create" | "edit"
  id?: string
  onSuccess?: () => void
}) {
  const queryClient = useQueryClient()

  const existingGallery = useQuery({
    queryKey: ["gallery", id],
    queryFn: () => client.gallery.get({ id: id! }),
    enabled: mode === "edit" && !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: CreateGalleryValues | UpdateGalleryValues) => {
      if (mode === "create") {
        return client.gallery.create(values as CreateGalleryValues)
      }
      return client.gallery.update({ id: id!, ...values })
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Gallery album created" : "Gallery album updated")
      queryClient.invalidateQueries({ queryKey: ["gallery"] })
      onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const gallery = existingGallery.data

  const config: FormConfig<CreateGalleryValues | UpdateGalleryValues> = {
    fields,
    layout: [
      { columns: [{ fields: ["title"] }] },
      { columns: [{ fields: ["description"] }] },
      { columns: [{ fields: ["eventId"] }] },
      { columns: [{ fields: ["publishNow"] }] },
    ],
    submitLabel: mode === "create" ? "Create Album" : "Save Changes",
    onCancel: () => onSuccess?.(),
    renderAboveFields: () => <CoverImageField />,
    renderBelowFields: () => <TagsField />,
  }

  if (mode === "edit" && existingGallery.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded bg-muted animate-pulse" />
        <div className="h-40 rounded bg-muted animate-pulse" />
      </div>
    )
  }

  if (mode === "edit" && !existingGallery.data) {
    return <div className="p-4 text-center text-muted-foreground">Gallery album not found.</div>
  }

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createGallerySchema : updateGallerySchema}
      defaultValues={
        gallery
          ? {
              title: gallery.title,
              description: gallery.description ?? "",
              eventId: gallery.eventId ?? "",
              coverImage: gallery.coverImage ?? "",
              tags: gallery.tags ?? [],
              publishNow: gallery.status === "published",
            }
          : {
              title: "",
              description: "",
              eventId: "",
              coverImage: "",
              tags: [],
              publishNow: false,
            }
      }
      mutationOptions={{
        mutationFn: async ({ body }: { body: CreateGalleryValues | UpdateGalleryValues }) => mutation.mutateAsync(body),
      }}
    />
  )
}
