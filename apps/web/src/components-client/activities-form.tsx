"use client"

import { useCallback, useState } from "react"
import { useStore } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@aloysius-web/ui/components/button"
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder"
import { MinimalTiptapEditor } from "@aloysius-web/ui/components/minimal-tiptap"
import { Dropzone } from "@/components/file-upload"
import { IconX, IconGripVertical } from "@tabler/icons-react"
import { cn } from "@aloysius-web/ui/lib/utils"
import { client } from "@/utils/orpc"
import { convertToWebp } from "@/utils/convert-to-webp"
import { toast } from "sonner"
import * as v from "valibot"
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder"

const createActivitySchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  description: v.optional(v.string()),
  content: v.string(),
  coverImage: v.optional(v.string()),
  images: v.array(v.string()),
  type: v.string(),
  adminEmail: v.optional(v.string()),
  sortOrder: v.number(),
  status: v.string(),
})

type CreateActivityValues = v.InferOutput<typeof createActivitySchema>

const updateActivitySchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  description: v.optional(v.string()),
  content: v.string(),
  coverImage: v.optional(v.string()),
  images: v.array(v.string()),
  type: v.string(),
  adminEmail: v.optional(v.string()),
  sortOrder: v.number(),
  status: v.string(),
})

type UpdateActivityValues = v.InferOutput<typeof updateActivitySchema>

const fields: FieldEntry<CreateActivityValues | UpdateActivityValues>[] = [
  {
    name: "name",
    kind: "text",
    label: "Name",
    placeholder: "Activity name",
    required: true,
    hidden: true,
  },
  {
    name: "content",
    kind: "text",
    label: "Content",
    hidden: true,
    required: true,
  },
  {
    name: "coverImage",
    kind: "text",
    label: "Cover Image URL",
    hidden: true,
    required: false,
  },
  {
    name: "images",
    kind: "text",
    label: "Images",
    hidden: true,
    required: false,
  },
  {
    name: "type",
    kind: "select",
    label: "Type",
    options: [
      { value: "club", label: "Club" },
      { value: "sport", label: "Sport" },
      { value: "other", label: "Other" },
    ],
    required: true,
    hidden: true,
  },
  {
    name: "adminEmail",
    kind: "text",
    label: "Admin Email",
    hidden: true,
    required: false,
  },
  {
    name: "sortOrder",
    kind: "number",
    label: "Sort Order",
    required: false,
    hidden: true,
  },
  {
    name: "status",
    kind: "select",
    label: "Status",
    options: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
      { value: "archived", label: "Archived" },
    ],
    required: true,
    hidden: true,
  },
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
      <label className="text-sm font-medium leading-none">Cover Image</label>
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
          className={cn("h-[208px]", uploading && "opacity-50 pointer-events-none")}
        />
      )}
    </div>
  )
}

function NameField() {
  const form = useBuildForm()
  const value = useStore(form.store, (state: any) => state.values.name) as string

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Name <span className="text-destructive">*</span></label>
      <input
        type="text"
        value={value}
        onChange={(e) => form.setFieldValue("name", e.target.value)}
        placeholder="Activity name"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  )
}

function TypeField() {
  const form = useBuildForm()
  const value = useStore(form.store, (state: any) => state.values.type) as string

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Type <span className="text-destructive">*</span></label>
      <select
        value={value}
        onChange={(e) => form.setFieldValue("type", e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="club">Club</option>
        <option value="sport">Sport</option>
        <option value="other">Other</option>
      </select>
    </div>
  )
}

function AdminEmailField() {
  const form = useBuildForm()
  const value = useStore(form.store, (state: any) => state.values.adminEmail) as string ?? ""
  const type = useStore(form.store, (state: any) => state.values.type) as string

  if (type === "academic") return null

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Administrator Email</label>
      <p className="text-xs text-muted-foreground">The administrator responsible for managing this {type}.</p>
      <input
        type="email"
        value={value}
        onChange={(e) => form.setFieldValue("adminEmail", e.target.value)}
        placeholder="admin@example.com"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  )
}

function StatusField() {
  const form = useBuildForm()
  const value = useStore(form.store, (state: any) => state.values.status) as string

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Status <span className="text-destructive">*</span></label>
      <select
        value={value}
        onChange={(e) => form.setFieldValue("status", e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>
    </div>
  )
}

function SortOrderField() {
  const form = useBuildForm()
  const value = useStore(form.store, (state: any) => state.values.sortOrder) as number

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Sort Order</label>
      <input
        type="number"
        value={value}
        onChange={(e) => form.setFieldValue("sortOrder", Number(e.target.value))}
        min={0}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  )
}

