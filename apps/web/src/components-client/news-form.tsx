"use client";

import { useCallback, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder";
import { MinimalTiptapEditor } from "@aloysius-web/ui/components/minimal-tiptap";
import { TagInput } from "@/components-client/tag-input";
import { Dropzone } from "@/components/file-upload";
import { uploadImageWithRatio } from "@/lib/upload-image";
import { IconX } from "@tabler/icons-react";
import { cn } from "@aloysius-web/ui/lib/utils";
import { client, orpc } from "@/utils/orpc";
import { convertToWebp } from "@/utils/convert-to-webp";
import { toast } from "sonner";
import * as v from "valibot";
import { SlugFieldInline } from "@/components-client/slug-field";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";

const createNewsSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  slug: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  content: v.string(),
  coverImage: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
  authorName: v.optional(v.string()),
  authorType: v.optional(v.string()),
});

type CreateNewsValues = v.InferOutput<typeof createNewsSchema>;

const updateNewsSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  slug: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  content: v.string(),
  coverImage: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
  authorName: v.optional(v.string()),
  authorType: v.optional(v.string()),
});

type UpdateNewsValues = v.InferOutput<typeof updateNewsSchema>;

const fields: FieldEntry<CreateNewsValues | UpdateNewsValues>[] = [
  {
    name: "title",
    kind: "text",
    label: "Title",
    placeholder: "Enter news title",
    required: true,
  },
  {
    name: "slug",
    kind: "custom",
    label: "Slug",
    required: false,
    customRenderer: ({ value, onChange }) => {
      return (
        <SlugFieldInline
          sourceField="title"
          routerName="news"
          value={(value as string) ?? ""}
          onChange={onChange}
        />
      );
    },
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
    placeholder: "Who wrote this?",
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
    name: "tags",
    kind: "text",
    label: "Tags",
    hidden: true,
    required: false,
  },
  {
    name: "publishNow",
    kind: "checkbox",
    label: "Publish immediately",
    required: false,
  },
];

function CoverImageField() {
  const form = useBuildForm();
  const coverImage = useStore(
    form.store,
    (state: { values: CreateNewsValues | UpdateNewsValues }) => state.values.coverImage,
  ) as string | undefined;
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
        placeholder="Write your news article..."
      />
    </div>
  );
}

export function NewsForm({
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

  const { data: newsItem, isLoading: isLoadingItem } = useQuery(
    orpc.news.get.queryOptions({
      input: { id: id! },
      enabled: mode === "edit" && !!id,
    }),
  );

  const createMutation = useMutation(
    orpc.news.create.mutationOptions({
      onSuccess: () => {
        toast.success("News article created");
        queryClient.invalidateQueries({ queryKey: orpc.news.key() });
        onSuccess();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const updateMutation = useMutation(
    orpc.news.update.mutationOptions({
      onSuccess: () => {
        toast.success("News updated");
        queryClient.invalidateQueries({ queryKey: orpc.news.key() });
        onSuccess();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const handleSubmit = useCallback(
    async (values: CreateNewsValues | UpdateNewsValues) => {
      if (mode === "edit" && id)
        await updateMutation.mutateAsync({
          ...values,
          id,
        } as Parameters<typeof updateMutation.mutateAsync>[0]);
      else
        await createMutation.mutateAsync({
          ...(values as CreateNewsValues),
          activityId,
        } as Parameters<typeof createMutation.mutateAsync>[0]);
    },
    [mode, id, activityId, createMutation, updateMutation],
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

  if (mode === "edit" && !newsItem)
    return <div className="p-4 text-center text-muted-foreground">News article not found.</div>;

  const formConfig: FormConfig<CreateNewsValues | UpdateNewsValues> = {
    fields,
    layout: [
      { columns: [{ fields: ["title"] }] },
      { columns: [{ fields: ["slug"] }] },
      { columns: [{ fields: ["excerpt"] }] },
      { columns: [{ fields: ["authorName", "authorType"] }] },
      { columns: [{ fields: ["publishNow"] }] },
    ],
    submitLabel: mode === "create" ? "Create Article" : "Save Changes",
    hooks: {
      beforeSubmit: (values) => ({
        ...values,
        authorType: values.authorType || undefined,
      }),
    },
    renderBelowFields: () => null,
  };

  return (
    <FormBuilder<CreateNewsValues | UpdateNewsValues>
      config={formConfig}
      defaultValues={
        mode === "edit" && newsItem
          ? {
              title: newsItem.title,
              slug: newsItem.slug ?? "",
              excerpt: newsItem.excerpt ?? "",
              content: newsItem.content,
              coverImage: newsItem.coverImage ?? "",
              tags: newsItem.tags ?? [],
              publishNow: newsItem.status === "published",
              authorName: newsItem.authorName ?? "",
              authorType: newsItem.authorType ?? "",
            }
          : {
              title: "",
              slug: "",
              excerpt: "",
              content: "",
              coverImage: "",
              tags: [],
              publishNow: false,
              authorName: "",
              authorType: "",
            }
      }
      valibotSchema={mode === "create" ? createNewsSchema : updateNewsSchema}
      onSubmit={handleSubmit}
      submitting={createMutation.isPending || updateMutation.isPending}
    >
      <CoverImageField />
      <TagsField />
      <ContentEditorField />
    </FormBuilder>
  );
}
