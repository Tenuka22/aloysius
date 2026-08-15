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

const createDonationSchema = v.object({
  donorName: v.pipe(v.string(), v.minLength(1, "Donor name is required")),
  donorEmail: v.optional(v.pipe(v.string(), v.email("Invalid email"))),
  amount: v.optional(v.number()),
  currency: v.string(),
  purpose: v.optional(v.string()),
  message: v.optional(v.string()),
  image: v.optional(v.string()),
  isAnonymous: v.boolean(),
  status: v.picklist(["pending", "confirmed", "cancelled"]),
  donatedAt: v.optional(v.string()),
});

type CreateDonationValues = v.InferOutput<typeof createDonationSchema>;

const updateDonationSchema = v.object({
  donorName: v.pipe(v.string(), v.minLength(1, "Donor name is required")),
  donorEmail: v.optional(v.pipe(v.string(), v.email("Invalid email"))),
  amount: v.optional(v.number()),
  currency: v.string(),
  purpose: v.optional(v.string()),
  message: v.optional(v.string()),
  image: v.optional(v.string()),
  isAnonymous: v.boolean(),
  status: v.picklist(["pending", "confirmed", "cancelled"]),
  donatedAt: v.optional(v.string()),
});

type UpdateDonationValues = v.InferOutput<typeof updateDonationSchema>;

function ImageInline({ onChange }: { onChange: (val: unknown) => void }) {
  const form = useBuildForm();
  const image = useStore(form.store, (state: any) => state.values.image) as string | undefined;
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      try {
        form.setFieldValue("image", await uploadImageWithRatio(file, 16 / 9));
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
      form.setFieldValue("image", "");
    },
    [form],
  );

  return (
    <div>
      {image ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img
            src={image}
            alt="Donation"
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
          cropTitle="Crop Donation Image"
          className={cn(
            "aspect-[16/9] justify-center",
            uploading && "opacity-50 pointer-events-none",
          )}
        />
      )}
    </div>
  );
}

const fields: FieldEntry<CreateDonationValues | UpdateDonationValues>[] = [
  {
    name: "image",
    kind: "custom",
    label: "Image",
    required: false,
    customRenderer: ({ onChange }) => <ImageInline onChange={onChange} />,
  },
  {
    name: "donorName",
    kind: "text",
    label: "Donor Name",
    placeholder: "e.g. John Perera",
    required: true,
  },
  {
    name: "donorEmail",
    kind: "text",
    label: "Donor Email",
    placeholder: "john@example.com",
    required: false,
  },
  { name: "amount", kind: "number", label: "Amount", placeholder: "0.00", required: false },
  {
    name: "currency",
    kind: "select",
    label: "Currency",
    options: [
      { value: "LKR", label: "Sri Lankan Rupee (LKR)" },
      { value: "USD", label: "US Dollar (USD)" },
      { value: "GBP", label: "British Pound (GBP)" },
      { value: "EUR", label: "Euro (EUR)" },
    ],
    required: true,
  },
  {
    name: "purpose",
    kind: "text",
    label: "Purpose",
    placeholder: "e.g. Annual Fund, Building Project",
    required: false,
  },
  { name: "isAnonymous", kind: "checkbox", label: "Anonymous Donation", required: false },
  {
    name: "status",
    kind: "select",
    label: "Status",
    options: [
      { value: "pending", label: "Pending" },
      { value: "confirmed", label: "Confirmed" },
      { value: "cancelled", label: "Cancelled" },
    ],
    required: true,
  },
  { name: "donatedAt", kind: "date", label: "Donation Date", required: false },
  {
    name: "message",
    kind: "textarea",
    label: "Message",
    placeholder: "Personal message from donor...",
    required: false,
  },
];

export function OBDonationForm({
  mode,
  id,
  onSuccess,
}: {
  mode: "create" | "edit";
  id?: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const existingDonation = useQuery({
    queryKey: ["ob-donation", id],
    queryFn: () => client.ob.obDonations.get({ id: id! }),
    enabled: mode === "edit" && !!id,
  });

  const mutation = useMutation({
    mutationFn: (values: CreateDonationValues | UpdateDonationValues) => {
      if (mode === "create") {
        return client.ob.obDonations.create(values as CreateDonationValues);
      }
      return client.ob.obDonations.update({ id: id!, ...values });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Donation recorded" : "Donation updated");
      queryClient.invalidateQueries({ queryKey: ["ob-donations"] });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const donation = existingDonation.data;

  const config: FormConfig<CreateDonationValues | UpdateDonationValues> = {
    fields,
    layout: [
      {
        columns: [
          { fields: ["image"], span: 5 },
          { fields: ["donorName", "donorEmail"], span: 7 },
        ],
      },
      {
        columns: [
          { fields: ["amount"], span: 6 },
          { fields: ["currency"], span: 6 },
        ],
      },
      {
        columns: [
          { fields: ["purpose"], span: 6 },
          { fields: ["isAnonymous"], span: 6 },
        ],
      },
      {
        columns: [
          { fields: ["status"], span: 6 },
          { fields: ["donatedAt"], span: 6 },
        ],
      },
      { columns: [{ fields: ["message"] }] },
    ],
    submitLabel: mode === "create" ? "Record Donation" : "Save Changes",
    onCancel: () => onSuccess?.(),
  };

  if (mode === "edit" && existingDonation.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-40 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (mode === "edit" && !existingDonation.data) {
    return <div className="p-4 text-center text-muted-foreground">Donation not found.</div>;
  }

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createDonationSchema : updateDonationSchema}
      defaultValues={
        donation
          ? {
              donorName: donation.donorName,
              donorEmail: donation.donorEmail ?? "",
              amount: donation.amount ?? undefined,
              currency: donation.currency ?? "LKR",
              purpose: donation.purpose ?? "",
              message: donation.message ?? "",
              image: donation.image ?? "",
              isAnonymous: donation.isAnonymous,
              status: donation.status as any,
              donatedAt: donation.donatedAt ? donation.donatedAt.slice(0, 10) : "",
            }
          : {
              donorName: "",
              donorEmail: "",
              amount: undefined,
              currency: "LKR",
              purpose: "",
              message: "",
              image: "",
              isAnonymous: false,
              status: "pending" as const,
              donatedAt: "",
            }
      }
      mutationOptions={{
        mutationFn: async ({ body }: { body: CreateDonationValues | UpdateDonationValues }) =>
          mutation.mutateAsync(body),
      }}
    />
  );
}
