"use client"

import { useCallback, useState } from "react"
import { useStore } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@aloysius-web/ui/components/button"
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder"
import { MinimalTiptapEditor } from "@aloysius-web/ui/components/minimal-tiptap"
import { Input } from "@aloysius-web/ui/components/input"
import { Checkbox } from "@aloysius-web/ui/components/checkbox"
import { TagInput } from "@/components-client/tag-input"
import { DateTimePicker, AllDayToggle } from "@/components-client/date-time-picker"
import { Dropzone } from "@/components/file-upload"
import { IconX } from "@tabler/icons-react"
import { cn } from "@aloysius-web/ui/lib/utils"
import { client } from "@/utils/orpc"
import { convertToWebp } from "@/utils/convert-to-webp"
import { toast } from "sonner"
import * as v from "valibot"
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder"

const createEventSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  excerpt: v.optional(v.string()),
  content: v.string(),
  coverImage: v.optional(v.string()),
  bodyImage: v.optional(v.string()),
  purpose: v.optional(v.string()),
  organization: v.optional(v.string()),
  location: v.optional(v.string()),
  startDate: v.pipe(v.string(), v.minLength(1, "Start date is required")),
  endDate: v.optional(v.string()),
  isRecurring: v.boolean(),
  isAllDay: v.boolean(),
  recurrenceRule: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
})

type CreateEventValues = v.InferOutput<typeof createEventSchema>

const updateEventSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  excerpt: v.optional(v.string()),
  content: v.string(),
  coverImage: v.optional(v.string()),
  bodyImage: v.optional(v.string()),
  purpose: v.optional(v.string()),
  organization: v.optional(v.string()),
  location: v.optional(v.string()),
  startDate: v.pipe(v.string(), v.minLength(1, "Start date is required")),
  endDate: v.optional(v.string()),
  isRecurring: v.boolean(),
  isAllDay: v.boolean(),
  recurrenceRule: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
})

type UpdateEventValues = v.InferOutput<typeof updateEventSchema>

const fields: FieldEntry<CreateEventValues | UpdateEventValues>[] = [
  { name: "title", kind: "text", label: "Title", placeholder: "Enter event title", required: true },
  { name: "excerpt", kind: "textarea", label: "Excerpt", placeholder: "Brief summary for previews", required: false },
  { name: "content", kind: "text", label: "Content", hidden: true, required: true },
  { name: "coverImage", kind: "text", label: "Cover Image", hidden: true, required: false },
  { name: "bodyImage", kind: "text", label: "Body Image", hidden: true, required: false },
  { name: "purpose", kind: "textarea", label: "Purpose", placeholder: "What is this event about?", required: false },
  { name: "organization", kind: "text", label: "Organization", placeholder: "Organizing body", required: false },
  { name: "location", kind: "text", label: "Location", placeholder: "Event venue", required: false },
  { name: "startDate", kind: "text", label: "Start Date & Time", hidden: true, required: true },
  { name: "endDate", kind: "text", label: "End Date & Time", hidden: true, required: false },
  { name: "isRecurring", kind: "checkbox", label: "Recurring Event", hidden: true, required: false },
  { name: "isAllDay", kind: "checkbox", label: "All Day", hidden: true, required: false },
  { name: "recurrenceRule", kind: "text", label: "Recurrence Rule", placeholder: "e.g. weekly, monthly", hidden: true, required: false },
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

function BodyImageField() {
  const form = useBuildForm()
  const bodyImage = useStore(form.store, (state: any) => state.values.bodyImage) as string | undefined
  const [uploading, setUploading] = useState(false)

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    try {
      const webp = await convertToWebp(file)
      const result = await client.files.uploadFile(webp)
      form.setFieldValue("bodyImage", result.url)
    } catch {
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }, [form])

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    form.setFieldValue("bodyImage", "")
  }, [form])

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Body Image (16:9)</label>
      {bodyImage ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img src={bodyImage} alt="Body" className="w-full aspect-[16/9] object-cover pointer-events-none" />
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
          cropTitle="Crop Body Image"
          className={cn("aspect-[16/9] justify-center", uploading && "opacity-50 pointer-events-none")}
        />
      )}
    </div>
  )
}

