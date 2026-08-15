"use client";

import { useCallback, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder";
import { MinimalTiptapEditor } from "@aloysius-web/ui/components/minimal-tiptap";
import { Input } from "@aloysius-web/ui/components/input";
import { Textarea } from "@aloysius-web/ui/components/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@aloysius-web/ui/components/select";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldDescription,
} from "@aloysius-web/ui/components/field";
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
  year: v.optional(v.string()),
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
  year: v.optional(v.string()),
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
    <Field>
      <FieldLabel>Portrait (3:4)</FieldLabel>
      <FieldContent>
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
      </FieldContent>
    </Field>
  );
}

function NameField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.name) as string;

  return (
    <Field>
      <FieldLabel>
        Name <span className="text-destructive">*</span>
      </FieldLabel>
      <FieldContent>
        <Input
          value={value}
          onChange={(e) => form.setFieldValue("name", e.target.value)}
          placeholder="e.g. Fr. Jason Thomas"
        />
      </FieldContent>
    </Field>
  );
}

const STAFF_ROLES = [
  { value: "PRINCIPAL", label: "Principal" },
  { value: "VICE PRINCIPAL", label: "Vice Principal" },
  { value: "DEPUTY PRINCIPAL", label: "Deputy Principal" },
  { value: "SECTIONAL HEAD - PRIMARY (1-5)", label: "Sectional Head - Primary (1-5)" },
  { value: "SECTIONAL HEAD - JUNIOR (6-9)", label: "Sectional Head - Junior (6-9)" },
  { value: "SECTIONAL HEAD - SENIOR (9-11)", label: "Sectional Head - Senior (9-11)" },
  { value: "SECTIONAL HEAD - COLLEGE (12-13)", label: "Sectional Head - College (12-13)" },
  { value: "BURSAR", label: "Bursar" },
  { value: "DIRECTOR OF STUDIES", label: "Director of Studies" },
  { value: "SPORTS DIRECTOR", label: "Sports Director" },
] as const;

type RoleValue = (typeof STAFF_ROLES)[number]["value"];

function RoleField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.title) as RoleValue | "";

  return (
    <Field>
      <FieldLabel>Role</FieldLabel>
      <FieldContent>
        <Select
          value={value}
          onValueChange={(val) => form.setFieldValue("title", val ?? "")}
          items={STAFF_ROLES}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select role..." />
          </SelectTrigger>
          <SelectContent>
            {STAFF_ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldContent>
    </Field>
  );
}

function YearField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.year) as string;

  return (
    <Field>
      <FieldLabel>Academic Year</FieldLabel>
      <FieldContent>
        <Input
          value={value}
          onChange={(e) => form.setFieldValue("year", e.target.value)}
          placeholder="e.g. 2026"
        />
        <FieldDescription>The academic year this staff member served in.</FieldDescription>
      </FieldContent>
    </Field>
  );
}

function TenureField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.tenure) as string;

  return (
    <Field>
      <FieldLabel>Tenure / Years of Service</FieldLabel>
      <FieldContent>
        <Input
          value={value}
          onChange={(e) => form.setFieldValue("tenure", e.target.value)}
          placeholder="e.g. 2019 - Present"
        />
      </FieldContent>
    </Field>
  );
}

function QuoteField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.quote) as string;

  return (
    <Field>
      <FieldLabel>Short Quote</FieldLabel>
      <FieldContent>
        <Textarea
          value={value}
          onChange={(e) => form.setFieldValue("quote", e.target.value)}
          placeholder="A short quote shown on the homepage teaser..."
          className="min-h-[88px]"
        />
        <FieldDescription>
          Shown as the teaser on the homepage and principals list.
        </FieldDescription>
      </FieldContent>
    </Field>
  );
}

function EducationField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.education) as string;

  return (
    <Field>
      <FieldLabel>Education &amp; Qualifications</FieldLabel>
      <FieldContent>
        <Textarea
          value={value}
          onChange={(e) => form.setFieldValue("education", e.target.value)}
          placeholder={"e.g. B.A. (Hons) University of Peradeniya\nM.Ed. University of Colombo"}
          className="min-h-[112px]"
        />
        <FieldDescription>One qualification per line.</FieldDescription>
      </FieldContent>
    </Field>
  );
}

function BioField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.bio) as string;

  return (
    <Field>
      <FieldLabel>Bio / About</FieldLabel>
      <FieldContent>
        <Textarea
          value={value}
          onChange={(e) => form.setFieldValue("bio", e.target.value)}
          placeholder="A short personal profile..."
          className="min-h-[104px]"
        />
        <FieldDescription>
          Shown under the &ldquo;About&rdquo; heading on the principal&rsquo;s page.
        </FieldDescription>
      </FieldContent>
    </Field>
  );
}

function MessageField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: any) => state.values.message) as string;

  const handleImageUpload = useCallback(async (file: File) => {
    const webp = await convertToWebp(file);
    const result = await client.files.uploadFile(webp);
    return result.url;
  }, []);

  return (
    <Field>
      <FieldLabel>Full Message</FieldLabel>
      <FieldContent>
        <MinimalTiptapEditor
          value={value}
          onChange={(val) => form.setFieldValue("message", val)}
          onImageUpload={handleImageUpload}
          className="min-h-[300px]"
          placeholder="The principal's full message shown on the dedicated page..."
        />
        <FieldDescription>
          Rich text message — shown on the principal&rsquo;s dedicated page.
        </FieldDescription>
      </FieldContent>
    </Field>
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
  { name: "year", kind: "text", label: "Year", hidden: true, required: false },
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
    layout: [{ columns: [{ fields: ["sortOrder"] }] }, { columns: [{ fields: ["publishNow"] }] }],
    submitLabel: mode === "create" ? "Create Principal" : "Save Changes",
    onCancel: () => onSuccess?.(),
    hooks: {
      beforeSubmit: (values) => ({
        ...values,
        sortOrder:
          values.sortOrder === "" || values.sortOrder == null
            ? undefined
            : Number(values.sortOrder),
      }),
    },
    renderAboveFields: () => (
      <div className="flex gap-6">
        <div className="w-[200px] shrink-0">
          <PortraitField />
        </div>
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <NameField />
            <RoleField />
            <YearField />
            <TenureField />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <QuoteField />
            <EducationField />
          </div>
          <BioField />
        </div>
      </div>
    ),
    renderBelowFields: () => <MessageField />,
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
              year: principal.year ?? "",
              portrait: principal.portrait ?? "",
              sortOrder: principal.sortOrder ?? 0,
              publishNow: principal.status === "published",
            }
          : {
              name: "",
              title: "PRINCIPAL",
              quote: "",
              message: "",
              bio: "",
              education: "",
              tenure: "",
              year: String(new Date().getFullYear()),
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
