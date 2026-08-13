"use client";

import { useCallback, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder";
import { TagInput } from "@/components-client/tag-input";
import { SlugFieldInline } from "@/components-client/slug-field";
import { Dropzone } from "@/components/file-upload";
import { IconX } from "@tabler/icons-react";
import { cn } from "@aloysius-web/ui/lib/utils";
import { client } from "@/utils/orpc";
import { convertToWebp } from "@/utils/convert-to-webp";
import { toast } from "sonner";
import * as v from "valibot";
import { Input } from "@aloysius-web/ui/components/input";
import { NameListInput } from "@/components-client/name-list-input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@aloysius-web/ui/components/select";
import { Field, FieldLabel, FieldContent } from "@aloysius-web/ui/components/field";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";

const categoryOptions = [
  { value: "film", label: "Film" },
  { value: "art", label: "Art" },
  { value: "music", label: "Music" },
  { value: "writing", label: "Writing" },
  { value: "design", label: "Design" },
  { value: "photography", label: "Photography" },
  { value: "code", label: "Code" },
  { value: "other", label: "Other" },
];

const createSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  slug: v.optional(v.string()),
  description: v.optional(v.string()),
  category: v.picklist([
    "film",
    "art",
    "music",
    "writing",
    "design",
    "photography",
    "code",
    "other",
  ]),
  studentNames: v.array(v.string()),
  authorType: v.optional(v.string()),
  studentGrade: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  contentUrl: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
});

type CreateValues = v.InferOutput<typeof createSchema>;

const updateSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  slug: v.optional(v.string()),
  description: v.optional(v.string()),
  category: v.picklist([
    "film",
    "art",
    "music",
    "writing",
    "design",
    "photography",
    "code",
    "other",
  ]),
  studentNames: v.array(v.string()),
  authorType: v.optional(v.string()),
  studentGrade: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  contentUrl: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
});

type UpdateValues = v.InferOutput<typeof updateSchema>;

const fields: FieldEntry<CreateValues | UpdateValues>[] = [
  {
    name: "title",
    kind: "text",
    label: "Title",
    placeholder: "Enter work title",
    required: true,
    hidden: true,
  },
  {
    name: "slug",
    kind: "custom",
    label: "Slug",
    required: false,
    customRenderer: () => null,
    renderField: (name, value, onChange) => (
      <SlugFieldInline
        routerName="studentWorks"
        value={(value as string) ?? ""}
        onChange={(v) => onChange(v)}
      />
    ),
  },
  {
    name: "description",
    kind: "textarea",
    label: "Description",
    placeholder: "Brief description of the work",
    required: false,
  },
  {
    name: "category",
    kind: "select",
    label: "Category",
    options: categoryOptions,
    required: true,
    hidden: true,
  },
  { name: "studentNames", kind: "text", label: "Student Names", hidden: true, required: true },
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
    name: "studentGrade",
    kind: "text",
    label: "Student Grade",
    placeholder: "e.g. Grade 10",
    required: false,
  },
  { name: "coverImage", kind: "text", label: "Cover Image", hidden: true, required: false },
  {
    name: "contentUrl",
    kind: "text",
    label: "Content URL",
    placeholder: "Link to the work (optional)",
    required: false,
  },
  { name: "tags", kind: "text", label: "Tags", hidden: true, required: false },
  { name: "publishNow", kind: "checkbox", label: "Publish immediately", required: false },
];

function TitleField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.title) as string;

  return (
    <Field>
      <FieldLabel>
        Title <span className="text-destructive">*</span>
      </FieldLabel>
      <FieldContent>
        <Input
          value={value}
          onChange={(e) => form.setFieldValue("title", e.target.value)}
          placeholder="Enter work title"
        />
      </FieldContent>
    </Field>
  );
}

function CategoryField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.category) as string;

  return (
    <Field>
      <FieldLabel>
        Category <span className="text-destructive">*</span>
      </FieldLabel>
      <FieldContent>
        <Select
          value={value}
          onValueChange={(val) => form.setFieldValue("category", val)}
          items={categoryOptions}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldContent>
    </Field>
  );
}

