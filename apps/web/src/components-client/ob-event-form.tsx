"use client";

import { useCallback, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder";
import { MinimalTiptapEditor } from "@aloysius-web/ui/components/minimal-tiptap";
import { Dropzone } from "@/components/file-upload";
import { uploadImageWithRatio } from "@/lib/upload-image";
import { IconX } from "@tabler/icons-react";
import { cn } from "@aloysius-web/ui/lib/utils";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import * as v from "valibot";
import { DateTimePicker } from "./date-time-picker";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";

const createEventSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  description: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  location: v.optional(v.string()),
  eventDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  isAllDay: v.boolean(),
  publishNow: v.boolean(),
});

type CreateEventValues = v.InferOutput<typeof createEventSchema>;

const updateEventSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  description: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  location: v.optional(v.string()),
  eventDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  isAllDay: v.boolean(),
  publishNow: v.boolean(),
});

type UpdateEventValues = v.InferOutput<typeof updateEventSchema>;

function CoverImageInline({ onChange }: { onChange: (val: unknown) => void }) {
  const form = useBuildForm();
  const coverImage = useStore(form.store, (state: any) => state.values.coverImage) as string | undefined;
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      try {
        form.setFieldValue("coverImage", await uploadImageWithRatio(file, 16 / 9));
      } catch {
        toast.error("Failed to upload image");
      } finally {
        setUploading(false);
      }
    },
    [form],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.setFieldValue("coverImage", "");
    },
    [form],
  );

  return (
    <div>
      {coverImage ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full aspect-[16/9] object-cover pointer-events-none"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            <IconX className="size-3" />
            Remove
          </button>
        </div>
      ) : (
        <Dropzone
          onFilesSelected={handleFilesSelected}
          maxFiles={1}
          maxSize={10 * 1024 * 1024}
          disabled={uploading}
          crop
          aspect={16 / 9}
          cropTitle="Crop Event Image"
          className={cn(
            "aspect-[16/9] justify-center",
            uploading && "opacity-50 pointer-events-none",
          )}
        />
      )}
    </div>
  );
}

function DateTimeInline({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  return (
    <DateTimePicker
      value={(value as string) || ""}
      onChange={(v) => onChange(v)}
    />
  );
}

function ContentEditorInline({ value, onChange }: { value: unknown; onChange: (val: unknown) => void }) {
  const form = useBuildForm();
  const handleImageUpload = useCallback(async (file: File) => {
    const result = await client.files.uploadFile(file);
    return result.url;
  }, []);

  return (
    <div>
      <MinimalTiptapEditor
        value={(value as string) || ""}
        onChange={(val) => onChange(val)}
        onImageUpload={handleImageUpload}
        className="min-h-[200px]"
      />
    </div>
  );
}

const fields: FieldEntry<CreateEventValues | UpdateEventValues>[] = [
  { name: "coverImage", kind: "custom", label: "Cover Image", required: false, customRenderer: ({ onChange }) => <CoverImageInline onChange={onChange} /> },
  { name: "title", kind: "text", label: "Event Title", placeholder: "e.g. Annual General Meeting", required: true },
  { name: "location", kind: "text", label: "Location", placeholder: "e.g. College Hall", required: false },
  { name: "eventDate", kind: "custom", label: "Start Date & Time", required: false, customRenderer: ({ value, onChange }) => <DateTimeInline value={value} onChange={onChange} /> },
  { name: "endDate", kind: "custom", label: "End Date & Time", required: false, customRenderer: ({ value, onChange }) => <DateTimeInline value={value} onChange={onChange} /> },
  { name: "isAllDay", kind: "checkbox", label: "All Day Event", required: false },
  { name: "publishNow", kind: "checkbox", label: "Publish immediately", required: false },
  { name: "description", kind: "custom", label: "Description", required: false, customRenderer: ({ value, onChange }) => <ContentEditorInline value={value} onChange={onChange} /> },
];

export function OBEventForm({
  mode,
  id,
  onSuccess,
}: {
  mode: "create" | "edit";
  id?: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const existingEvent = useQuery({
    queryKey: ["ob-event", id],
    queryFn: () => client.ob.obEvents.get({ id: id! }),
    enabled: mode === "edit" && !!id,
  });

  const mutation = useMutation({
    mutationFn: (values: CreateEventValues | UpdateEventValues) => {
      if (mode === "create") {
        return client.ob.obEvents.create(values as CreateEventValues);
      }
      return client.ob.obEvents.update({ id: id!, ...values });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Event created" : "Event updated");
      queryClient.invalidateQueries({ queryKey: ["ob-events"] });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const event = existingEvent.data;

  const config: FormConfig<CreateEventValues | UpdateEventValues> = {
    fields,
    layout: [
      { columns: [{ fields: ["coverImage"], span: 5 }, { fields: ["title", "location"], span: 7 }] },
      { columns: [{ fields: ["eventDate"], span: 6 }, { fields: ["endDate"], span: 6 }] },
      { columns: [{ fields: ["isAllDay"], span: 6 }, { fields: ["publishNow"], span: 6 }] },
      { columns: [{ fields: ["description"] }] },
    ],
    submitLabel: mode === "create" ? "Create Event" : "Save Changes",
    onCancel: () => onSuccess?.(),
  };

  if (mode === "edit" && existingEvent.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-40 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-[200px] rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (mode === "edit" && !existingEvent.data) {
    return <div className="p-4 text-center text-muted-foreground">Event not found.</div>;
  }

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createEventSchema : updateEventSchema}
      defaultValues={
        event
          ? {
              title: event.title,
              description: event.description ?? "",
              coverImage: event.coverImage ?? "",
              location: event.location ?? "",
              eventDate: event.eventDate ? event.eventDate.slice(0, 16) : "",
              endDate: event.endDate ? event.endDate.slice(0, 16) : "",
              isAllDay: event.isAllDay,
              publishNow: event.status === "published",
            }
          : {
              title: "",
              description: "",
              coverImage: "",
              location: "",
              eventDate: "",
              endDate: "",
              isAllDay: false,
              publishNow: false,
            }
      }
      mutationOptions={{
        mutationFn: async ({ body }: { body: CreateEventValues | UpdateEventValues }) =>
          mutation.mutateAsync(body),
      }}
    />
  );
}
