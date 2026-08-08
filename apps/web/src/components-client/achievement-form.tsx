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

const createAchievementSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  description: v.optional(v.string()),
  category: v.pipe(v.string(), v.minLength(1, "Category is required")),
  recipientName: v.optional(v.string()),
  recipientType: v.pipe(v.string(), v.minLength(1, "Recipient type is required")),
  year: v.optional(v.union([v.number(), v.string()])),
  coverImage: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
})

type CreateAchievementValues = v.InferOutput<typeof createAchievementSchema>

const updateAchievementSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  description: v.optional(v.string()),
  category: v.pipe(v.string(), v.minLength(1, "Category is required")),
  recipientName: v.optional(v.string()),
  recipientType: v.pipe(v.string(), v.minLength(1, "Recipient type is required")),
  year: v.optional(v.union([v.number(), v.string()])),
  coverImage: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
})

type UpdateAchievementValues = v.InferOutput<typeof updateAchievementSchema>

const fields: FieldEntry<CreateAchievementValues | UpdateAchievementValues>[] = [
  { name: "title", kind: "text", label: "Title", placeholder: "Enter achievement title", required: true },
  { name: "description", kind: "textarea", label: "Description", placeholder: "Describe the achievement", required: false },
  { name: "category", kind: "select", label: "Category", required: true, options: [
    { value: "academic", label: "Academic" },
    { value: "sports", label: "Sports" },
    { value: "arts", label: "Arts" },
    { value: "clubs", label: "Clubs" },
    { value: "community", label: "Community" },
    { value: "other", label: "Other" },
  ]},
  { name: "recipientName", kind: "text", label: "Recipient Name", placeholder: "Name of recipient", required: false },
  { name: "recipientType", kind: "select", label: "Recipient Type", required: true, options: [
    { value: "student", label: "Student" },
    { value: "faculty", label: "Faculty" },
    { value: "school", label: "School" },
  ]},
  { name: "year", kind: "text", label: "Year", placeholder: "e.g. 2025", required: false },
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
      <label className="text-sm font-medium leading-none">Cover Image (1:1)</label>
      {coverImage ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img src={coverImage} alt="Cover" className="w-full aspect-square object-cover pointer-events-none" />
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
          aspect={1}
          cropTitle="Crop Cover Image"
          className={cn("aspect-square justify-center", uploading && "opacity-50 pointer-events-none")}
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

export function AchievementForm({
  mode,
  id,
  onSuccess,
}: {
  mode: "create" | "edit"
  id?: string
  onSuccess?: () => void
}) {
  const queryClient = useQueryClient()

  const existingAchievement = useQuery({
    queryKey: ["achievements", id],
    queryFn: () => client.achievements.get({ id: id! }),
    enabled: mode === "edit" && !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: CreateAchievementValues | UpdateAchievementValues) => {
      if (mode === "create") {
        return client.achievements.create(values as any)
      }
      return client.achievements.update({ id: id!, ...values } as any)
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Achievement created" : "Achievement updated")
      queryClient.invalidateQueries({ queryKey: ["achievements"] })
      onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const achievement = existingAchievement.data

  const config: FormConfig<CreateAchievementValues | UpdateAchievementValues> = {
    fields,
    layout: [
      { columns: [{ fields: ["title"] }] },
      { columns: [{ fields: ["category"], span: 1 }, { fields: ["recipientType"], span: 1 }] },
      { columns: [{ fields: ["recipientName"] }] },
      { columns: [{ fields: ["year"] }] },
      { columns: [{ fields: ["description"] }] },
      { columns: [{ fields: ["publishNow"] }] },
    ],
    submitLabel: mode === "create" ? "Create Achievement" : "Save Changes",
    onCancel: () => onSuccess?.(),
    renderAboveFields: () => <CoverImageField />,
    renderBelowFields: () => <TagsField />,
  }

  if (mode === "edit" && existingAchievement.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded bg-muted animate-pulse" />
        <div className="h-[300px] rounded bg-muted animate-pulse" />
      </div>
    )
  }

  if (mode === "edit" && !existingAchievement.data) {
    return <div className="p-4 text-center text-muted-foreground">Achievement not found.</div>
  }

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createAchievementSchema : updateAchievementSchema}
      defaultValues={
        achievement
          ? {
              title: achievement.title,
              description: achievement.description ?? "",
              category: achievement.category,
              recipientName: achievement.recipientName ?? "",
              recipientType: achievement.recipientType,
              year: achievement.year ?? "",
              coverImage: achievement.coverImage ?? "",
              tags: achievement.tags ?? [],
              publishNow: achievement.status === "published",
            }
          : {
              title: "",
              description: "",
              category: "",
              recipientName: "",
              recipientType: "student",
              year: "",
              coverImage: "",
              tags: [],
              publishNow: false,
            }
      }
      mutationOptions={{
        mutationFn: async ({ body }: { body: CreateAchievementValues | UpdateAchievementValues }) => mutation.mutateAsync(body),
      }}
    />
  )
}