function StudentNameField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.studentNames) as string[];

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">
        Student Names <span className="text-destructive">*</span>
      </label>
      <NameListInput
        value={value}
        onChange={(names) => form.setFieldValue("studentNames", names)}
        placeholder="Add student name"
      />
    </div>
  );
}

function CoverImageField() {
  const form = useBuildForm();
  const coverImage = useStore(form.store, (state: any) => state.values.coverImage) as
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
        form.setFieldValue("coverImage", result.url);
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
      <label className="text-sm font-medium leading-none">Cover Image (1:1)</label>
      {coverImage ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full aspect-square object-cover pointer-events-none"
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
          aspect={1}
          cropTitle="Crop Cover Image"
          className={cn(
            "aspect-square justify-center",
            uploading && "opacity-50 pointer-events-none",
          )}
        />
      )}
    </div>
  );
}

function TagsField() {
  const form = useBuildForm();
  const tags = (form.state.values.tags as string[]) ?? [];

  return (
    <Field>
      <FieldLabel>Tags</FieldLabel>
      <FieldContent>
        <TagInput
          value={tags}
          onChange={(newTags) => form.setFieldValue("tags", newTags)}
          placeholder="Add a tag"
        />
      </FieldContent>
    </Field>
  );
}

export function StudentWorkForm({
  mode,
  id,
  onSuccess,
  activityId,
}: {
  mode: "create" | "edit";
  id?: string;
  onSuccess?: () => void;
  activityId?: string;
}) {
  const queryClient = useQueryClient();

  const existingWork = useQuery({
    queryKey: ["studentWorks", id],
    queryFn: () => client.studentWorks.get({ id: id! }),
    enabled: mode === "edit" && !!id,
  });

  const work = existingWork.data;

  const config: FormConfig<CreateValues | UpdateValues> = {
    fields,
    layout: [
      { columns: [{ fields: ["slug"] }] },
      { columns: [{ fields: ["description"] }] },
      { columns: [{ fields: ["authorType"] }] },
      { columns: [{ fields: ["studentGrade"] }] },
      { columns: [{ fields: ["contentUrl"] }] },
      { columns: [{ fields: ["publishNow"] }] },
    ],
    submitLabel: mode === "create" ? "Create Student Work" : "Save Changes",
    onCancel: () => onSuccess?.(),
    hooks: {
      beforeSubmit: (values) => ({
        ...values,
        authorType: values.authorType || undefined,
        category: values.category || undefined,
      }),
      onSuccess: () => {
        toast.success(mode === "create" ? "Student work created" : "Student work updated");
        queryClient.invalidateQueries({ queryKey: ["studentWorks"] });
        onSuccess?.();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    },
    renderAboveFields: () => (
      <div className="flex gap-6">
        <div className="w-[280px] shrink-0">
          <CoverImageField />
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <TitleField />
          <CategoryField />
          <StudentNameField />
          <TagsField />
        </div>
      </div>
    ),
  };

  if (mode === "edit" && existingWork.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded bg-muted animate-pulse" />
        <div className="h-[300px] rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (mode === "edit" && !existingWork.data) {
    return <div className="p-4 text-center text-muted-foreground">Student work not found.</div>;
  }

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createSchema : updateSchema}
      defaultValues={
        work
          ? {
              title: work.title,
              slug: work.slug ?? "",
              description: work.description ?? "",
              category: work.category,
              studentNames: work.studentNames ?? [],
              authorType: work.authorType ?? "",
              studentGrade: work.studentGrade ?? "",
              coverImage: work.coverImage ?? "",
              contentUrl: work.contentUrl ?? "",
              tags: work.tags ?? [],
              publishNow: work.status === "published",
            }
          : {
              title: "",
              slug: "",
              description: "",
              category: "other",
              studentNames: [],
              authorType: "",
              studentGrade: "",
              coverImage: "",
              contentUrl: "",
              tags: [],
              publishNow: false,
            }
      }
      onSubmit={async (values) => {
        if (mode === "create") {
          return client.studentWorks.create({ ...(values as CreateValues), activityId } as any);
        }
        return client.studentWorks.update({ id: id!, ...values });
      }}
    />
  );
}
