"use client";

import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { Dropzone } from "@/components/file-upload";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@aloysius-web/ui/components/combobox";
import { cn } from "@aloysius-web/ui/lib/utils";
import { HOMEPAGE_KEYS, HOMEPAGE_DEFAULTS } from "@aloysius-web/db/homepage-settings";
import { client, orpc } from "@/utils/orpc";
import { convertToWebp } from "@/utils/convert-to-webp";
import { withAspectRatio, getAspectRatio, aspectRatioClass } from "@/lib/image-ratio";
import { toast } from "sonner";
import { IconX } from "@tabler/icons-react";

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

function TopAnnouncementField({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  description?: string;
}) {
  const { data: announcementsData } = useQuery(
    orpc.announcements.list.queryOptions({
      input: { page: 1, pageSize: 100, status: "published" },
    }),
  );
  const announcements = announcementsData?.rows ?? [];
  const selected = announcements.find((a) => a.id === value) ?? null;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">{label}</label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <Combobox
        items={announcements}
        value={selected}
        onValueChange={(item) => onChange(item ? item.id : "")}
        itemToStringValue={(item) => item.title}
      >
        <ComboboxInput placeholder="Select an announcement..." showClear />
        <ComboboxContent>
          <ComboboxEmpty>No announcements found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.id} value={item}>
                <span className="truncate">{item.title}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
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
        onChange(aspect ? withAspectRatio(result.url, aspect) : result.url);
      } catch {
        toast.error("Failed to upload image");
      } finally {
        setUploading(false);
      }
    },
    [onChange, aspect],
  );

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">{label}</label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {value ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img
            src={value}
            alt={label}
            className={`w-full ${aspectRatioClass(getAspectRatio(value)) || "aspect-video"} object-cover pointer-events-none`}
          />
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
          className={cn(
            "aspect-video justify-center",
            uploading && "opacity-50 pointer-events-none",
          )}
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

  const { data: settings } = useSuspenseQuery(orpc.settings.getAll.queryOptions());

  const mutation = useMutation(
    orpc.admin.settings.setMany.mutationOptions({
      onSuccess: () => {
        toast.success("Homepage updated");
        queryClient.invalidateQueries({ queryKey: orpc.settings.key() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const getValue = (key: string) =>
    form[key] ?? settings?.[key] ?? HOMEPAGE_DEFAULTS[key as keyof typeof HOMEPAGE_DEFAULTS] ?? "";

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const items = HOMEPAGE_KEYS.map((key) => ({
      key,
      value: getValue(key),
    }));
    mutation.mutate({ items });
  };

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

      {/* General */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="General" description="Site-wide details shown across the site" />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="School Name"
            value={getValue("school_name")}
            onChange={(v) => setField("school_name", v)}
          />
          <Field
            label="School Motto"
            value={getValue("school_motto")}
            onChange={(v) => setField("school_motto", v)}
          />
          <Field
            label="Contact Email"
            value={getValue("contact_email")}
            onChange={(v) => setField("contact_email", v)}
          />
          <Field
            label="Contact Phone"
            value={getValue("contact_phone")}
            onChange={(v) => setField("contact_phone", v)}
          />
        </div>
        <Field
          label="Address"
          value={getValue("address")}
          onChange={(v) => setField("address", v)}
          multiline
          description="One line per address line"
        />
      </section>

      {/* Notice Strip */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Notice Strip" description="Thin banner above the header" />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Label"
            value={getValue("notice_label")}
            onChange={(v) => setField("notice_label", v)}
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
        <TopAnnouncementField
          label="Top Announcement"
          value={getValue("top_announcement_id")}
          onChange={(v) => setField("top_announcement_id", v)}
          description="Shown in a yellow strip at the very top of the navbar; leave empty to use the Notice Text below"
        />
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
          <Field
            label="Link Label"
            value={getValue("notice_cta_text")}
            onChange={(v) => setField("notice_cta_text", v)}
            placeholder="View all notices"
          />
        </div>
      </section>

      {/* Hero Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader
          title="Hero Section"
          description="Full-bleed banner at the top of the homepage"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Eyebrow Text"
            value={getValue("hero_badge")}
            onChange={(v) => setField("hero_badge", v)}
            placeholder="e.g. Certa Viriliter"
          />
          <Field
            label="Location Line"
            value={getValue("hero_location_line")}
            onChange={(v) => setField("hero_location_line", v)}
            placeholder="e.g. GALLE • SRI LANKA"
          />
        </div>
        <Field
          label="Title"
          value={getValue("hero_title")}
          onChange={(v) => setField("hero_title", v)}
          placeholder="Main heading (use new lines for line breaks)"
          description="Use new lines to create line breaks"
          multiline
        />
        <Field
          label="Tagline"
          value={getValue("hero_tagline")}
          onChange={(v) => setField("hero_tagline", v)}
          placeholder="Italic line shown under the hero title"
          description="Italic line shown under the hero title"
        />
        <Field
          label="Scroll Hint"
          value={getValue("hero_scroll_text")}
          onChange={(v) => setField("hero_scroll_text", v)}
          placeholder="e.g. SCROLL"
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
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Eyebrow Text"
            value={getValue("heritage_eyebrow")}
            onChange={(v) => setField("heritage_eyebrow", v)}
            placeholder="e.g. OUR HERITAGE"
          />
          <Field
            label="Founding Year"
            value={getValue("founding_year")}
            onChange={(v) => setField("founding_year", v)}
            placeholder="e.g. 1862"
            description="Used to compute 'Est. [year]' and years of tradition"
          />
        </div>
        <Field
          label="Heading"
          value={getValue("heritage_heading")}
          onChange={(v) => setField("heritage_heading", v)}
          multiline
          description="Use new lines to create line breaks"
        />
        <Field
          label="Heritage Introduction"
          value={getValue("heritage_intro")}
          onChange={(v) => setField("heritage_intro", v)}
          multiline
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Founded Label"
            value={getValue("heritage_founded_label")}
            onChange={(v) => setField("heritage_founded_label", v)}
            placeholder="e.g. FOUNDED IN GALLE"
          />
          <Field
            label="Tradition Label"
            value={getValue("heritage_tradition_label")}
            onChange={(v) => setField("heritage_tradition_label", v)}
            placeholder="e.g. OF ALOYSIAN TRADITION"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Link Text"
            value={getValue("heritage_cta_text")}
            onChange={(v) => setField("heritage_cta_text", v)}
            placeholder="e.g. Explore Our History"
          />
          <Field
            label="Link URL"
            value={getValue("heritage_cta_url")}
            onChange={(v) => setField("heritage_cta_url", v)}
            placeholder="/about"
          />
        </div>
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
        <SectionHeader
          title="Principal's Message"
          description="Used when no published principal record exists; otherwise the record from the Principals admin takes precedence"
        />
        <Field
          label="Eyebrow Text"
          value={getValue("principal_eyebrow")}
          onChange={(v) => setField("principal_eyebrow", v)}
          placeholder="e.g. FROM THE PRINCIPAL"
        />
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
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Principal's Name"
            value={getValue("principal_name")}
            onChange={(v) => setField("principal_name", v)}
          />
          <Field
            label="Principal's Title"
            value={getValue("principal_title")}
            onChange={(v) => setField("principal_title", v)}
            placeholder="e.g. Principal"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Link Text"
            value={getValue("principal_cta_text")}
            onChange={(v) => setField("principal_cta_text", v)}
            placeholder="e.g. Read the Full Message"
          />
          <Field
            label="Link URL"
            value={getValue("principal_cta_url")}
            onChange={(v) => setField("principal_cta_url", v)}
            placeholder="/principals"
          />
        </div>
      </section>

      {/* Academics Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader
          title="Academics Section"
          description="Department grid; the stats row below it is auto-populated from published stats"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Eyebrow Text"
            value={getValue("academics_eyebrow")}
            onChange={(v) => setField("academics_eyebrow", v)}
            placeholder="e.g. ACADEMICS"
          />
          <Field
            label="Heading"
            value={getValue("academics_heading")}
            onChange={(v) => setField("academics_heading", v)}
            placeholder="e.g. Academic Excellence"
          />
        </div>
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
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Link Text"
            value={getValue("academics_cta_text")}
            onChange={(v) => setField("academics_cta_text", v)}
            placeholder="e.g. All Departments"
          />
          <Field
            label="Link URL"
            value={getValue("academics_cta_url")}
            onChange={(v) => setField("academics_cta_url", v)}
            placeholder="/about"
          />
        </div>
        <Field
          label="Stats Heading"
          value={getValue("stats_heading")}
          onChange={(v) => setField("stats_heading", v)}
          placeholder="e.g. Our Legacy in Numbers"
        />
        <p className="text-xs text-muted-foreground">
          Stats are managed in the{" "}
          <a href="/admin/stats" className="underline hover:text-foreground">
            Stats admin page
          </a>
        </p>
      </section>

      {/* Quick Links Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader
          title="Quick Links Section"
          description="Four shortcut tiles shown between Academics and Student Life"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Eyebrow Text"
            value={getValue("quicklinks_eyebrow")}
            onChange={(v) => setField("quicklinks_eyebrow", v)}
            placeholder="e.g. QUICK LINKS"
          />
          <Field
            label="Section Heading"
            value={getValue("quicklinks_heading")}
            onChange={(v) => setField("quicklinks_heading", v)}
            placeholder="e.g. Explore the College"
          />
          <Field
            label="Link Text"
            value={getValue("quicklinks_cta_text")}
            onChange={(v) => setField("quicklinks_cta_text", v)}
            placeholder="e.g. View All"
          />
          <Field
            label="Link URL"
            value={getValue("quicklinks_cta_url")}
            onChange={(v) => setField("quicklinks_cta_url", v)}
            placeholder="/about"
          />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="grid grid-cols-2 gap-4">
            <Field
              label={`Tile ${i} Text`}
              value={getValue(`quicklink${i}_text`)}
              onChange={(v) => setField(`quicklink${i}_text`, v)}
            />
            <Field
              label={`Tile ${i} URL`}
              value={getValue(`quicklink${i}_url`)}
              onChange={(v) => setField(`quicklink${i}_url`, v)}
              placeholder="/page"
            />
          </div>
        ))}
      </section>

      {/* Exam Results Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader
          title="Exam Results Section"
          description="Top-score block below the stats; students are managed per exam result"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Eyebrow Text"
            value={getValue("results_eyebrow")}
            onChange={(v) => setField("results_eyebrow", v)}
            placeholder="e.g. TOP SCORES"
          />
          <Field
            label="Section Heading"
            value={getValue("results_heading")}
            onChange={(v) => setField("results_heading", v)}
            placeholder="e.g. Exam Results"
          />
          <Field
            label="Link Text"
            value={getValue("results_cta_text")}
            onChange={(v) => setField("results_cta_text", v)}
            placeholder="e.g. View All Results"
          />
          <Field
            label="Link URL"
            value={getValue("results_cta_url")}
            onChange={(v) => setField("results_cta_url", v)}
            placeholder="/exam-results"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Exam results and students are managed in the{" "}
          <a href="/admin/exam-results" className="underline hover:text-foreground">
            Exam Results admin page
          </a>
        </p>
      </section>

      {/* Student Life Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader
          title="Student Life Section"
          description="Photo tiles in the campus-life mosaic"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Eyebrow Text"
            value={getValue("life_eyebrow")}
            onChange={(v) => setField("life_eyebrow", v)}
            placeholder="e.g. STUDENT LIFE"
          />
          <Field
            label="Heading"
            value={getValue("life_heading")}
            onChange={(v) => setField("life_heading", v)}
            placeholder="e.g. The Aloysian Experience"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Sports Tile Label"
            value={getValue("life_sports_label")}
            onChange={(v) => setField("life_sports_label", v)}
          />
          <ImageField
            label="Sports Photo"
            value={getValue("life_sports_image")}
            onChange={(v) => setField("life_sports_image", v)}
            aspect={1}
          />
          <Field
            label="Music & Drama Tile Label"
            value={getValue("life_music_label")}
            onChange={(v) => setField("life_music_label", v)}
          />
          <ImageField
            label="Music & Drama Photo"
            value={getValue("life_music_image")}
            onChange={(v) => setField("life_music_image", v)}
            aspect={4 / 3}
          />
          <Field
            label="Clubs & Societies Tile Label"
            value={getValue("life_clubs_label")}
            onChange={(v) => setField("life_clubs_label", v)}
          />
          <Field
            label="Clubs & Societies Subtext"
            value={getValue("life_clubs_subtext")}
            onChange={(v) => setField("life_clubs_subtext", v)}
            placeholder="e.g. Debate • Science • Media • more"
          />
          <Field
            label="Houses Tile Label"
            value={getValue("life_houses_label")}
            onChange={(v) => setField("life_houses_label", v)}
          />
          <Field
            label="Prefects Tile Label"
            value={getValue("life_prefects_label")}
            onChange={(v) => setField("life_prefects_label", v)}
          />
          <Field
            label="Scouts & Cadets Tile Label"
            value={getValue("life_scouts_label")}
            onChange={(v) => setField("life_scouts_label", v)}
          />
          <ImageField
            label="Scouts & Cadets Photo"
            value={getValue("life_scouts_image")}
            onChange={(v) => setField("life_scouts_image", v)}
            aspect={16 / 9}
          />
          <Field
            label="Faith & Service Tile Label"
            value={getValue("life_faith_label")}
            onChange={(v) => setField("life_faith_label", v)}
          />
          <ImageField
            label="Faith & Service Photo"
            value={getValue("life_faith_image")}
            onChange={(v) => setField("life_faith_image", v)}
            aspect={16 / 9}
          />
        </div>
      </section>

      {/* News & Events Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="News & Events Section" />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Eyebrow Text"
            value={getValue("events_eyebrow")}
            onChange={(v) => setField("events_eyebrow", v)}
            placeholder="e.g. NEWS & EVENTS"
          />
          <Field
            label="Section Heading"
            value={getValue("events_heading")}
            onChange={(v) => setField("events_heading", v)}
          />
          <Field
            label="Link Text"
            value={getValue("events_cta_text")}
            onChange={(v) => setField("events_cta_text", v)}
            placeholder="e.g. View All News"
          />
          <Field
            label="Link URL"
            value={getValue("events_cta_url")}
            onChange={(v) => setField("events_cta_url", v)}
            placeholder="/news-events"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Content is auto-populated from published news, events, and announcements
        </p>
      </section>

      {/* Achievement Wall */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Achievement Wall" />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Eyebrow Text"
            value={getValue("achievements_eyebrow")}
            onChange={(v) => setField("achievements_eyebrow", v)}
            placeholder="e.g. HALL OF FAME"
          />
          <Field
            label="Section Heading"
            value={getValue("achievements_heading")}
            onChange={(v) => setField("achievements_heading", v)}
          />
        </div>
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
          label="Eyebrow Text"
          value={getValue("alumni_eyebrow")}
          onChange={(v) => setField("alumni_eyebrow", v)}
          placeholder="e.g. OLD BOYS' ASSOCIATION"
        />
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
          <ImageField
            label="OB Archival Photo 1"
            value={getValue("ob_archival_image_1")}
            onChange={(v) => setField("ob_archival_image_1", v)}
            aspect={4 / 3}
          />
          <ImageField
            label="OB Archival Photo 2"
            value={getValue("ob_archival_image_2")}
            onChange={(v) => setField("ob_archival_image_2", v)}
            aspect={4 / 3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Primary Button Text"
            value={getValue("alumni_cta1_text")}
            onChange={(v) => setField("alumni_cta1_text", v)}
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
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Eyebrow Text"
            value={getValue("gallery_eyebrow")}
            onChange={(v) => setField("gallery_eyebrow", v)}
            placeholder="e.g. MEDIA"
          />
          <Field
            label="Section Heading"
            value={getValue("gallery_heading")}
            onChange={(v) => setField("gallery_heading", v)}
          />
          <Field
            label="Link Text"
            value={getValue("gallery_cta_text")}
            onChange={(v) => setField("gallery_cta_text", v)}
            placeholder="e.g. Full Gallery"
          />
          <Field
            label="Link URL"
            value={getValue("gallery_cta_url")}
            onChange={(v) => setField("gallery_cta_url", v)}
            placeholder="/gallery"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Content is auto-populated from published gallery albums
        </p>
      </section>

      {/* Footer */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Footer" />
        <Field
          label="Copyright Line"
          value={getValue("footer_copyright")}
          onChange={(v) => setField("footer_copyright", v)}
          description="Use {year} as a placeholder for the current year"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Facebook URL"
            value={getValue("footer_social_facebook")}
            onChange={(v) => setField("footer_social_facebook", v)}
            placeholder="https://facebook.com/..."
          />
          <Field
            label="Instagram URL"
            value={getValue("footer_social_instagram")}
            onChange={(v) => setField("footer_social_instagram", v)}
            placeholder="https://instagram.com/..."
          />
          <Field
            label="YouTube URL"
            value={getValue("footer_social_youtube")}
            onChange={(v) => setField("footer_social_youtube", v)}
            placeholder="https://youtube.com/..."
          />
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/admin/homepage")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(orpc.settings.getAll.queryOptions());
  },
  component: HomepageEditor,
});
