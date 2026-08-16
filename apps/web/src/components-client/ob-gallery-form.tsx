"use client";

import { useCallback, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder";
import { Dropzone } from "@/components/file-upload";
import { uploadImageWithRatio } from "@/lib/upload-image";
import { IconX, IconChevronDown } from "@tabler/icons-react";
import { cn } from "@aloysius-web/ui/lib/utils";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";
import * as v from "valibot";
import { Popover, PopoverTrigger, PopoverContent } from "@aloysius-web/ui/components/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@aloysius-web/ui/components/command";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";
import type { OBEvent, OBDonation } from "@/lib/api-types";

const createGallerySchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  description: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  linkType: v.picklist(["none", "event", "donation"]),
  linkId: v.optional(v.string()),
});

type CreateGalleryValues = v.InferOutput<typeof createGallerySchema>;

const updateGallerySchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  description: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  linkType: v.picklist(["none", "event", "donation"]),
  linkId: v.optional(v.string()),
});

type UpdateGalleryValues = v.InferOutput<typeof updateGallerySchema>;

type FormValues = CreateGalleryValues | UpdateGalleryValues;

function CoverImageInline({ onChange }: { onChange: (val: unknown) => void }) {
  const form = useBuildForm();
  const coverImage = useStore(
    form.store,
    (state: { values: FormValues }) => state.values.coverImage,
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

function LinkField() {
  const form = useBuildForm();
  const linkType = useStore(
    form.store,
    (state: { values: FormValues }) => state.values.linkType,
  ) as "none" | "event" | "donation";
  const linkId = useStore(
    form.store,
    (state: { values: FormValues }) => state.values.linkId,
  ) as string | undefined;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: events = [] } = useQuery(
    orpc.ob.obEvents.list.queryOptions({ input: { search: search || undefined } }),
  );
  const { data: donations = [] } = useQuery(
    orpc.ob.obDonations.list.queryOptions({ input: { search: search || undefined } }),
  );

  const handleTypeChange = (type: "none" | "event" | "donation") => {
    form.setFieldValue("linkType", type);
    form.setFieldValue("linkId", "");
    setOpen(false);
    setSearch("");
  };

  const handleSelect = (id: string) => {
    form.setFieldValue("linkId", id === linkId ? "" : id);
    setOpen(false);
    setSearch("");
  };

  if (linkType === "none") {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium leading-none">Link to</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange("event")}
            className="flex h-9 items-center gap-2 rounded-md border border-dashed px-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <span className="size-2 rounded-full bg-blue-500" />
            Event
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("donation")}
            className="flex h-9 items-center gap-2 rounded-md border border-dashed px-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <span className="size-2 rounded-full bg-pink-500" />
            Donation
          </button>
        </div>
      </div>
    );
  }

  const items = linkType === "event" ? events : donations;
  const selectedItem = items.find((item) => item.id === linkId);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Link to</label>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
            linkType === "event"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
          )}
        >
          {linkType === "event" ? "Event" : "Donation"}
          <button
            type="button"
            onClick={() => handleTypeChange("none")}
            className="ml-0.5 hover:opacity-70"
          >
            <IconX className="size-3" />
          </button>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex h-9 flex-1 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                  !linkId && "text-muted-foreground",
                )}
              />
            }
          >
            {selectedItem ? (
              <span className="flex items-center gap-2 truncate">
                {"coverImage" in selectedItem && selectedItem.coverImage && (
                  <img
                    src={selectedItem.coverImage}
                    alt=""
                    className="size-6 rounded object-cover"
                  />
                )}
                {"title" in selectedItem ? selectedItem.title : "purpose" in selectedItem ? (selectedItem as OBDonation).purpose || `Gift from ${(selectedItem as OBDonation).isAnonymous ? "Anonymous" : (selectedItem as OBDonation).donorName}` : ""}
              </span>
            ) : (
              `Choose a ${linkType}...`
            )}
            <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command>
              <CommandInput
                placeholder={`Search ${linkType}s...`}
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>No {linkType}s found.</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item.id)}
                    >
                      <span className="flex items-center gap-2">
                        {"coverImage" in item && item.coverImage && (
                          <img
                            src={item.coverImage}
                            alt=""
                            className="size-8 rounded object-cover"
                          />
                        )}
                        <span className="flex flex-col">
                          <span className="font-medium">
                            {"title" in item
                              ? item.title
                              : "purpose" in item
                                ? (item as OBDonation).purpose ||
                                  `Gift from ${(item as OBDonation).isAnonymous ? "Anonymous" : (item as OBDonation).donorName}`
                                : ""}
                          </span>
                        </span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

