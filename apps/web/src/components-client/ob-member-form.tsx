"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder";
import { Dropzone } from "@/components/file-upload";
import { uploadImageWithRatio } from "@/lib/upload-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import { cn } from "@aloysius-web/ui/lib/utils";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import * as v from "valibot";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";
import { IconX } from "@tabler/icons-react";

const COMMITTEE_ROLES = [
  "PATRON",
  "JESUIT REPRESENTATIVE",
  "PARISH PRIEST",
  "PRESIDENT",
  "SECRETARY",
  "TREASURER",
  "VICE PRESIDENT - ADMINISTRATION",
  "VICE PRESIDENT - ACADEMICS",
  "VICE PRESIDENT - SOCIAL & CURRICULAR EVENTS",
  "VICE PRESIDENT - FUNDRAISING",
  "VICE PRESIDENT - MEMBERSHIP",
  "VICE PRESIDENT - PLAYGROUND & SPORTS",
  "ASSISTANT SECRETARY",
  "ASSISTANT TREASURER",
  "COMMITTEE MEMBER",
  "ADVISORY BOARD",
];

const createMemberSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  role: v.pipe(v.string(), v.minLength(1, "Role is required")),
  email: v.optional(v.pipe(v.string(), v.email("Invalid email"))),
  photo: v.optional(v.string()),
  bio: v.optional(v.string()),
  year: v.string(),
  sortOrder: v.number(),
  status: v.picklist(["pending", "approved", "rejected", "revoked"]),
});

type CreateMemberValues = v.InferOutput<typeof createMemberSchema>;

const updateMemberSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  role: v.pipe(v.string(), v.minLength(1, "Role is required")),
  email: v.optional(v.pipe(v.string(), v.email("Invalid email"))),
  photo: v.optional(v.string()),
  bio: v.optional(v.string()),
  year: v.string(),
  sortOrder: v.number(),
  status: v.picklist(["pending", "approved", "rejected", "revoked"]),
});

type UpdateMemberValues = v.InferOutput<typeof updateMemberSchema>;

const fields: FieldEntry<CreateMemberValues | UpdateMemberValues>[] = [
  {
    name: "photo",
    kind: "custom",
    label: "Photo",
    required: false,
    customRenderer: ({ value, onChange }) => <PhotoFieldInline value={value} onChange={onChange} />,
  },
  {
    name: "name",
    kind: "text",
    label: "Full Name",
    placeholder: "e.g. John Perera",
    required: true,
  },
  {
    name: "role",
    kind: "custom",
    label: "Role / Position",
    customRenderer: ({ value, onChange, formValues, setFieldValue }) => (
      <RoleField
        value={value}
        onChange={onChange}
        formValues={formValues as Record<string, unknown>}
        setFieldValue={setFieldValue}
      />
    ),
    required: true,
  },
  {
    name: "year",
    kind: "text",
    label: "Year",
    placeholder: "e.g. 2026",
    required: true,
  },
  { name: "email", kind: "text", label: "Email", placeholder: "john@example.com", required: false },
  {
    name: "bio",
    kind: "textarea",
    label: "Bio",
    placeholder: "Short bio about the member...",
    required: false,
  },
  { name: "sortOrder", kind: "number", label: "Sort Order", required: false },
  { name: "status", kind: "text", label: "Status", hidden: true, required: false },
];

