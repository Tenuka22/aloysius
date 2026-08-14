"use client";

import { useCallback, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder";
import { MinimalTiptapEditor } from "@aloysius-web/ui/components/minimal-tiptap";
import { Input } from "@aloysius-web/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import { TagInput } from "@/components-client/tag-input";
import { SlugFieldInline } from "@/components-client/slug-field";
import { Dropzone } from "@/components/file-upload";
import { uploadImageWithRatio } from "@/lib/upload-image";
import { IconX } from "@tabler/icons-react";
import { cn } from "@aloysius-web/ui/lib/utils";
import { client } from "@/utils/orpc";
import { convertToWebp } from "@/utils/convert-to-webp";
import { toast } from "sonner";
import * as v from "valibot";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";

const createAnnouncementSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  slug: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  authorName: v.optional(v.string()),
  authorType: v.optional(v.string()),
  content: v.string(),
  coverImage: v.optional(v.string()),
  tags: v.array(v.string()),
  audience: v.string(),
  addressedTo: v.optional(v.string()),
  publishNow: v.boolean(),
});

type CreateAnnouncementValues = v.InferOutput<typeof createAnnouncementSchema>;

const updateAnnouncementSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  slug: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  authorName: v.optional(v.string()),
  authorType: v.optional(v.string()),
  content: v.string(),
  coverImage: v.optional(v.string()),
  tags: v.array(v.string()),
  audience: v.string(),
  addressedTo: v.optional(v.string()),
  publishNow: v.boolean(),
});

type UpdateAnnouncementValues = v.InferOutput<typeof updateAnnouncementSchema>;

const fields: FieldEntry<CreateAnnouncementValues | UpdateAnnouncementValues>[] = [
  {
    name: "title",
    kind: "text",
    label: "Title",
    placeholder: "Enter announcement title",
    required: true,
  },
  {
    name: "slug",
    kind: "custom",
    label: "Slug",
    required: false,
    customRenderer: () => null,
    renderField: (name, value, onChange) => (
      <SlugFieldInline
        routerName="announcements"
        value={(value as string) ?? ""}
        onChange={(v) => onChange(v)}
      />
    ),
  },
  {
    name: "excerpt",
    kind: "textarea",
    label: "Excerpt",
    placeholder: "Brief summary for previews",
    required: false,
  },
  {
    name: "authorName",
    kind: "text",
    label: "Author Name",
    placeholder: "Who authored this?",
    required: false,
  },
  {
    name: "authorType",
    kind: "select",
    label: "Author Type",
    options: [
      { value: "student", label: "Student" },
      { value: "faculty", label: "Faculty" },
      { value: "club", label: "Club" },
      { value: "org", label: "Organization" },
    ],
    required: false,
  },
  { name: "content", kind: "text", label: "Content", hidden: true, required: true },
  { name: "coverImage", kind: "text", label: "Cover Image URL", hidden: true, required: false },
  { name: "tags", kind: "text", label: "Tags", hidden: true, required: false },
  { name: "audience", kind: "text", label: "Audience", hidden: true, required: false },
  { name: "addressedTo", kind: "text", label: "Addressed To", hidden: true, required: false },
  { name: "publishNow", kind: "checkbox", label: "Publish immediately", required: false },
];

function CoverImageField() {
  const form = useBuildForm();
  const coverImage = useStore(form.store, (state) => state.values.coverImage) as string | undefined;
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
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Cover Image</label>
      {coverImage ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full aspect-video object-cover pointer-events-none"
          />
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
          className={cn("aspect-video", uploading && "opacity-50 pointer-events-none")}
        />
      )}
    </div>
  );
}

function TagsField() {
  const form = useBuildForm();
  const tags = (form.state.values.tags as string[]) ?? [];

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Tags</label>
      <TagInput
        value={tags}
        onChange={(value) => form.setFieldValue("tags", value)}
        placeholder="Add tags..."
      />
    </div>
  );
}

function AudienceField() {
  const form = useBuildForm();
  const audience = (form.state.values.audience as string) ?? "all";
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">
        Audience<span className="text-destructive ml-0.5">*</span>
      </label>
      <Select
        value={audience}
        onValueChange={(val) => {
          if (val !== undefined) form.setFieldValue("audience", val);
        }}
        items={[
          { value: "all", label: "Everyone" },
          { value: "students", label: "Students" },
          { value: "parents", label: "Parents" },
          { value: "staff", label: "Staff" },
          { value: "alumni", label: "Alumni" },
        ]}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select audience" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Everyone</SelectItem>
          <SelectItem value="students">Students</SelectItem>
          <SelectItem value="parents">Parents</SelectItem>
          <SelectItem value="staff">Staff</SelectItem>
          <SelectItem value="alumni">Alumni</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function AddressedToField() {
  const form = useBuildForm();
  const addressedTo = (form.state.values.addressedTo as string) ?? "";
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Addressed To</label>
      <Input
        value={addressedTo}
        onChange={(e) => form.setFieldValue("addressedTo", e.target.value)}
        placeholder="e.g. Grade 11 Students, Science Faculty..."
      />
      <p className="text-xs text-muted-foreground">
        Optional: specify who this announcement is specifically for
      </p>
    </div>
  );
}

