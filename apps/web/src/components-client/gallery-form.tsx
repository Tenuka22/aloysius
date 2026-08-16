"use client";

import { useCallback, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
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
import { SlugFieldInline } from "@/components-client/slug-field";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";

const createGallerySchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  slug: v.optional(v.string()),
  description: v.optional(v.string()),
  eventId: v.optional(v.string()),
  studentWorkId: v.optional(v.string()),
  achievementId: v.optional(v.string()),
  authorName: v.optional(v.string()),
  authorType: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
});

type CreateGalleryValues = v.InferOutput<typeof createGallerySchema>;

const updateGallerySchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  slug: v.optional(v.string()),
  description: v.optional(v.string()),
  eventId: v.optional(v.string()),
  studentWorkId: v.optional(v.string()),
  achievementId: v.optional(v.string()),
  authorName: v.optional(v.string()),
  authorType: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  tags: v.array(v.string()),
  publishNow: v.boolean(),
});

type UpdateGalleryValues = v.InferOutput<typeof updateGallerySchema>;

type FormValues = CreateGalleryValues | UpdateGalleryValues;

const fields: FieldEntry<CreateGalleryValues | UpdateGalleryValues>[] = [
  {
    name: "title",
    kind: "text",
    label: "Title",
    placeholder: "Enter album title",
    required: true,
    hidden: true,
  },
  {
    name: "slug",
    kind: "custom",
    label: "Slug",
    required: false,
    customRenderer: ({ value, onChange }) => (
      <SlugFieldInline
        routerName="gallery"
        value={(value as string) ?? ""}
        onChange={onChange}
      />
    ),
  },
  {
    name: "description",
    kind: "textarea",
    label: "Description",
    placeholder: "Brief description of this album",
    required: false,
  },
  { name: "eventId", kind: "text", label: "Event", hidden: true, required: false },
  { name: "studentWorkId", kind: "text", label: "Student Work", hidden: true, required: false },
  { name: "achievementId", kind: "text", label: "Achievement", hidden: true, required: false },
  {
    name: "authorName",
    kind: "text",
    label: "Author Name",
    placeholder: "Who created this?",
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
  { name: "coverImage", kind: "text", label: "Cover Image", hidden: true, required: false },
  { name: "tags", kind: "text", label: "Tags", hidden: true, required: false },
  { name: "publishNow", kind: "checkbox", label: "Publish immediately", required: false },
];

function TitleField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: { values: FormValues }) => state.values.title) as string;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">
        Title <span className="text-destructive">*</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => form.setFieldValue("title", e.target.value)}
        placeholder="Enter album title"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function CoverImageField() {
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
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Cover Image (16:9)</label>
      {coverImage ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full aspect-[16/9] object-cover pointer-events-none"
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
          className={cn(
            "aspect-[16/9] justify-center",
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
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Tags</label>
      <input
        type="text"
        value={tags.join(", ")}
        onChange={(e) => {
          const raw = e.target.value;
          const newTags = raw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
          form.setFieldValue("tags", newTags);
        }}
        placeholder="Add tags separated by commas"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function EventField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: { values: FormValues }) => state.values.eventId) as string;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const eventsQuery = useQuery(
    orpc.events.list.queryOptions({
      input: { page: 1, pageSize: 50, search: search || undefined },
    }),
  );

  const events = eventsQuery.data?.rows ?? [];
  const selectedEvent = events.find((e) => e.id === value);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Event</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={cn(
                "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                !value && "text-muted-foreground",
              )}
            />
          }
        >
          {selectedEvent ? (
            <span className="flex items-center gap-2 truncate">
              {selectedEvent.coverImage && (
                <img
                  src={selectedEvent.coverImage}
                  alt=""
                  className="size-6 rounded object-cover"
                />
              )}
              {selectedEvent.title}
            </span>
          ) : (
            "Select an event..."
          )}
          <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search events..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>No events found.</CommandEmpty>
              <CommandGroup>
                {events.map((event) => (
                  <CommandItem
                    key={event.id}
                    value={event.id}
                    onSelect={() => {
                      form.setFieldValue("eventId", event.id === value ? "" : event.id);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {event.coverImage && (
                        <img
                          src={event.coverImage}
                          alt=""
                          className="size-8 rounded object-cover"
                        />
                      )}
                      <span className="flex flex-col">
                        <span className="font-medium">{event.title}</span>
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
  );
}

function StudentWorkField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: { values: FormValues }) => state.values.studentWorkId) as string;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const worksQuery = useQuery(
    orpc.studentWorks.list.queryOptions({
      input: { page: 1, pageSize: 50, search: search || undefined },
    }),
  );

  const works = worksQuery.data?.rows ?? [];
  const selectedWork = works.find((w) => w.id === value);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Student Work</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={cn(
                "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                !value && "text-muted-foreground",
              )}
            />
          }
        >
          {selectedWork ? (
            <span className="flex items-center gap-2 truncate">
              {selectedWork.coverImage && (
                <img src={selectedWork.coverImage} alt="" className="size-6 rounded object-cover" />
              )}
              {selectedWork.title}
            </span>
          ) : (
            "Select a student work..."
          )}
          <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput
              placeholder="Search student works..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No student works found.</CommandEmpty>
              <CommandGroup>
                {works.map((work) => (
                  <CommandItem
                    key={work.id}
                    value={work.id}
                    onSelect={() => {
                      form.setFieldValue("studentWorkId", work.id === value ? "" : work.id);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {work.coverImage && (
                        <img src={work.coverImage} alt="" className="size-8 rounded object-cover" />
                      )}
                      <span className="flex flex-col">
                        <span className="font-medium">{work.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {work.studentNames?.join(", ")}
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
  );
}

function AchievementField() {
  const form = useBuildForm();
  const value = useStore(form.store, (state: { values: FormValues }) => state.values.achievementId) as string;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const achievementsQuery = useQuery(
    orpc.achievements.list.queryOptions({
      input: { page: 1, pageSize: 50, search: search || undefined },
    }),
  );

  const achievements = achievementsQuery.data?.rows ?? [];
  const selectedAchievement = achievements.find((a) => a.id === value);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Achievement</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={cn(
                "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                !value && "text-muted-foreground",
              )}
            />
          }
        >
          {selectedAchievement ? (
            <span className="flex items-center gap-2 truncate">
              {selectedAchievement.coverImage && (
                <img
                  src={selectedAchievement.coverImage}
                  alt=""
                  className="size-6 rounded object-cover"
                />
              )}
              {selectedAchievement.title}
            </span>
          ) : (
            "Select an achievement..."
          )}
          <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput
              placeholder="Search achievements..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No achievements found.</CommandEmpty>
              <CommandGroup>
                {achievements.map((achievement) => (
                  <CommandItem
                    key={achievement.id}
                    value={achievement.id}
                    onSelect={() => {
                      form.setFieldValue(
                        "achievementId",
                        achievement.id === value ? "" : achievement.id,
                      );
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {achievement.coverImage && (
                        <img
                          src={achievement.coverImage}
                          alt=""
                          className="size-8 rounded object-cover"
                        />
                      )}
                      <span className="flex flex-col">
                        <span className="font-medium">{achievement.title}</span>
                        {achievement.year && (
                          <span className="text-xs text-muted-foreground">{achievement.year}</span>
                        )}
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
  );
}

export function GalleryForm({
  mode,
  id,
  onSuccess,
}: {
  mode: "create" | "edit";
  id?: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const existingGallery = useQuery(
    orpc.gallery.get.queryOptions({
      input: { id: id! },
      enabled: mode === "edit" && !!id,
    }),
  );

  const createMutation = useMutation(orpc.admin.gallery.create.mutationOptions());
  const updateMutation = useMutation(orpc.admin.gallery.update.mutationOptions());

  const gallery = existingGallery.data;

  const config: FormConfig<CreateGalleryValues | UpdateGalleryValues> = {
    fields,
    layout: [
      { columns: [{ fields: ["slug"] }] },
      { columns: [{ fields: ["authorName", "authorType"] }] },
      { columns: [{ fields: ["description"] }] },
      { columns: [{ fields: ["publishNow"] }] },
    ],
    submitLabel: mode === "create" ? "Create Album" : "Save Changes",
    onCancel: () => onSuccess?.(),
    hooks: {
      beforeSubmit: (values) => ({
        ...values,
        authorType: values.authorType || undefined,
      }),
      onSuccess: () => {
        toast.success(mode === "create" ? "Gallery album created" : "Gallery album updated");
        queryClient.invalidateQueries({ queryKey: orpc.gallery.key() });
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
          <div className="grid grid-cols-3 gap-4">
            <EventField />
            <StudentWorkField />
            <AchievementField />
          </div>
          <TagsField />
        </div>
      </div>
    ),
  };

  if (mode === "edit" && existingGallery.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded bg-muted animate-pulse" />
        <div className="h-40 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (mode === "edit" && !existingGallery.data) {
    return <div className="p-4 text-center text-muted-foreground">Gallery album not found.</div>;
  }

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createGallerySchema : updateGallerySchema}
      defaultValues={
        gallery
          ? {
              title: gallery.title,
              slug: gallery.slug ?? "",
              description: gallery.description ?? "",
              eventId: gallery.eventId ?? "",
              studentWorkId: gallery.studentWorkId ?? "",
              achievementId: gallery.achievementId ?? "",
              authorName: gallery.authorName ?? "",
              authorType: gallery.authorType ?? "",
              coverImage: gallery.coverImage ?? "",
              tags: gallery.tags ?? [],
              publishNow: gallery.status === "published",
            }
          : {
              title: "",
              slug: "",
              description: "",
              eventId: "",
              studentWorkId: "",
              achievementId: "",
              authorName: "",
              authorType: "student",
              coverImage: "",
              tags: [],
              publishNow: false,
            }
      }
      onSubmit={async (values) => {
        if (mode === "create") {
          return createMutation.mutateAsync(
            values as Parameters<typeof createMutation.mutateAsync>[0],
          );
        }
        return updateMutation.mutateAsync(
          { id: id!, ...values } as Parameters<typeof updateMutation.mutateAsync>[0],
        );
      }}
    />
  );
}
