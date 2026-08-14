"use client";

import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { Dropzone } from "@/components/file-upload";
import { cn } from "@aloysius-web/ui/lib/utils";
import { client } from "@/utils/orpc";
import { convertToWebp } from "@/utils/convert-to-webp";
import { toast } from "sonner";
import { IconX } from "@tabler/icons-react";

const DEFAULT_HOUSES = [
  { name: "Cooreman", color: "#FFD700" },
  { name: "Murphy", color: "#E31E24" },
  { name: "Neut", color: "#009A44" },
  { name: "Standaert", color: "#C52691" },
  { name: "Van Reeth", color: "#0072CE" },
];

const STUDENTS_KEYS = [
  "students_title",
  "students_intro",
  "sports_cricket_image",
  "sports_rugby_image",
  "sports_athletics_image",
  "sports_more_text",
  "house1_name",
  "house1_color",
  "house2_name",
  "house2_color",
  "house3_name",
  "house3_color",
  "house4_name",
  "house4_color",
  "house5_name",
  "house5_color",
  "prefects_title",
  "prefects_subtitle",
  "prefects_cta_text",
  "prefects_cta_url",
];

const DEFAULTS: Record<string, string> = {
  students_title: "Student Life",
  students_intro: "Sports, societies, houses and the traditions that shape every Aloysian.",
  sports_cricket_image: "",
  sports_rugby_image: "",
  sports_athletics_image: "",
  sports_more_text: "Swimming • Football • Chess • more",
  house1_name: DEFAULT_HOUSES[0].name,
  house1_color: DEFAULT_HOUSES[0].color,
  house2_name: DEFAULT_HOUSES[1].name,
  house2_color: DEFAULT_HOUSES[1].color,
  house3_name: DEFAULT_HOUSES[2].name,
  house3_color: DEFAULT_HOUSES[2].color,
  house4_name: DEFAULT_HOUSES[3].name,
  house4_color: DEFAULT_HOUSES[3].color,
  house5_name: DEFAULT_HOUSES[4].name,
  house5_color: DEFAULT_HOUSES[4].color,
  prefects_title: "Prefects' Guild & Student Leadership",
  prefects_subtitle: "Leadership, service and discipline.",
  prefects_cta_text: "Meet the Prefects",
  prefects_cta_url: "#",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-20"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      try {
        const webp = await convertToWebp(file);
        const result = await client.files.uploadFile(webp);
        onChange(result.url);
      } catch {
        toast.error("Failed to upload image");
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">{label}</label>
      {value ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img src={value} alt={label} className="w-full aspect-video object-cover pointer-events-none" />
          <Button
            variant="destructive"
            size="sm"
            type="button"
            className="absolute top-2 right-2 z-10 gap-1.5"
            onClick={() => onChange("")}
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
          aspect={4 / 3}
          cropTitle={`Crop ${label}`}
          className={cn("aspect-video justify-center", uploading && "opacity-50 pointer-events-none")}
        />
      )}
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <h2 className="text-lg font-semibold border-b pb-2 mb-2">
      {title}
      {description && <p className="text-sm font-normal text-muted-foreground mt-1">{description}</p>}
    </h2>
  );
}

export const Route = createFileRoute("/admin/students")({
  component: AdminStudents,
});

function AdminStudents() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "students"],
    queryFn: () => client.settings.getAll(),
  });

  const mutation = useMutation({
    mutationFn: (items: { key: string; value: string }[]) => client.settings.setMany({ items }),
    onSuccess: () => {
      toast.success("Students page updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const getValue = (key: string) => form[key] ?? settings?.[key] ?? DEFAULTS[key] ?? "";

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const items = STUDENTS_KEYS.map((key) => ({
      key,
      value: getValue(key),
    }));
    mutation.mutate(items);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 w-full max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students Page Content</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize every section of the students page</p>
        </div>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Hero Section" />
        <Field
          label="Title"
          value={getValue("students_title")}
          onChange={(v) => setField("students_title", v)}
        />
        <Field
          label="Intro"
          value={getValue("students_intro")}
          onChange={(v) => setField("students_intro", v)}
          multiline
        />
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Sports" description="Featured photo tiles" />
        <div className="grid grid-cols-2 gap-4">
          <ImageField
            label="Cricket Photo"
            value={getValue("sports_cricket_image")}
            onChange={(v) => setField("sports_cricket_image", v)}
          />
          <ImageField
            label="Rugby Photo"
            value={getValue("sports_rugby_image")}
            onChange={(v) => setField("sports_rugby_image", v)}
          />
        </div>
        <ImageField
          label="Athletics Photo"
          value={getValue("sports_athletics_image")}
          onChange={(v) => setField("sports_athletics_image", v)}
        />
        <Field
          label="More Sports Text"
          value={getValue("sports_more_text")}
          onChange={(v) => setField("sports_more_text", v)}
        />
        <p className="text-xs text-muted-foreground">
          Clubs & Societies below are auto-populated from published clubs
        </p>
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="College Houses" />
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num} className="grid grid-cols-2 gap-4">
            <Field
              label={`House ${num} Name`}
              value={getValue(`house${num}_name`)}
              onChange={(v) => setField(`house${num}_name`, v)}
            />
            <Field
              label={`House ${num} Colour`}
              value={getValue(`house${num}_color`)}
              onChange={(v) => setField(`house${num}_color`, v)}
              placeholder="#RRGGBB"
            />
          </div>
        ))}
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Prefects Callout" />
        <Field
          label="Title"
          value={getValue("prefects_title")}
          onChange={(v) => setField("prefects_title", v)}
        />
        <Field
          label="Subtitle"
          value={getValue("prefects_subtitle")}
          onChange={(v) => setField("prefects_subtitle", v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Button Text"
            value={getValue("prefects_cta_text")}
            onChange={(v) => setField("prefects_cta_text", v)}
          />
          <Field
            label="Button URL"
            value={getValue("prefects_cta_url")}
            onChange={(v) => setField("prefects_cta_url", v)}
          />
        </div>
      </section>
    </div>
  );
}
