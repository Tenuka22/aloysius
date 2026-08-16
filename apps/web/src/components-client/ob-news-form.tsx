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
import { client, orpc } from "@/utils/orpc";
import { toast } from "sonner";
import * as v from "valibot";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";

const createNewsSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  excerpt: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  publishNow: v.boolean(),
  content: v.pipe(v.string(), v.minLength(1, "Content is required")),
});

type CreateNewsValues = v.InferOutput<typeof createNewsSchema>;

const updateNewsSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  excerpt: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  publishNow: v.boolean(),
  content: v.pipe(v.string(), v.minLength(1, "Content is required")),
});

type UpdateNewsValues = v.InferOutput<typeof updateNewsSchema>;

type FormValues = CreateNewsValues | UpdateNewsValues;

function CoverImageInline() {
  const form = useBuildForm();
  const coverImage = useStore(form.store, (state: { values: FormValues }) => state.values.coverImage) as
    | string
    | undefined;
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
          cropTitle="Crop Cover Image"
          className={cn(
            "aspect-[16/9] justify-center",
            uploading && "opacity-50 pointer-events-none",
          )}
        />
      )}
    </div>
  );
}

function ContentEditorInline({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (val: unknown) => void;
}) {
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

const fields: FieldEntry<CreateNewsValues | UpdateNewsValues>[] = [
  {
    name: "coverImage",
    kind: "custom",
    label: "Cover Image",
    required: false,
    customRenderer: () => <CoverImageInline />,
  },
  {
    name: "title",
    kind: "text",
    label: "Title",
    placeholder: "e.g. OB Chapter Raises Record Funds",
    required: true,
  },
  {
    name: "excerpt",
    kind: "text",
    label: "Excerpt",
    placeholder: "Short summary shown in listings",
    required: false,
  },
  { name: "publishNow", kind: "checkbox", label: "Publish immediately", required: false },
  {
    name: "content",
    kind: "custom",
    label: "Content",
    required: true,
    customRenderer: ({ value, onChange }) => (
      <ContentEditorInline value={value} onChange={onChange} />
    ),
  },
];

export function OBNewsForm({
  mode,
  id,
  onSuccess,
}: {
  mode: "create" | "edit";
  id?: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const existingNews = useQuery(
    orpc.ob.obNews.get.queryOptions({
      input: { id: id! },
      enabled: mode === "edit" && !!id,
    }),
  );

  const createMutation = useMutation(
    orpc.ob.obNews.create.mutationOptions({
      onSuccess: () => {
        toast.success("News article created");
        queryClient.invalidateQueries({ queryKey: orpc.ob.obNews.key() });
        onSuccess?.();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const updateMutation = useMutation(
    orpc.ob.obNews.update.mutationOptions({
      onSuccess: () => {
        toast.success("News article updated");
        queryClient.invalidateQueries({ queryKey: orpc.ob.obNews.key() });
        onSuccess?.();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const mutation = {
    mutateAsync: (values: CreateNewsValues | UpdateNewsValues) =>
      mode === "create"
        ? createMutation.mutateAsync(values as CreateNewsValues)
        : updateMutation.mutateAsync({ id: id!, ...values }),
    isPending: createMutation.isPending || updateMutation.isPending,
  };

  const news = existingNews.data;

  const config: FormConfig<CreateNewsValues | UpdateNewsValues> = {
    fields,
    layout: [
      {
        columns: [
          { fields: ["coverImage"], span: 5 },
          { fields: ["title", "excerpt", "publishNow"], span: 7 },
        ],
      },
      { columns: [{ fields: ["content"] }] },
    ],
    submitLabel: mode === "create" ? "Create Article" : "Save Changes",
    onCancel: () => onSuccess?.(),
  };

  if (mode === "edit" && existingNews.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-40 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-[200px] rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (mode === "edit" && !existingNews.data) {
    return <div className="p-4 text-center text-muted-foreground">Article not found.</div>;
  }

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createNewsSchema : updateNewsSchema}
      defaultValues={
        news
          ? {
              title: news.title,
              excerpt: news.excerpt ?? "",
              coverImage: news.coverImage ?? "",
              publishNow: news.status === "published",
              content: news.content,
            }
          : {
              title: "",
              excerpt: "",
              coverImage: "",
              publishNow: false,
              content: "",
            }
      }
      mutationOptions={{
        mutationFn: async ({ body }: { body: CreateNewsValues | UpdateNewsValues }) =>
          mutation.mutateAsync(body),
      }}
    />
  );
}
