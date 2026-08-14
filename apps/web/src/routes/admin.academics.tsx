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

const ACADEMICS_KEYS = [
  "academics_title",
  "academics_intro",
  "section1_grades",
  "section1_name",
  "section1_desc",
  "section2_grades",
  "section2_name",
  "section2_desc",
  "section3_grades",
  "section3_name",
  "section3_desc",
  "stream1_name",
  "stream1_desc",
  "stream2_name",
  "stream2_desc",
  "stream3_name",
  "stream3_desc",
  "stream4_name",
  "stream4_desc",
  "dept_subject1_name",
  "dept_subject1_head",
  "dept_subject2_name",
  "dept_subject2_head",
  "dept_subject3_name",
  "dept_subject3_head",
  "dept_subject4_name",
  "dept_subject4_head",
  "dept_subject5_name",
  "dept_subject5_head",
  "dept_subject6_name",
  "dept_subject6_head",
  "dept_subject7_name",
  "dept_subject7_head",
  "dept_subject8_name",
  "dept_subject8_head",
  "dept_subject9_name",
  "dept_subject9_head",
  "academics_image_1",
  "academics_image_2",
  "results_cta_title",
  "results_cta_subtitle",
];

const DEFAULTS: Record<string, string> = {
  academics_title: "Academic Excellence",
  academics_intro: "Curriculum, streams and departments - from primary years to Advanced Level.",
  section1_grades: "GRADES 1-5",
  section1_name: "Primary Section",
  section1_desc: "Foundations in literacy, numeracy, faith and character.",
  section2_grades: "GRADES 6-11",
  section2_name: "Secondary Section",
  section2_desc: "The national curriculum through to G.C.E. Ordinary Level.",
  section3_grades: "GRADES 12-13",
  section3_name: "Advanced Level",
  section3_desc: "Specialised streams preparing students for university.",
  stream1_name: "Physical Science",
  stream1_desc: "Combined maths, physics, chemistry.",
  stream2_name: "Biological Science",
  stream2_desc: "Biology, chemistry, physics / agriculture.",
  stream3_name: "Commerce",
  stream3_desc: "Accounting, economics, business studies.",
  stream4_name: "Arts & Technology",
  stream4_desc: "Humanities, ICT and engineering technology.",
  dept_subject1_name: "Mathematics",
  dept_subject2_name: "Science",
  dept_subject3_name: "Sinhala",
  dept_subject4_name: "English",
  dept_subject5_name: "History & Religion",
  dept_subject6_name: "Commerce",
  dept_subject7_name: "ICT & Technology",
  dept_subject8_name: "Aesthetics (Art & Music)",
  dept_subject9_name: "Physical Education",
  results_cta_title: "Examination Results & Achievements",
  results_cta_subtitle: "O/L and A/L performance year by year.",
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

export const Route = createFileRoute("/admin/academics")({
  component: AdminAcademics,
});

function AdminAcademics() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "academics"],
    queryFn: () => client.settings.getAll(),
  });

  const mutation = useMutation({
    mutationFn: (items: { key: string; value: string }[]) => client.settings.setMany({ items }),
    onSuccess: () => {
      toast.success("Academics page updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const getValue = (key: string) => form[key] ?? settings?.[key] ?? DEFAULTS[key] ?? "";

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const items = ACADEMICS_KEYS.map((key) => ({
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
          <h1 className="text-2xl font-bold">Academics Page Content</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize every section of the academics page
          </p>
        </div>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Hero Section" />
        <Field
          label="Title"
          value={getValue("academics_title")}
          onChange={(v) => setField("academics_title", v)}
        />
        <Field
          label="Intro"
          value={getValue("academics_intro")}
          onChange={(v) => setField("academics_intro", v)}
          multiline
        />
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Sections of Study" description="Primary / Secondary / Advanced Level" />
        {[1, 2, 3].map((num) => (
          <div key={num} className="border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label={`Section ${num} Grades`}
                value={getValue(`section${num}_grades`)}
                onChange={(v) => setField(`section${num}_grades`, v)}
              />
              <Field
                label={`Section ${num} Name`}
                value={getValue(`section${num}_name`)}
                onChange={(v) => setField(`section${num}_name`, v)}
              />
            </div>
            <Field
              label={`Section ${num} Description`}
              value={getValue(`section${num}_desc`)}
              onChange={(v) => setField(`section${num}_desc`, v)}
            />
          </div>
        ))}
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="A/L Streams" />
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="grid grid-cols-2 gap-4">
            <Field
              label={`Stream ${num} Name`}
              value={getValue(`stream${num}_name`)}
              onChange={(v) => setField(`stream${num}_name`, v)}
            />
            <Field
              label={`Stream ${num} Description`}
              value={getValue(`stream${num}_desc`)}
              onChange={(v) => setField(`stream${num}_desc`, v)}
            />
          </div>
        ))}
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Subject Departments" description="Leave a name empty to remove that row" />
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <div key={num} className="grid grid-cols-2 gap-4">
            <Field
              label={`Department ${num} Name`}
              value={getValue(`dept_subject${num}_name`)}
              onChange={(v) => setField(`dept_subject${num}_name`, v)}
            />
            <Field
              label={`Department ${num} Head`}
              value={getValue(`dept_subject${num}_head`)}
              onChange={(v) => setField(`dept_subject${num}_head`, v)}
            />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <ImageField
            label="Science Laboratory Photo"
            value={getValue("academics_image_1")}
            onChange={(v) => setField("academics_image_1", v)}
          />
          <ImageField
            label="Classroom / Library Photo"
            value={getValue("academics_image_2")}
            onChange={(v) => setField("academics_image_2", v)}
          />
        </div>
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Results Callout" />
        <Field
          label="Title"
          value={getValue("results_cta_title")}
          onChange={(v) => setField("results_cta_title", v)}
        />
        <Field
          label="Subtitle"
          value={getValue("results_cta_subtitle")}
          onChange={(v) => setField("results_cta_subtitle", v)}
        />
      </section>
    </div>
  );
}
