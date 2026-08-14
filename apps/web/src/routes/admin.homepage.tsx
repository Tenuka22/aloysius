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

const HOMEPAGE_KEYS = [
  "notice_text",
  "notice_url",
  "notice_priority",
  "hero_badge",
  "hero_title",
  "hero_tagline",
  "hero_bg_image",
  "hero_cta1_text",
  "hero_cta1_url",
  "hero_cta2_text",
  "hero_cta2_url",
  "founding_year",
  "heritage_intro",
  "heritage_image_1",
  "heritage_image_2",
  "principal_photo",
  "principal_quote",
  "principal_name",
  "dept1_name",
  "dept1_desc",
  "dept2_name",
  "dept2_desc",
  "dept3_name",
  "dept3_desc",
  "dept4_name",
  "dept4_desc",
  "stats_heading",
  "life_sports_image",
  "life_music_image",
  "life_scouts_image",
  "life_faith_image",
  "events_heading",
  "achievements_heading",
  "achievements_description",
  "alumni_quote",
  "alumni_description",
  "alumni_photo",
  "alumni_cta1_text",
  "alumni_cta1_url",
  "alumni_cta2_text",
  "alumni_cta2_url",
  "gallery_heading",
];

const DEFAULTS: Record<string, string> = {
  notice_text: "",
  notice_url: "/news-events",
  notice_priority: "standard",
  hero_badge: "Certa Viriliter",
  hero_title: "St. Aloysius'\nCollege",
  hero_tagline: "Tradition. Excellence. Leadership.",
  hero_bg_image: "",
  hero_cta1_text: "Explore the College",
  hero_cta1_url: "/about",
  hero_cta2_text: "Admissions",
  hero_cta2_url: "/admissions",
  founding_year: "1862",
  heritage_intro:
    "For generations, St. Aloysius' College has shaped the minds and character of young men in the Southern Province - grounded in faith, discipline, and the pursuit of excellence.",
  heritage_image_1: "",
  heritage_image_2: "",
  principal_photo: "",
  principal_quote:
    "Every Aloysian carries forward a tradition of faith, discipline and excellence - certa viriliter.",
  principal_name: "The Principal",
  dept1_name: "Science & Mathematics",
  dept1_desc: "Physical sciences, biology and mathematics streams.",
  dept2_name: "Languages & Humanities",
  dept2_desc: "Sinhala, English, Tamil, history and religion.",
  dept3_name: "Commerce",
  dept3_desc: "Accounting, economics and business studies.",
  dept4_name: "Technology & Aesthetics",
  dept4_desc: "ICT, engineering technology, art and music.",
  stats_heading: "Our Legacy in Numbers",
  life_sports_image: "",
  life_music_image: "",
  life_scouts_image: "",
  life_faith_image: "",
  events_heading: "Life at the College",
  achievements_heading: "The Achievement Wall",
  achievements_description: "Academic, sporting and national honours earned by Aloysians.",
  alumni_quote: "The Aloysian Legacy Continues.",
  alumni_description:
    "A global network of Aloysians in leadership, service and scholarship - connected by the crest they carried.",
  alumni_photo: "",
  alumni_cta1_text: "Old Boys' Association",
  alumni_cta1_url: "/alumni",
  alumni_cta2_text: "Distinguished Aloysians",
  alumni_cta2_url: "/alumni#distinguished",
  gallery_heading: "Gallery",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  description,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  description?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">{label}</label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="flex w-full border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  description,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  description?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">{label}</label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  aspect,
  description,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  aspect?: number;
  description?: string;
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
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
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
          aspect={aspect ?? 16 / 9}
          cropTitle={`Crop ${label}`}
          className={cn("aspect-video justify-center", uploading && "opacity-50 pointer-events-none")}
        />
      )}
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-border pb-3 mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function HomepageEditor() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "homepage"],
    queryFn: () => client.settings.getAll(),
  });

  const mutation = useMutation({
    mutationFn: (items: { key: string; value: string }[]) => client.settings.setMany({ items }),
    onSuccess: () => {
      toast.success("Homepage updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const getValue = (key: string) => form[key] ?? settings?.[key] ?? DEFAULTS[key] ?? "";

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const items = HOMEPAGE_KEYS.map((key) => ({
      key,
      value: getValue(key),
    }));
    mutation.mutate(items);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 bg-muted animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse" />
          <div className="h-20 bg-muted animate-pulse" />
          <div className="h-10 bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 w-full max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Homepage Content</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize every section of the homepage
          </p>
        </div>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Notice Strip */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Notice Strip" description="Thin banner above the header" />
        <Field
          label="Notice Text"
          value={getValue("notice_text")}
          onChange={(v) => setField("notice_text", v)}
          placeholder="e.g. Admissions for the next academic year now open"
          description="Leave empty to hide the notice strip entirely"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Notice Link URL"
            value={getValue("notice_url")}
            onChange={(v) => setField("notice_url", v)}
            placeholder="/news-events"
          />
          <SelectField
            label="Priority"
            value={getValue("notice_priority")}
            onChange={(v) => setField("notice_priority", v)}
            options={[
              { value: "standard", label: "Standard (gold)" },
              { value: "high", label: "High priority (red)" },
            ]}
          />
        </div>
      </section>

      {/* Hero Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Hero Section" description="Full-bleed banner at the top of the homepage" />
        <Field
          label="Eyebrow Text"
          value={getValue("hero_badge")}
          onChange={(v) => setField("hero_badge", v)}
          placeholder="e.g. Certa Viriliter"
        />
        <Field
          label="Title"
          value={getValue("hero_title")}
          onChange={(v) => setField("hero_title", v)}
          placeholder="Main heading (use new lines for line breaks)"
          description="Use new lines to create line breaks"
          multiline
        />
        <SelectField
          label="Tagline"
          value={getValue("hero_tagline")}
          onChange={(v) => setField("hero_tagline", v)}
          options={[
            { value: "Tradition. Excellence. Leadership.", label: "Tradition. Excellence. Leadership." },
            {
              value: "Rooted in Heritage. Inspiring the Future.",
              label: "Rooted in Heritage. Inspiring the Future.",
            },
          ]}
          description="Italic line shown under the hero title"
        />
        <ImageField
          label="Background Photo"
          value={getValue("hero_bg_image")}
          onChange={(v) => setField("hero_bg_image", v)}
          aspect={16 / 9}
          description="Falls back to a solid dark green background when unset"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Primary Button Text"
            value={getValue("hero_cta1_text")}
            onChange={(v) => setField("hero_cta1_text", v)}
          />
          <Field
            label="Primary Button URL"
            value={getValue("hero_cta1_url")}
            onChange={(v) => setField("hero_cta1_url", v)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Secondary Button Text"
            value={getValue("hero_cta2_text")}
            onChange={(v) => setField("hero_cta2_text", v)}
          />
          <Field
            label="Secondary Button URL"
            value={getValue("hero_cta2_url")}
            onChange={(v) => setField("hero_cta2_url", v)}
          />
        </div>
      </section>

      {/* Heritage Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Heritage Section" description="'A Legacy of Excellence' section" />
        <Field
          label="Founding Year"
          value={getValue("founding_year")}
          onChange={(v) => setField("founding_year", v)}
          placeholder="e.g. 1862"
          description="Used to compute 'Est. [year]' and years of tradition"
        />
        <Field
          label="Heritage Introduction"
          value={getValue("heritage_intro")}
          onChange={(v) => setField("heritage_intro", v)}
          multiline
        />
        <div className="grid grid-cols-2 gap-4">
          <ImageField
            label="Archival Photo 1"
            value={getValue("heritage_image_1")}
            onChange={(v) => setField("heritage_image_1", v)}
            aspect={4 / 3}
          />
          <ImageField
            label="Archival Photo 2"
            value={getValue("heritage_image_2")}
            onChange={(v) => setField("heritage_image_2", v)}
            aspect={4 / 3}
          />
        </div>
      </section>

      {/* Principal's Message */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Principal's Message" />
        <ImageField
          label="Principal's Photo"
          value={getValue("principal_photo")}
          onChange={(v) => setField("principal_photo", v)}
          aspect={3 / 4}
        />
        <Field
          label="Quote"
          value={getValue("principal_quote")}
          onChange={(v) => setField("principal_quote", v)}
          multiline
        />
        <Field
          label="Principal's Name"
          value={getValue("principal_name")}
          onChange={(v) => setField("principal_name", v)}
        />
      </section>

      {/* Academics Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader
          title="Academics Section"
          description="Department grid; the stats row below it is auto-populated from published stats"
        />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="grid grid-cols-2 gap-4">
            <Field
              label={`Department ${i} Name`}
              value={getValue(`dept${i}_name`)}
              onChange={(v) => setField(`dept${i}_name`, v)}
            />
            <Field
              label={`Department ${i} Description`}
              value={getValue(`dept${i}_desc`)}
              onChange={(v) => setField(`dept${i}_desc`, v)}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Stats are managed in the{" "}
          <a href="/admin/stats" className="underline hover:text-foreground">
            Stats admin page
          </a>
        </p>
      </section>

      {/* Student Life Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Student Life Section" description="Photo tiles in the campus-life mosaic" />
        <div className="grid grid-cols-2 gap-4">
          <ImageField
            label="Sports Photo"
            value={getValue("life_sports_image")}
            onChange={(v) => setField("life_sports_image", v)}
          />
          <ImageField
            label="Music & Drama Photo"
            value={getValue("life_music_image")}
            onChange={(v) => setField("life_music_image", v)}
          />
          <ImageField
            label="Scouts & Cadets Photo"
            value={getValue("life_scouts_image")}
            onChange={(v) => setField("life_scouts_image", v)}
          />
          <ImageField
            label="Faith & Service Photo"
            value={getValue("life_faith_image")}
            onChange={(v) => setField("life_faith_image", v)}
          />
        </div>
      </section>

      {/* News & Events Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="News & Events Section" />
        <Field
          label="Section Heading"
          value={getValue("events_heading")}
          onChange={(v) => setField("events_heading", v)}
        />
        <p className="text-xs text-muted-foreground">
          Content is auto-populated from published news, events, and announcements
        </p>
      </section>

      {/* Achievement Wall */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Achievement Wall" />
        <Field
          label="Section Heading"
          value={getValue("achievements_heading")}
          onChange={(v) => setField("achievements_heading", v)}
        />
        <Field
          label="Section Description"
          value={getValue("achievements_description")}
          onChange={(v) => setField("achievements_description", v)}
          multiline
        />
        <p className="text-xs text-muted-foreground">
          Content is auto-populated from published achievements
        </p>
      </section>

      {/* Alumni Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Alumni Section" description="Old Boys' Association section" />
        <Field
          label="Heading Quote"
          value={getValue("alumni_quote")}
          onChange={(v) => setField("alumni_quote", v)}
        />
        <Field
          label="Description"
          value={getValue("alumni_description")}
          onChange={(v) => setField("alumni_description", v)}
          multiline
        />
        <ImageField
          label="Alumni Photo"
          value={getValue("alumni_photo")}
          onChange={(v) => setField("alumni_photo", v)}
          aspect={1}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Primary Button Text"
            value={getValue("alumni_cta1_text")}
            onChange={(v) => setField("alumni_cta1_text", v)}
          />
          <Field
            label="Primary Button URL"
            value={getValue("alumni_cta1_url")}
            onChange={(v) => setField("alumni_cta1_url", v)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Secondary Button Text"
            value={getValue("alumni_cta2_text")}
            onChange={(v) => setField("alumni_cta2_text", v)}
          />
          <Field
            label="Secondary Button URL"
            value={getValue("alumni_cta2_url")}
            onChange={(v) => setField("alumni_cta2_url", v)}
          />
        </div>
      </section>

      {/* Gallery Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Gallery Section" />
        <Field
          label="Section Heading"
          value={getValue("gallery_heading")}
          onChange={(v) => setField("gallery_heading", v)}
        />
        <p className="text-xs text-muted-foreground">
          Content is auto-populated from published gallery albums
        </p>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/admin/homepage")({
  component: HomepageEditor,
});
