"use client";

import { useCallback, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder";
import { Dropzone } from "@/components/file-upload";
import { IconX } from "@tabler/icons-react";
import { cn } from "@aloysius-web/ui/lib/utils";
import { client } from "@/utils/orpc";
import { convertToWebp } from "@/utils/convert-to-webp";
import { withAspectRatio } from "@/lib/image-ratio";
import { toast } from "sonner";
import * as v from "valibot";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";

const createPrincipalSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  title: v.optional(v.string()),
  quote: v.optional(v.string()),
  message: v.optional(v.string()),
  bio: v.optional(v.string()),
  education: v.optional(v.string()),
  tenure: v.optional(v.string()),
  portrait: v.optional(v.string()),
  sortOrder: v.optional(v.union([v.number(), v.string()])),
  publishNow: v.boolean(),
});

type CreatePrincipalValues = v.InferOutput<typeof createPrincipalSchema>;

const updatePrincipalSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  title: v.optional(v.string()),
  quote: v.optional(v.string()),
  message: v.optional(v.string()),
  bio: v.optional(v.string()),
  education: v.optional(v.string()),
  tenure: v.optional(v.string()),
  portrait: v.optional(v.string()),
  sortOrder: v.optional(v.union([v.number(), v.string()])),
  publishNow: v.boolean(),
});

type UpdatePrincipalValues = v.InferOutput<typeof updatePrincipalSchema>;

function PortraitField() {
  const form = useBuildForm();
  const portrait = useStore(form.store, (state: any) => state.values.portrait) as
    | string
    | undefined;
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      try {
        const webp = await convertToWebp(file);
        const result = await client.files.uploadFile(webp);
        form.setFieldValue("portrait", withAspectRatio(result.url, 3 / 4));
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
      form.setFieldValue("portrait", "");
    },
    [form],
  );

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Portrait (3:4)</label>
      {portrait ? (
        <div className="relative overflow-hidden rounded-xl border w-[200px]">
          <img
            src={portrait}
            alt="Portrait"
            className="w-full aspect-[3/4] object-cover pointer-events-none"
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
          aspect={3 / 4}
          cropTitle="Crop Portrait"
          className={cn(
            "w-[200px] aspect-[3/4] justify-center",
            uploading && "opacity-50 pointer-events-none",
          )}
        />
      )}
    </div>
  );
}

function NameField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.name) as string;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">
        Name <span className="text-destructive">*</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => form.setFieldValue("name", e.target.value)}
        placeholder="e.g. Fr. Jason Thomas"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function TitleField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.title) as string;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Title</label>
      <input
        type="text"
        value={value}
        onChange={(e) => form.setFieldValue("title", e.target.value)}
        placeholder="e.g. Principal"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function QuoteField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.quote) as string;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Short Quote (homepage teaser)</label>
      <textarea
        value={value}
        onChange={(e) => form.setFieldValue("quote", e.target.value)}
        placeholder="A short quote shown on the homepage..."
        rows={3}
        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function MessageField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.message) as string;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Full Message</label>
      <textarea
        value={value}
        onChange={(e) => form.setFieldValue("message", e.target.value)}
        placeholder="The principal's full message shown on the dedicated page..."
        rows={8}
        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function BioField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.bio) as string;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Bio / About</label>
      <textarea
        value={value}
        onChange={(e) => form.setFieldValue("bio", e.target.value)}
        placeholder="A short personal profile..."
        rows={4}
        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function EducationField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.education) as string;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Education &amp; Qualifications</label>
      <textarea
        value={value}
        onChange={(e) => form.setFieldValue("education", e.target.value)}
        placeholder={"e.g. B.A. (Hons) University of Peradeniya\nM.Ed. University of Colombo"}
        rows={3}
        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function TenureField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.tenure) as string;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Tenure / Years of Service</label>
      <input
        type="text"
        value={value}
        onChange={(e) => form.setFieldValue("tenure", e.target.value)}
        placeholder="e.g. 2019 - Present"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

