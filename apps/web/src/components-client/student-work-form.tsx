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

const categoryOptions = [
  { value: "film", label: "Film" },
  { value: "art", label: "Art" },
  { value: "music", label: "Music" },
  { value: "writing", label: "Writing" },
  { value: "design", label: "Design" },
  { value: "photography", label: "Photography" },
  { value: "code", label: "Code" },
  { value: "other", label: "Other" },
]

const createSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  description: v.optional(v.string()),
  category: v.picklist(["film", "art", "music", "writing", "design", "photography", "code", "other"]),
  studentName: v.pipe(v.string(), v.minLength(1, "Student name is required")),
  studentGrade: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  contentUrl: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
})

type CreateValues = v.InferOutput<typeof createSchema>

const updateSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  description: v.optional(v.string()),
  category: v.picklist(["film", "art", "music", "writing", "design", "photography", "code", "other"]),
  studentName: v.pipe(v.string(), v.minLength(1, "Student name is required")),
  studentGrade: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  contentUrl: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
})

type UpdateValues = v.InferOutput<typeof updateSchema>

const fields: FieldEntry<CreateValues | UpdateValues>[] = [
  { name: "title", kind: "text", label: "Title", placeholder: "Enter work title", required: true },
  { name: "description", kind: "textarea", label: "Description", placeholder: "Brief description of the work", required: false },
  { name: "category", kind: "select", label: "Category", options: categoryOptions, required: true },
  { name: "studentName", kind: "text", label: "Student Name", placeholder: "Enter student name", required: true },
  { name: "studentGrade", kind: "text", label: "Student Grade", placeholder: "e.g. Grade 10", required: false },
  { name: "coverImage", kind: "text", label: "Cover Image", hidden: true, required: false },
  { name: "contentUrl", kind: "text", label: "Content URL", placeholder: "Link to the work (optional)", required: false },
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

export function StudentWorkForm({
  mode,
  id,
  onSuccess,
}: {
  mode: "create" | "edit"
  id?: string
  onSuccess?: () => void
}) {
  const queryClient = useQueryClient()

  const existingWork = useQuery({
    queryKey: ["studentWorks", id],
    queryFn: () => client.studentWorks.get({ id: id! }),
    enabled: mode === "edit" && !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: CreateValues | UpdateValues) => {
      if (mode === "create") {
        return client.studentWorks.create(values as CreateValues)
      }
      return client.studentWorks.update({ id: id!, ...values })
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Student work created" : "Student work updated")
      queryClient.invalidateQueries({ queryKey: ["studentWorks"] })
      onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const work = existingWork.data

  const config: FormConfig<CreateValues | UpdateValues> = {
    fields,
    layout: [
      { columns: [{ fields: ["title"] }] },
      { columns: [{ fields: ["description"] }] },
      { columns: [{ fields: ["category"] }] },
      { columns: [{ fields: ["studentName"] }] },
      { columns: [{ fields: ["studentGrade"] }] },
      { columns: [{ fields: ["contentUrl"] }] },
      { columns: [{ fields: ["publishNow"] }] },
    ],
    submitLabel: mode === "create" ? "Create Student Work" : "Save Changes",
    onCancel: () => onSuccess?.(),
    renderAboveFields: () => <CoverImageField />,
    renderBelowFields: () => <TagsField />,
  }

  if (mode === "edit" && existingWork.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded bg-muted animate-pulse" />
        <div className="h-[300px] rounded bg-muted animate-pulse" />
      </div>
    )
  }

  if (mode === "edit" && !existingWork.data) {
    return <div className="p-4 text-center text-muted-foreground">Student work not found.</div>
  }

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createSchema : updateSchema}
      defaultValues={
        work
          ? {
              title: work.title,
              description: work.description ?? "",
              category: work.category,
              studentName: work.studentName,
              studentGrade: work.studentGrade ?? "",
              coverImage: work.coverImage ?? "",
              contentUrl: work.contentUrl ?? "",
              tags: work.tags ?? [],
              publishNow: work.status === "published",
            }
          : {
              title: "",
              description: "",
              category: "other",
              studentName: "",
              studentGrade: "",
              coverImage: "",
              contentUrl: "",
              tags: [],
              publishNow: false,
            }
      }
      mutationOptions={{
        mutationFn: async ({ body }: { body: CreateValues | UpdateValues }) => mutation.mutateAsync(body),
      }}
    />
  )
}
