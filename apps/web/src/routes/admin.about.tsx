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

const ABOUT_KEYS = [
  "about_hero_title",
  "about_hero_intro",
  "about_history_title",
  "history1_year",
  "history1_title",
  "history1_body",
  "history1_image",
  "history2_year",
  "history2_title",
  "history2_body",
  "history2_image",
  "history3_year",
  "history3_title",
  "history3_body",
  "history3_image",
  "history4_year",
  "history4_title",
  "history4_body",
  "history4_image",
  "about_vision_statement",
  "about_mission_statement",
  "about_principal_heading",
  "about_principal_message",
  "principal_name",
  "principal_photo",
  "about_anthem_title",
  "about_anthem_desc",
  "about_administration_heading",
  "staff1_name",
  "staff1_role",
  "staff1_photo",
  "staff2_name",
  "staff2_role",
  "staff2_photo",
  "staff3_name",
  "staff3_role",
  "staff3_photo",
  "staff4_name",
  "staff4_role",
  "staff4_photo",
];

const DEFAULTS: Record<string, string> = {
  about_hero_title: "Our Story, Our Heritage",
  about_hero_intro:
    "The history, mission and people of St. Aloysius' College - a Catholic institution rooted in the heart of Galle.",
  about_history_title: "More Than a Century in Galle",
  history1_year: "1895",
  history1_title: "Founding of the College",
  history1_body:
    "St. Aloysius' College was established by Belgian Jesuit missionaries led by Bishop Joseph Van Reeth.",
  history1_image: "",
  history2_year: "1920s",
  history2_title: "Early Growth",
  history2_body: "Expansion of the College, early buildings and student body.",
  history2_image: "",
  history3_year: "1971",
  history3_title: "A Century of Excellence",
  history3_body:
    "Became a national school with the appointment of the first Buddhist principal, marking milestones in academics, sport and national life.",
  history3_image: "",
  history4_year: "Today",
  history4_title: "The Modern College",
  history4_body:
    "St. Aloysius' College today - facilities, programmes and a community of over 5,000 students.",
  history4_image: "",
  about_vision_statement:
    "To be a leading centre of academic and moral excellence, forming young men of competence, conscience and compassion.",
  about_mission_statement:
    "To provide a holistic Catholic education grounded in Jesuit values, nurturing faith, discipline and service to others.",
  about_principal_heading: "A Word from the Principal",
  about_principal_message:
    "Every Aloysian carries forward a tradition of faith, discipline and excellence - certa viriliter.",
  principal_name: "The Principal",
  principal_photo: "",
  about_anthem_title: "The College Anthem",
  about_anthem_desc:
    "Sung with pride by generations of Aloysians, our anthem embodies the spirit and values of St. Aloysius' College.",
  about_administration_heading: "College Leadership",
  staff1_name: "",
  staff1_role: "PRINCIPAL",
  staff1_photo: "",
  staff2_name: "",
  staff2_role: "VICE PRINCIPAL",
  staff2_photo: "",
  staff3_name: "",
  staff3_role: "VICE PRINCIPAL",
  staff3_photo: "",
  staff4_name: "",
  staff4_role: "SECTIONAL HEAD",
  staff4_photo: "",
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
  aspect,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  aspect?: number;
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
          aspect={aspect ?? 4 / 3}
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

function AboutEditor() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "about"],
    queryFn: () => client.settings.getAll(),
  });

  const mutation = useMutation({
    mutationFn: (items: { key: string; value: string }[]) => client.settings.setMany({ items }),
    onSuccess: () => {
      toast.success("About page updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const getValue = (key: string) => form[key] ?? settings?.[key] ?? DEFAULTS[key] ?? "";

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const items = ABOUT_KEYS.map((key) => ({
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
          <h1 className="text-2xl font-bold">About Page Content</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize every section of the about page</p>
        </div>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <section className="space-y-4">
        <SectionHeader title="Hero Section" />
        <Field
          label="Title"
          value={getValue("about_hero_title")}
          onChange={(v) => setField("about_hero_title", v)}
        />
        <Field
          label="Intro"
          value={getValue("about_hero_intro")}
          onChange={(v) => setField("about_hero_intro", v)}
          multiline
        />
      </section>

      <section className="space-y-4">
        <SectionHeader title="History Timeline" description="Four milestones shown in chronological order" />
        <Field
          label="Section Title"
          value={getValue("about_history_title")}
          onChange={(v) => setField("about_history_title", v)}
        />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label={`Milestone ${i} Year`}
                value={getValue(`history${i}_year`)}
                onChange={(v) => setField(`history${i}_year`, v)}
              />
              <Field
                label={`Milestone ${i} Title`}
                value={getValue(`history${i}_title`)}
                onChange={(v) => setField(`history${i}_title`, v)}
              />
            </div>
            <Field
              label={`Milestone ${i} Description`}
              value={getValue(`history${i}_body`)}
              onChange={(v) => setField(`history${i}_body`, v)}
              multiline
            />
            <ImageField
              label={`Milestone ${i} Photo`}
              value={getValue(`history${i}_image`)}
              onChange={(v) => setField(`history${i}_image`, v)}
            />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <SectionHeader title="Vision & Mission" />
        <Field
          label="Vision Statement"
          value={getValue("about_vision_statement")}
          onChange={(v) => setField("about_vision_statement", v)}
          multiline
        />
        <Field
          label="Mission Statement"
          value={getValue("about_mission_statement")}
          onChange={(v) => setField("about_mission_statement", v)}
          multiline
        />
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Principal's Message"
          description="Photo and name are shared with the homepage principal section"
        />
        <ImageField
          label="Principal's Photo"
          value={getValue("principal_photo")}
          onChange={(v) => setField("principal_photo", v)}
          aspect={3 / 4}
        />
        <Field
          label="Principal's Name"
          value={getValue("principal_name")}
          onChange={(v) => setField("principal_name", v)}
        />
        <Field
          label="Heading"
          value={getValue("about_principal_heading")}
          onChange={(v) => setField("about_principal_heading", v)}
        />
        <Field
          label="Message"
          value={getValue("about_principal_message")}
          onChange={(v) => setField("about_principal_message", v)}
          multiline
        />
      </section>

      <section className="space-y-4">
        <SectionHeader title="College Anthem" />
        <Field
          label="Section Title"
          value={getValue("about_anthem_title")}
          onChange={(v) => setField("about_anthem_title", v)}
        />
        <Field
          label="Section Description"
          value={getValue("about_anthem_desc")}
          onChange={(v) => setField("about_anthem_desc", v)}
          multiline
        />
      </section>

      <section className="space-y-4">
        <SectionHeader title="Administration" description="College leadership grid" />
        <Field
          label="Section Heading"
          value={getValue("about_administration_heading")}
          onChange={(v) => setField("about_administration_heading", v)}
        />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label={`Staff ${i} Name`}
                value={getValue(`staff${i}_name`)}
                onChange={(v) => setField(`staff${i}_name`, v)}
              />
              <Field
                label={`Staff ${i} Role`}
                value={getValue(`staff${i}_role`)}
                onChange={(v) => setField(`staff${i}_role`, v)}
              />
            </div>
            <ImageField
              label={`Staff ${i} Photo`}
              value={getValue(`staff${i}_photo`)}
              onChange={(v) => setField(`staff${i}_photo`, v)}
              aspect={3 / 4}
            />
          </div>
        ))}
      </section>
    </div>
  );
}

export const Route = createFileRoute("/admin/about")({
  component: AboutEditor,
});