const fields: FieldEntry<CreatePrincipalValues | UpdatePrincipalValues>[] = [
  {
    name: "name",
    kind: "text",
    label: "Name",
    placeholder: "e.g. Fr. Jason Thomas",
    required: true,
    hidden: true,
  },
  {
    name: "title",
    kind: "text",
    label: "Title",
    placeholder: "e.g. Principal",
    required: false,
    hidden: true,
  },
  {
    name: "quote",
    kind: "textarea",
    label: "Short Quote",
    placeholder: "The principal's short quote...",
    required: false,
    hidden: true,
  },
  { name: "message", kind: "text", label: "Full Message", hidden: true, required: false },
  { name: "bio", kind: "text", label: "Bio", hidden: true, required: false },
  { name: "education", kind: "text", label: "Education", hidden: true, required: false },
  { name: "tenure", kind: "text", label: "Tenure", hidden: true, required: false },
  { name: "portrait", kind: "text", label: "Portrait", hidden: true, required: false },
  {
    name: "sortOrder",
    kind: "text",
    label: "Sort Order",
    placeholder: "0",
    required: false,
  },
  { name: "publishNow", kind: "checkbox", label: "Publish immediately", required: false },
];

export function PrincipalForm({
  mode,
  id,
  onSuccess,
}: {
  mode: "create" | "edit";
  id?: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const existingPrincipal = useQuery({
    queryKey: ["principals", id],
    queryFn: () => client.principals.get({ id: id! }),
    enabled: mode === "edit" && !!id,
  });

  const mutation = useMutation({
    mutationFn: (values: CreatePrincipalValues | UpdatePrincipalValues) => {
      if (mode === "create") {
        return client.principals.create(values as any);
      }
      return client.principals.update({ id: id!, ...values } as any);
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Principal created" : "Principal updated");
      queryClient.invalidateQueries({ queryKey: ["principals"] });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const principal = existingPrincipal.data;

  const config: FormConfig<CreatePrincipalValues | UpdatePrincipalValues> = {
    fields,
    layout: [
      { columns: [{ fields: ["sortOrder"] }] },
      { columns: [{ fields: ["publishNow"] }] },
    ],
    submitLabel: mode === "create" ? "Create Principal" : "Save Changes",
    onCancel: () => onSuccess?.(),
    hooks: {
      beforeSubmit: (values) => ({
        ...values,
        sortOrder: values.sortOrder === "" || values.sortOrder == null ? undefined : Number(values.sortOrder),
      }),
    },
    renderAboveFields: () => (
      <div className="flex gap-6">
        <div className="w-[200px] shrink-0">
          <PortraitField />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4">
          <NameField />
          <TitleField />
          <TenureField />
          <QuoteField />
          <EducationField />
          <BioField />
        </div>
      </div>
    ),
    renderBelowFields: () => (
      <div className="grid grid-cols-1 gap-4">
        <MessageField />
      </div>
    ),
  };

  if (mode === "edit" && existingPrincipal.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded bg-muted animate-pulse" />
        <div className="h-[300px] rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (mode === "edit" && !existingPrincipal.data) {
    return <div className="p-4 text-center text-muted-foreground">Principal not found.</div>;
  }

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createPrincipalSchema : updatePrincipalSchema}
      defaultValues={
        principal
          ? {
              name: principal.name,
              title: principal.title ?? "",
              quote: principal.quote ?? "",
              message: principal.message ?? "",
              bio: principal.bio ?? "",
              education: principal.education ?? "",
              tenure: principal.tenure ?? "",
              portrait: principal.portrait ?? "",
              sortOrder: principal.sortOrder ?? 0,
              publishNow: principal.status === "published",
            }
          : {
              name: "",
              title: "Principal",
              quote: "",
              message: "",
              bio: "",
              education: "",
              tenure: "",
              portrait: "",
              sortOrder: 0,
              publishNow: false,
            }
      }
      mutationOptions={{
        mutationFn: async ({ body }: { body: CreatePrincipalValues | UpdatePrincipalValues }) =>
          mutation.mutateAsync(body),
      }}
    />
  );
}