function ContentEditorField() {
  const form = useBuildForm();
  const handleImageUpload = useCallback(async (file: File) => {
    const webp = await convertToWebp(file);
    const result = await client.files.uploadFile(webp);
    return result.url;
  }, []);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">
        Content<span className="text-destructive ml-0.5">*</span>
      </label>
      <MinimalTiptapEditor
        value={form.state.values.content as string}
        onChange={(value) =>
          form.setFieldValue("content", typeof value === "string" ? value : JSON.stringify(value))
        }
        onImageUpload={handleImageUpload}
        placeholder="Write your announcement..."
      />
    </div>
  );
}

export function AnnouncementForm({
  mode,
  id,
  onSuccess,
  activityId,
}: {
  mode: "create" | "edit";
  id?: string;
  onSuccess: () => void;
  activityId?: string;
}) {
  const queryClient = useQueryClient();

  const { data: announcement, isLoading: isLoadingItem } = useQuery({
    queryKey: ["announcements", id],
    queryFn: () => client.announcements.get({ id: id! }),
    enabled: mode === "edit" && !!id,
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateAnnouncementValues) =>
      client.announcements.create({
        ...body,
        activityId,
        audience: body.audience as "all" | "students" | "parents" | "staff" | "alumni",
      } as any),
    onSuccess: () => {
      toast.success("Announcement created");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (body: UpdateAnnouncementValues & { id: string }) =>
      client.announcements.update({
        ...body,
        audience: body.audience as "all" | "students" | "parents" | "staff" | "alumni",
      }),
    onSuccess: () => {
      toast.success("Announcement updated");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = useCallback(
    async (values: CreateAnnouncementValues | UpdateAnnouncementValues) => {
      if (mode === "edit" && id)
        await updateMutation.mutateAsync({ ...values, id } as UpdateAnnouncementValues & {
          id: string;
        });
      else await createMutation.mutateAsync(values as CreateAnnouncementValues);
    },
    [mode, id, createMutation, updateMutation],
  );

  if (mode === "edit" && isLoadingItem) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded bg-muted animate-pulse" />
        <div className="h-[300px] rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (mode === "edit" && !announcement)
    return <div className="p-4 text-center text-muted-foreground">Announcement not found.</div>;

  const formConfig: FormConfig<CreateAnnouncementValues | UpdateAnnouncementValues> = {
    fields,
    layout: [
      { columns: [{ fields: ["title"] }] },
      { columns: [{ fields: ["slug"] }] },
      { columns: [{ fields: ["excerpt"] }] },
      { columns: [{ fields: ["authorName", "authorType"] }] },
      { columns: [{ fields: ["publishNow"] }] },
    ],
    submitLabel: mode === "create" ? "Create Announcement" : "Save Changes",
    hooks: {
      beforeSubmit: (values) => ({
        ...values,
        authorType: values.authorType || undefined,
      }),
    },
  };

  return (
    <FormBuilder<CreateAnnouncementValues | UpdateAnnouncementValues>
      config={formConfig}
      defaultValues={
        mode === "edit" && announcement
          ? {
              title: announcement.title,
              slug: announcement.slug ?? "",
              excerpt: announcement.excerpt ?? "",
              authorName: announcement.authorName ?? "",
              authorType: announcement.authorType ?? "",
              content: announcement.content,
              coverImage: announcement.coverImage ?? "",
              tags: announcement.tags ?? [],
              audience: announcement.audience ?? "all",
              addressedTo: announcement.addressedTo ?? "",
              publishNow: announcement.status === "published",
            }
          : {
              title: "",
              slug: "",
              excerpt: "",
              authorName: "",
              authorType: "",
              content: "",
              coverImage: "",
              tags: [],
              audience: "all",
              addressedTo: "",
              publishNow: false,
            }
      }
      valibotSchema={mode === "create" ? createAnnouncementSchema : updateAnnouncementSchema}
      onSubmit={handleSubmit}
      submitting={createMutation.isPending || updateMutation.isPending}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AudienceField />
        <AddressedToField />
      </div>
      <CoverImageField />
      <TagsField />
      <ContentEditorField />
    </FormBuilder>
  );
}