function RoleField({
  value,
  onChange,
  formValues,
  setFieldValue,
}: {
  value: unknown;
  onChange: (val: unknown) => void;
  formValues: Record<string, unknown>;
  setFieldValue: (name: string, val: unknown) => void;
}) {
  const [loading, setLoading] = useState(false);
  const prevRole = useRef(value);

  useEffect(() => {
    if (value === "PRESIDENT" && prevRole.current !== "PRESIDENT") {
      setLoading(true);
      client.principals
        .getCurrent()
        .then((principal) => {
          if (principal?.name) {
            setFieldValue("name", principal.name);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    prevRole.current = value;
  }, [value, setFieldValue]);

  return (
    <Select value={value as string} onValueChange={onChange} disabled={loading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {COMMITTEE_ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PhotoFieldInline({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const form = useBuildForm();
  const photo = useStore(form.store, (state: any) => state.values.photo) as string | undefined;
  const [uploading, setUploading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      try {
        form.setFieldValue("photo", await uploadImageWithRatio(file, aspectRatio));
      } catch {
        toast.error("Failed to upload image");
      } finally {
        setUploading(false);
      }
    },
    [form, aspectRatio],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.setFieldValue("photo", "");
    },
    [form],
  );

  const aspectLabel =
    aspectRatio === 16 / 9
      ? "16 : 9 (Wide)"
      : aspectRatio === 4 / 3
        ? "4 : 3 (Standard)"
        : aspectRatio === 1
          ? "1 : 1 (Square)"
          : aspectRatio === 3 / 4
            ? "3 : 4 (Portrait)"
            : "Custom";

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <Select
          value={String(aspectRatio)}
          onValueChange={(v) => setAspectRatio(Number.parseFloat(v))}
          disabled={uploading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Aspect ratio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1.7777777777777777">16 : 9 (Wide)</SelectItem>
            <SelectItem value="1.3333333333333333">4 : 3 (Standard)</SelectItem>
            <SelectItem value="1">1 : 1 (Square)</SelectItem>
            <SelectItem value="0.75">3 : 4 (Portrait)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[11px] text-muted-foreground tracking-wider">{aspectLabel}</span>
      </div>
      {photo ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img
            src={photo}
            alt="Member"
            className="w-full object-cover pointer-events-none"
            style={{ aspectRatio: String(aspectRatio) }}
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
          aspect={aspectRatio}
          cropTitle="Crop Member Photo"
          className={cn(
            "justify-center",
            uploading && "opacity-50 pointer-events-none",
          )}
        />
      )}
    </div>
  );
}

export function OBMemberForm({
  mode,
  id,
  onSuccess,
  defaultYear,
}: {
  mode: "create" | "edit";
  id?: string;
  onSuccess?: () => void;
  defaultYear?: string;
}) {
  const queryClient = useQueryClient();

  const existingMember = useQuery({
    queryKey: ["ob-member", id],
    queryFn: () => client.ob.obMembers.get({ id: id! }),
    enabled: mode === "edit" && !!id,
  });

  const mutation = useMutation({
    mutationFn: (values: CreateMemberValues | UpdateMemberValues) => {
      if (mode === "create") {
        return client.ob.obMembers.create(values as CreateMemberValues);
      }
      return client.ob.obMembers.update({ id: id!, ...values });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Member created" : "Member updated");
      queryClient.invalidateQueries({ queryKey: ["ob-members"] });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const member = existingMember.data;

  const config: FormConfig<CreateMemberValues | UpdateMemberValues> = {
    fields,
    layout: [
      {
        columns: [
          { fields: ["photo"], span: 4 },
          { fields: ["name", "role", "year", "email"], span: 8 },
        ],
      },
      { columns: [{ fields: ["sortOrder"] }] },
      { columns: [{ fields: ["bio"] }] },
    ],
    submitLabel: mode === "create" ? "Create Member" : "Save Changes",
    onCancel: () => onSuccess?.(),
  };

  if (mode === "edit" && existingMember.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-40 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (mode === "edit" && !existingMember.data) {
    return <div className="p-4 text-center text-muted-foreground">Member not found.</div>;
  }

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createMemberSchema : updateMemberSchema}
      defaultValues={
        member
          ? {
              name: member.name,
              role: member.role,
              email: member.email ?? "",
              photo: member.photo ?? "",
              bio: member.bio ?? "",
              year: member.year ?? "",
              sortOrder: member.sortOrder ?? 0,
              status: member.status as any,
            }
          : {
              name: "",
              role: "",
              email: "",
              photo: "",
              bio: "",
              year: defaultYear ?? "",
              sortOrder: 0,
              status: "approved" as const,
            }
      }
      mutationOptions={{
        mutationFn: async ({ body }: { body: CreateMemberValues | UpdateMemberValues }) =>
          mutation.mutateAsync(body),
      }}
    />
  );
}
