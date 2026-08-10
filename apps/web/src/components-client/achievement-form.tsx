"use client"

import { useCallback, useState } from "react"
import { useStore } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@aloysius-web/ui/components/button"
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder"
import { TagInput } from "@/components-client/tag-input"
import { NameListInput } from "@/components-client/name-list-input"
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
  recipientNames: v.array(v.string()),
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
  recipientNames: v.array(v.string()),
  recipientType: v.pipe(v.string(), v.minLength(1, "Recipient type is required")),
  year: v.optional(v.union([v.number(), v.string()])),
  coverImage: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
})

type UpdateAchievementValues = v.InferOutput<typeof updateAchievementSchema>

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
          <img src={coverImage} alt="Cover" className="w-full aspect-video object-cover pointer-events-none" />
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
          className={cn("aspect-video justify-center", uploading && "opacity-50 pointer-events-none")}
        />
      )}
    </div>
  )
}

function TitleField() {
  const form = useBuildForm()
  const value = useStore(form.store, (state: any) => state.values.title) as string

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Title <span className="text-destructive">*</span></label>
      <input
        type="text"
        value={value}
        onChange={(e) => form.setFieldValue("title", e.target.value)}
        placeholder="Enter achievement title"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}

function CategoryField() {
  const form = useBuildForm()
  const value = useStore(form.store, (state: any) => state.values.category) as string

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Category <span className="text-destructive">*</span></label>
      <select
        value={value}
        onChange={(e) => form.setFieldValue("category", e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Select category</option>
        <option value="academic">Academic</option>
        <option value="sports">Sports</option>
        <option value="arts">Arts</option>
        <option value="clubs">Clubs</option>
        <option value="community">Community</option>
        <option value="other">Other</option>
      </select>
    </div>
  )
}

function RecipientTypeField() {
  const form = useBuildForm()
  const value = useStore(form.store, (state: any) => state.values.recipientType) as string

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Recipient Type <span className="text-destructive">*</span></label>
      <select
        value={value}
        onChange={(e) => form.setFieldValue("recipientType", e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Select type</option>
        <option value="student">Student</option>
        <option value="faculty">Faculty</option>
        <option value="club">Club</option>
        <option value="org">Organization</option>
      </select>
    </div>
  )
}

function RecipientNamesField() {
  const form = useBuildForm()
  const recipientNames = useStore(form.store, (state: any) => state.values.recipientNames) as string[]

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Recipient Names</label>
      <NameListInput
        value={recipientNames}
        onChange={(names) => form.setFieldValue("recipientNames", names)}
        placeholder="Add recipient name"
      />
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

const fields: FieldEntry<CreateAchievementValues | UpdateAchievementValues>[] = [
  { name: "title", kind: "text", label: "Title", placeholder: "Enter achievement title", required: true, hidden: true },
  { name: "description", kind: "textarea", label: "Description", placeholder: "Describe the achievement", required: false },
  { name: "category", kind: "text", label: "Category", hidden: true, required: true },
  { name: "recipientNames", kind: "text", label: "Recipient Names", hidden: true, required: false },
  { name: "recipientType", kind: "text", label: "Recipient Type", hidden: true, required: true },
  { name: "year", kind: "text", label: "Year", placeholder: "e.g. 2025", required: false },
  { name: "coverImage", kind: "text", label: "Cover Image", hidden: true, required: false },
  { name: "tags", kind: "text", label: "Tags", hidden: true, required: false },
  { name: "publishNow", kind: "checkbox", label: "Publish immediately", required: false },
]

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
      { columns: [{ fields: ["description"] }] },
      { columns: [{ fields: ["year"] }] },
      { columns: [{ fields: ["publishNow"] }] },
    ],
    submitLabel: mode === "create" ? "Create Achievement" : "Save Changes",
    onCancel: () => onSuccess?.(),
    hooks: {
      beforeSubmit: (values) => ({
        ...values,
        year: values.year === "" || values.year == null ? undefined : Number(values.year),
        recipientType: values.recipientType || undefined,
        category: values.category || undefined,
      }),
    },
    renderAboveFields: () => (
      <div className="flex gap-6">
        <div className="w-[200px] shrink-0">
          <CoverImageField />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4">
          <TitleField />
          <CategoryField />
          <RecipientTypeField />
          <RecipientNamesField />
        </div>
      </div>
    ),
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
              recipientNames: achievement.recipientNames ?? [],
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
              recipientNames: [],
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