const fields: FieldEntry<CreateGalleryValues | UpdateGalleryValues>[] = [
  {
    name: "coverImage",
    kind: "custom",
    label: "Cover Image",
    required: false,
    customRenderer: ({ onChange }) => <CoverImageInline onChange={onChange} />,
  },
  {
    name: "title",
    kind: "text",
    label: "Gallery Title",
    placeholder: "e.g. Annual Dinner 2024",
    required: true,
  },
  {
    name: "description",
    kind: "textarea",
    label: "Description",
    placeholder: "Brief description of this gallery",
    required: false,
  },
  {
    name: "linkType",
    kind: "custom",
    label: "Link",
    required: false,
    customRenderer: () => <LinkField />,
  },
  { name: "linkId", kind: "text", label: "Link ID", hidden: true, required: false },
];

export function OBGalleryForm({
  mode,
  id,
  onSuccess,
}: {
  mode: "create" | "edit";
  id?: string;
  onSuccess?: (result?: { id: string }) => void;
}) {
  const queryClient = useQueryClient();

  const existingGallery = useQuery(
    orpc.gallery.get.queryOptions({
      input: { id: id! },
      enabled: mode === "edit" && !!id,
    }),
  );

  const gallery = existingGallery.data;

  const buildMutationFn = () => {
    return async ({ body }: { body: CreateGalleryValues | UpdateGalleryValues }) => {
      const link =
        body.linkType === "none"
          ? { type: "none" as const }
          : body.linkType === "event"
            ? { type: "event" as const, id: body.linkId! }
            : { type: "donation" as const, id: body.linkId! };

      const base = {
        title: body.title,
        description: body.description || undefined,
        coverImage: body.coverImage || undefined,
        link,
      };

      if (mode === "create") {
        const result = await orpc.ob.obGallery.create(base);
        return result;
      }
      const result = await orpc.ob.obGallery.update({ id: id!, ...base });
      return result;
    };
  };

  const config: FormConfig<CreateGalleryValues | UpdateGalleryValues> = {
    fields,
    layout: [
      {
        columns: [
          { fields: ["coverImage"], span: 5 },
          { fields: ["title", "description"], span: 7 },
        ],
      },
      { columns: [{ fields: ["linkType"] }] },
    ],
    submitLabel: mode === "create" ? "Create Gallery" : "Save Changes",
    onCancel: () => onSuccess?.(),
    hooks: {
      onSuccess: (result: unknown) => {
        const r = result as { id: string } | undefined;
        if (mode === "create") {
          toast.success("Gallery created — add photos, then publish");
        } else {
          toast.success("Gallery updated");
        }
        queryClient.invalidateQueries({ queryKey: orpc.ob.obGallery.key() });
        onSuccess?.(r);
      },
      onError: (err: Error) => {
        toast.error(err.message);
      },
    },
  };

  if (mode === "edit" && existingGallery.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-40 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (mode === "edit" && !existingGallery.data) {
    return <div className="p-4 text-center text-muted-foreground">Gallery not found.</div>;
  }

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createGallerySchema : updateGallerySchema}
      defaultValues={
        gallery
          ? {
              title: gallery.title,
              description: gallery.description ?? "",
              coverImage: gallery.coverImage ?? "",
              linkType: gallery.obEventId
                ? ("event" as const)
                : gallery.obDonationId
                  ? ("donation" as const)
                  : ("none" as const),
              linkId: gallery.obEventId ?? gallery.obDonationId ?? "",
            }
          : {
              title: "",
              description: "",
              coverImage: "",
              linkType: "none" as const,
              linkId: "",
            }
      }
      mutationOptions={{
        mutationFn: buildMutationFn(),
      }}
    />
  );
}