function DateTimeSection() {
  const form = useBuildForm()
  const startDate = useStore(form.store, (state: any) => state.values.startDate) as string
  const endDate = useStore(form.store, (state: any) => state.values.endDate) as string
  const isAllDay = useStore(form.store, (state: any) => state.values.isAllDay) as boolean
  const isRecurring = useStore(form.store, (state: any) => state.values.isRecurring) as boolean
  const recurrenceRule = useStore(form.store, (state: any) => state.values.recurrenceRule) as string

  const parsedStart = startDate ? new Date(startDate) : undefined
  const minEndDate = parsedStart && !isAllDay
    ? parsedStart
    : parsedStart
      ? new Date(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate() + 1)
      : undefined

  return (
    <div className="space-y-4">
      <AllDayToggle
        checked={isAllDay}
        onChange={(v) => form.setFieldValue("isAllDay", v)}
      />
      <DateTimePicker
        value={startDate}
        onChange={(v) => {
          form.setFieldValue("startDate", v)
          if (!endDate) {
            const d = new Date(v)
            d.setHours(d.getHours() + 1)
            form.setFieldValue("endDate", d.toISOString().slice(0, 16))
          }
        }}
        label="Start Date & Time"
        required
        allDay={isAllDay}
      />
      <DateTimePicker
        value={endDate}
        onChange={(v) => form.setFieldValue("endDate", v)}
        label="End Date & Time"
        allDay={isAllDay}
        minDate={minEndDate}
        minTime={parsedStart && !isAllDay ? { hours: parsedStart.getHours(), minutes: parsedStart.getMinutes() } : undefined}
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id="isRecurring"
          checked={isRecurring}
          onCheckedChange={(v) => form.setFieldValue("isRecurring", v === true)}
        />
        <label htmlFor="isRecurring" className="text-sm font-medium leading-none cursor-pointer">
          Recurring Event
        </label>
      </div>
      {isRecurring && (
        <Input
          value={recurrenceRule}
          onChange={(e) => form.setFieldValue("recurrenceRule", e.target.value)}
          placeholder="e.g. weekly, monthly, every Tuesday"
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

function ContentEditor() {
  const form = useBuildForm()
  const content = (form.state.values.content as string) ?? ""
  const handleImageUpload = useCallback(async (file: File) => {
    const webp = await convertToWebp(file)
    const result = await client.files.uploadFile(webp)
    return result.url
  }, [])

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">
        Content <span className="text-destructive ml-0.5">*</span>
      </label>
      <MinimalTiptapEditor
        value={content}
        onChange={(val) => form.setFieldValue("content", val)}
        onImageUpload={handleImageUpload}
        className="min-h-[300px]"
      />
    </div>
  )
}

export function EventForm({
  mode,
  id,
  onSuccess,
}: {
  mode: "create" | "edit"
  id?: string
  onSuccess?: () => void
}) {
  const queryClient = useQueryClient()

  const existingEvent = useQuery({
    queryKey: ["events", id],
    queryFn: () => client.events.get({ id: id! }),
    enabled: mode === "edit" && !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: CreateEventValues | UpdateEventValues) => {
      if (mode === "create") {
        return client.events.create(values as CreateEventValues)
      }
      return client.events.update({ id: id!, ...values })
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Event created" : "Event updated")
      queryClient.invalidateQueries({ queryKey: ["events"] })
      onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const event = existingEvent.data

  const config: FormConfig<CreateEventValues | UpdateEventValues> = {
    fields,
    layout: [
      { columns: [{ fields: ["title"] }] },
      { columns: [{ fields: ["excerpt"] }] },
      { columns: [{ fields: ["purpose"] }] },
      { columns: [{ fields: ["organization"] }] },
      { columns: [{ fields: ["location"] }] },
      { columns: [{ fields: ["publishNow"] }] },
    ],
    submitLabel: mode === "create" ? "Create Event" : "Save Changes",
    onCancel: () => onSuccess?.(),
    renderAboveFields: () => (
      <div className="flex gap-4 items-start">
        <div className="flex-1"><CoverImageField /></div>
        <div className="flex-[1.78]"><BodyImageField /></div>
      </div>
    ),
    renderBelowFields: () => (
      <>
        <DateTimeSection />
        <ContentEditor />
        <TagsField />
      </>
    ),
  }

  if (mode === "edit" && existingEvent.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded bg-muted animate-pulse" />
        <div className="h-[300px] rounded bg-muted animate-pulse" />
      </div>
    )
  }

  if (mode === "edit" && !existingEvent.data) {
    return <div className="p-4 text-center text-muted-foreground">Event not found.</div>
  }

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createEventSchema : updateEventSchema}
      defaultValues={
        event
          ? {
              title: event.title,
              excerpt: event.excerpt ?? "",
              content: event.content,
              coverImage: event.coverImage ?? "",
              bodyImage: event.bodyImage ?? "",
              purpose: event.purpose ?? "",
              organization: event.organization ?? "",
              location: event.location ?? "",
              startDate: event.startDate.slice(0, 16),
              endDate: event.endDate?.slice(0, 16) ?? "",
              isRecurring: event.isRecurring,
              isAllDay: event.isAllDay ?? false,
              recurrenceRule: event.recurrenceRule ?? "",
              tags: event.tags ?? [],
              publishNow: event.status === "published",
            }
          : {
              title: "",
              excerpt: "",
              content: "",
              coverImage: "",
              bodyImage: "",
              purpose: "",
              organization: "",
              location: "",
              startDate: "",
              endDate: "",
              isRecurring: false,
              isAllDay: false,
              recurrenceRule: "",
              tags: [],
              publishNow: false,
            }
      }
      mutationOptions={{
        mutationFn: async ({ body }: { body: CreateEventValues | UpdateEventValues }) => mutation.mutateAsync(body),
      }}
    />
  )
}
