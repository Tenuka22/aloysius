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
  "cta_title",
  "cta_subtitle",
  "cta_button_text",
  "cta_button_url",
];

const DEFAULTS: Record<string, string> = {
  hero_badge: "Est. 1862",
  hero_title: "Where Excellence\nIs Made",
  hero_subtitle:
    "St. Aloysius' College, Galle — nurturing minds, building character, and inspiring generations of leaders since 1862.",
  hero_cta1_text: "Explore Our College",
  hero_cta1_url: "/about",
  hero_cta2_text: "Student Works",
  hero_cta2_url: "/student-works",
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
            Customize the text content displayed on the homepage
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

      {/* Info Section */}
      <section className="border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> The Stats, Student Works, Achievements, Gallery, and Events
          sections are automatically populated from their respective admin pages. Content carousel
          items are pulled from published news, events, student works, achievements, gallery albums,
          and announcements.
        </p>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/admin/homepage")({
  component: HomepageEditor,
});
