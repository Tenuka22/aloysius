"use client";

import { useCallback, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder";
import { Dropzone } from "@/components/file-upload";
import { uploadImageWithRatio } from "@/lib/upload-image";
import { IconX } from "@tabler/icons-react";
import { cn } from "@aloysius-web/ui/lib/utils";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import * as v from "valibot";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";

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
  sortOrder: v.number(),
  status: v.picklist(["pending", "approved", "rejected", "revoked"]),
});

type UpdateMemberValues = v.InferOutput<typeof updateMemberSchema>;

const fields: FieldEntry<CreateMemberValues | UpdateMemberValues>[] = [
  { name: "photo", kind: "custom", label: "Photo", required: false, customRenderer: ({ value, onChange }) => <PhotoFieldInline value={value} onChange={onChange} /> },
  { name: "name", kind: "text", label: "Full Name", placeholder: "e.g. John Perera", required: true },
  {
    name: "role",
    kind: "select",
    label: "Role / Position",
    options: COMMITTEE_ROLES.map((r) => ({ value: r, label: r })),
    required: true,
  },
  {
    name: "email",
    kind: "text",
    label: "Email",
    placeholder: "john@example.com",
    required: false,
  },
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

function PhotoFieldInline({ value, onChange }: { value: unknown; onChange: (val: unknown) => void }) {
  const form = useBuildForm();
  const photo = useStore(form.store, (state: any) => state.values.photo) as string | undefined;
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      try {
        form.setFieldValue("photo", await uploadImageWithRatio(file, 4 / 3));
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
      form.setFieldValue("photo", "");
    },
    [form],
  );

  return (
    <div>
      {photo ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img
            src={photo}
            alt="Member"
            className="w-full aspect-[4/3] object-cover pointer-events-none"
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
          aspect={4 / 3}
          cropTitle="Crop Member Photo"
          className={cn(
            "aspect-[4/3] justify-center",
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
}: {
  mode: "create" | "edit";
  id?: string;
  onSuccess?: () => void;
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
      { columns: [{ fields: ["photo"], span: 4 }, { fields: ["name", "role", "email"], span: 8 }] },
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
              sortOrder: member.sortOrder ?? 0,
              status: member.status as any,
            }
          : {
              name: "",
              role: "",
              email: "",
              photo: "",
              bio: "",
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
