"use client";

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { client } from "@/utils/orpc";
import { toast } from "sonner";

const HOMEPAGE_KEYS = [
  "hero_badge",
  "hero_title",
  "hero_subtitle",
  "hero_cta1_text",
  "hero_cta1_url",
  "hero_cta2_text",
  "hero_cta2_url",
  "stats_heading",
  "student_works_heading",
  "student_works_description",
  "achievements_heading",
  "achievements_description",
  "gallery_heading",
  "gallery_description",
  "events_heading",
  "events_description",
  "cta_title",
  "cta_subtitle",
  "cta_button_text",
  "cta_button_url",
];

const DEFAULTS: Record<string, string> = {
  hero_badge: "Est. 1862",
  hero_title: "Where Excellence\nIs Made",
  hero_subtitle:
    "St. Aloysius' College, Galle - nurturing minds, building character, and inspiring generations of leaders since 1862.",
  hero_cta1_text: "Explore Our College",
  hero_cta1_url: "/about",
  hero_cta2_text: "Student Works",
  hero_cta2_url: "/student-works",
  stats_heading: "Our Legacy in Numbers",
  student_works_heading: "Latest Student Works",
  student_works_description: "Explore creative projects from our talented students",
  achievements_heading: "Achievements",
  achievements_description: "Celebrating excellence and accomplishment",
  gallery_heading: "Gallery",
  gallery_description: "Moments captured from campus life",
  events_heading: "Events & Announcements",
  events_description: "Stay updated with the latest from our community",
  cta_title: "Be part of a legacy.\nBuild your future.",
  cta_subtitle: "Join a community where values meet vision, and every student shines.",
  cta_button_text: "Apply Now",
  cta_button_url: "#",
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
            Customize headings, descriptions, and call-to-action text
          </p>
        </div>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Hero Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Hero Section" description="Main banner at the top of the homepage" />
        <Field
          label="Badge Text"
          value={getValue("hero_badge")}
          onChange={(v) => setField("hero_badge", v)}
          placeholder="e.g. Est. 1862"
          description="Small text above the main heading"
        />
        <Field
          label="Title"
          value={getValue("hero_title")}
          onChange={(v) => setField("hero_title", v)}
          placeholder="Main heading (use new lines for line breaks)"
          description="The main headline - use new lines to create line breaks"
          multiline
        />
        <Field
          label="Subtitle"
          value={getValue("hero_subtitle")}
          onChange={(v) => setField("hero_subtitle", v)}
          placeholder="Description text below the heading"
          multiline
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Primary Button Text"
            value={getValue("hero_cta1_text")}
            onChange={(v) => setField("hero_cta1_text", v)}
            placeholder="e.g. Explore Our College"
          />
          <Field
            label="Primary Button URL"
            value={getValue("hero_cta1_url")}
            onChange={(v) => setField("hero_cta1_url", v)}
            placeholder="e.g. /about"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Secondary Button Text"
            value={getValue("hero_cta2_text")}
            onChange={(v) => setField("hero_cta2_text", v)}
            placeholder="e.g. Student Works"
          />
          <Field
            label="Secondary Button URL"
            value={getValue("hero_cta2_url")}
            onChange={(v) => setField("hero_cta2_url", v)}
            placeholder="e.g. /student-works"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Stats Section" description="Statistics displayed below the hero" />
        <Field
          label="Section Heading"
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

      {/* Student Works Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader
          title="Student Works Section"
          description="Showcase of student creative projects"
        />
        <Field
          label="Section Heading"
          value={getValue("student_works_heading")}
          onChange={(v) => setField("student_works_heading", v)}
          placeholder="e.g. Latest Student Works"
        />
        <Field
          label="Section Description"
          value={getValue("student_works_description")}
          onChange={(v) => setField("student_works_description", v)}
          placeholder="e.g. Explore creative projects from our talented students"
        />
        <p className="text-xs text-muted-foreground">
          Content is auto-populated from published student works
        </p>
      </section>

      {/* Achievements Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader
          title="Achievements Section"
          description="Highlights of awards and accomplishments"
        />
        <Field
          label="Section Heading"
          value={getValue("achievements_heading")}
          onChange={(v) => setField("achievements_heading", v)}
          placeholder="e.g. Achievements"
        />
        <Field
          label="Section Description"
          value={getValue("achievements_description")}
          onChange={(v) => setField("achievements_description", v)}
          placeholder="e.g. Celebrating excellence and accomplishment"
        />
        <p className="text-xs text-muted-foreground">
          Content is auto-populated from published achievements
        </p>
      </section>

      {/* Gallery Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Gallery Section" description="Photo gallery from campus life" />
        <Field
          label="Section Heading"
          value={getValue("gallery_heading")}
          onChange={(v) => setField("gallery_heading", v)}
          placeholder="e.g. Gallery"
        />
        <Field
          label="Section Description"
          value={getValue("gallery_description")}
          onChange={(v) => setField("gallery_description", v)}
          placeholder="e.g. Moments captured from campus life"
        />
        <p className="text-xs text-muted-foreground">
          Content is auto-populated from published gallery albums
        </p>
      </section>

      {/* Events & Announcements Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader
          title="Events & Announcements"
          description="Latest news and upcoming events"
        />
        <Field
          label="Section Heading"
          value={getValue("events_heading")}
          onChange={(v) => setField("events_heading", v)}
          placeholder="e.g. Events & Announcements"
        />
        <Field
          label="Section Description"
          value={getValue("events_description")}
          onChange={(v) => setField("events_description", v)}
          placeholder="e.g. Stay updated with the latest from our community"
        />
        <p className="text-xs text-muted-foreground">
          Content is auto-populated from published events, news, and announcements
        </p>
      </section>

      {/* CTA Banner Section */}
      <section className="border bg-card p-6 space-y-4">
        <SectionHeader
          title="Call-to-Action Banner"
          description="Banner section near the bottom of the homepage"
        />
        <Field
          label="Title"
          value={getValue("cta_title")}
          onChange={(v) => setField("cta_title", v)}
          placeholder="Banner heading (use new lines for line breaks)"
          description="Use new lines to create line breaks"
          multiline
        />
        <Field
          label="Subtitle"
          value={getValue("cta_subtitle")}
          onChange={(v) => setField("cta_subtitle", v)}
          placeholder="Banner description text"
          multiline
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Button Text"
            value={getValue("cta_button_text")}
            onChange={(v) => setField("cta_button_text", v)}
            placeholder="e.g. Apply Now"
          />
          <Field
            label="Button URL"
            value={getValue("cta_button_url")}
            onChange={(v) => setField("cta_button_url", v)}
            placeholder="e.g. /apply"
          />
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/admin/homepage")({
  component: HomepageEditor,
});