function ImagesField() {
  const form = useBuildForm()
  const images = useStore(form.store, (state: any) => state.values.images) as string[] ?? []
  const [uploading, setUploading] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of files) {
        const webp = await convertToWebp(file)
        const result = await client.files.uploadFile(webp)
        uploaded.push(result.url)
      }
      form.setFieldValue("images", [...images, ...uploaded])
    } catch {
      toast.error("Failed to upload images")
    } finally {
      setUploading(false)
    }
  }, [form, images])

  const handleRemove = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = images.filter((_: string, i: number) => i !== index)
    form.setFieldValue("images", next)
  }, [form, images])

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleDragOver = useCallback((_index: number, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const handleDrop = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const next = [...images]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    form.setFieldValue("images", next)
    setDragIndex(null)
  }, [form, images, dragIndex])

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Gallery Images (16:9)</label>
      <p className="text-xs text-muted-foreground">Upload multiple images. Drag to reorder.</p>
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0 overflow-hidden">
          {images.length > 0 ? (
            <div className="rounded-lg border bg-muted/30 p-2 max-h-40 overflow-y-auto overflow-x-hidden">
              <div className="flex gap-2 flex-wrap">
                {images.map((url: string, index: number) => (
                  <div
                    key={`${url}-${index}`}
                    className="relative group overflow-hidden rounded-lg border bg-background w-36 shrink-0"
                    draggable
                    onDragStart={(e) => handleDragStart(index, e)}
                    onDragOver={(e) => handleDragOver(index, e)}
                    onDrop={(e) => handleDrop(index, e)}
                  >
                    <img src={url} alt={`Image ${index + 1}`} className="w-full aspect-video object-cover pointer-events-none" />
                    <div className="absolute top-0.5 left-0.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-background/80 backdrop-blur-sm rounded p-0.5 cursor-grab active:cursor-grabbing">
                        <IconGripVertical className="size-3 text-muted-foreground" />
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      type="button"
                      className="absolute top-0.5 right-0.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 p-0"
                      onClick={(e) => handleRemove(index, e)}
                    >
                      <IconX className="size-2.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4 h-40 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">No images uploaded yet</p>
            </div>
          )}
        </div>
        <div className="w-auto shrink-0">
          <Dropzone
            onFilesSelected={handleFilesSelected}
            maxFiles={20}
            maxSize={10 * 1024 * 1024}
            disabled={uploading}
            crop
            aspect={16 / 9}
            cropTitle="Crop Image"
            className={cn("h-40", uploading && "opacity-50 pointer-events-none")}
          />
        </div>
      </div>
    </div>
  )
}

function DescriptionEditorField() {
  const form = useBuildForm()
  const handleImageUpload = useCallback(async (file: File) => {
    const webp = await convertToWebp(file)
    const result = await client.files.uploadFile(webp)
    return result.url
  }, [])

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Description</label>
      <MinimalTiptapEditor
        value={form.state.values.content as string}
        onChange={(value) => form.setFieldValue("content", typeof value === "string" ? value : JSON.stringify(value))}
        onImageUpload={handleImageUpload}
        placeholder="Describe this activity..."
      />
    </div>
  )
}

export function ActivitiesForm({ mode, id, onSuccess }: { mode: "create" | "edit"; id?: string; onSuccess: () => void }) {
  const queryClient = useQueryClient()

  const { data: activity, isLoading: isLoadingItem } = useQuery({
    queryKey: ["activities", id],
    queryFn: () => client.activities.get({ id: id! }),
    enabled: mode === "edit" && !!id,
  })

  const createMutation = useMutation({
    mutationFn: (body: any) => client.activities.create(body),
    onSuccess: () => { toast.success("Activity created"); queryClient.invalidateQueries({ queryKey: ["activities"] }); onSuccess() },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (body: any) => client.activities.update(body),
    onSuccess: () => { toast.success("Activity updated"); queryClient.invalidateQueries({ queryKey: ["activities"] }); onSuccess() },
    onError: (err) => toast.error(err.message),
  })

  const handleSubmit = useCallback(async (values: CreateActivityValues | UpdateActivityValues) => {
    if (mode === "edit" && id) await updateMutation.mutateAsync({ ...values, id })
    else await createMutation.mutateAsync(values)
  }, [mode, id, createMutation, updateMutation])

  if (mode === "edit" && isLoadingItem) {
    return <div className="space-y-6 p-1"><div className="h-10 rounded bg-muted animate-pulse" /><div className="h-20 rounded bg-muted animate-pulse" /><div className="h-[300px] rounded bg-muted animate-pulse" /></div>
  }

  if (mode === "edit" && !activity) return <div className="p-4 text-center text-muted-foreground">Activity not found.</div>

  const formConfig: FormConfig<CreateActivityValues | UpdateActivityValues> = {
    fields,
    layout: [
      { columns: [{ fields: ["publishNow"] }] },
    ],
    submitLabel: mode === "create" ? "Create Activity" : "Save Changes",
    hooks: {
      beforeSubmit: (values) => ({
        ...values,
        description: values.description || undefined,
        coverImage: values.coverImage || undefined,
        type: values.type as "club" | "sport" | "other",
        adminEmail: values.adminEmail || undefined,
        status: values.status as "draft" | "published" | "archived",
      }),
    },
    renderAboveFields: () => (
      <div className="space-y-6">
        <div className="flex gap-6">
          <div className="w-[280px] shrink-0">
            <CoverImageField />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <NameField />
            <TypeField />
            <AdminEmailField />
            <StatusField />
            <SortOrderField />
          </div>
        </div>
        <ImagesField />
        <DescriptionEditorField />
      </div>
    ),
  }

  return (
    <FormBuilder<CreateActivityValues | UpdateActivityValues>
      config={formConfig}
      defaultValues={
        mode === "edit" && activity
          ? { name: activity.name, description: activity.description ?? "", content: "", coverImage: activity.coverImage ?? "", images: (activity.images as string[]) ?? [], type: activity.type, adminEmail: activity.adminEmail ?? "", sortOrder: activity.sortOrder, status: activity.status }
          : { name: "", description: "", content: "", coverImage: "", images: [] as string[], type: "club", adminEmail: "", sortOrder: 0, status: "draft" }
      }
      valibotSchema={mode === "create" ? createActivitySchema : updateActivitySchema}
      onSubmit={handleSubmit}
      submitting={createMutation.isPending || updateMutation.isPending}
    />
  )
}
