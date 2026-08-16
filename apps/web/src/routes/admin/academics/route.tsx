"use client";

import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { FormBuilder } from "@aloysius-web/ui/lib/form-builder";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";
import * as v from "valibot";
import { client, orpc } from "@/utils/orpc";
import { convertToWebp } from "@/utils/convert-to-webp";
import { toast } from "sonner";
import { Dropzone } from "@/components/file-upload";
import { cn } from "@aloysius-web/ui/lib/utils";

type AcademicsFormValues = {
  academics_title: string;
  academics_intro: string;
  section1_grades: string;
  section1_name: string;
  section1_desc: string;
  section2_grades: string;
  section2_name: string;
  section2_desc: string;
  section3_grades: string;
  section3_name: string;
  section3_desc: string;
  stream1_name: string;
  stream1_desc: string;
  stream2_name: string;
  stream2_desc: string;
  stream3_name: string;
  stream3_desc: string;
  stream4_name: string;
  stream4_desc: string;
  dept_subject1_name: string;
  dept_subject1_head: string;
  dept_subject2_name: string;
  dept_subject2_head: string;
  dept_subject3_name: string;
  dept_subject3_head: string;
  dept_subject4_name: string;
  dept_subject4_head: string;
  dept_subject5_name: string;
  dept_subject5_head: string;
  dept_subject6_name: string;
  dept_subject6_head: string;
  dept_subject7_name: string;
  dept_subject7_head: string;
  dept_subject8_name: string;
  dept_subject8_head: string;
  dept_subject9_name: string;
  dept_subject9_head: string;
  academics_image_1: string;
  academics_image_2: string;
  results_cta_title: string;
  results_cta_subtitle: string;
};

const DEFAULTS: AcademicsFormValues = {
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
  dept_subject1_head: "",
  dept_subject2_name: "Science",
  dept_subject2_head: "",
  dept_subject3_name: "Sinhala",
  dept_subject3_head: "",
  dept_subject4_name: "English",
  dept_subject4_head: "",
  dept_subject5_name: "History & Religion",
  dept_subject5_head: "",
  dept_subject6_name: "Commerce",
  dept_subject6_head: "",
  dept_subject7_name: "ICT & Technology",
  dept_subject7_head: "",
  dept_subject8_name: "Aesthetics (Art & Music)",
  dept_subject8_head: "",
  dept_subject9_name: "Physical Education",
  dept_subject9_head: "",
  academics_image_1: "",
  academics_image_2: "",
  results_cta_title: "Examination Results & Achievements",
  results_cta_subtitle: "O/L and A/L performance year by year.",
};

function ImageField({
  value,
  onChange,
  aspect,
}: {
  value: unknown;
  onChange: (val: unknown) => void;
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
      <label className="text-sm font-medium leading-none">Photo</label>
      {value ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img
            src={value as string}
            alt="Photo"
            className="w-full aspect-video object-cover pointer-events-none"
          />
          <Button
            variant="destructive"
            size="sm"
            type="button"
            className="absolute top-2 right-2 z-10 gap-1.5"
            onClick={() => onChange("")}
          >
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
          cropTitle="Crop Photo"
          className={cn(
            "aspect-video justify-center",
            uploading && "opacity-50 pointer-events-none",
          )}
        />
      )}
    </div>
  );
}

const academicsFields: FieldEntry<AcademicsFormValues>[] = [
  { name: "academics_title", kind: "text", label: "Title", required: true },
  { name: "academics_intro", kind: "textarea", label: "Intro", required: true },
  { name: "section1_grades", kind: "text", label: "Section 1 Grades" },
  { name: "section1_name", kind: "text", label: "Section 1 Name" },
  { name: "section1_desc", kind: "textarea", label: "Section 1 Description" },
  { name: "section2_grades", kind: "text", label: "Section 2 Grades" },
  { name: "section2_name", kind: "text", label: "Section 2 Name" },
  { name: "section2_desc", kind: "textarea", label: "Section 2 Description" },
  { name: "section3_grades", kind: "text", label: "Section 3 Grades" },
  { name: "section3_name", kind: "text", label: "Section 3 Name" },
  { name: "section3_desc", kind: "textarea", label: "Section 3 Description" },
  { name: "stream1_name", kind: "text", label: "Stream 1 Name" },
  { name: "stream1_desc", kind: "text", label: "Stream 1 Description" },
  { name: "stream2_name", kind: "text", label: "Stream 2 Name" },
  { name: "stream2_desc", kind: "text", label: "Stream 2 Description" },
  { name: "stream3_name", kind: "text", label: "Stream 3 Name" },
  { name: "stream3_desc", kind: "text", label: "Stream 3 Description" },
  { name: "stream4_name", kind: "text", label: "Stream 4 Name" },
  { name: "stream4_desc", kind: "text", label: "Stream 4 Description" },
  { name: "dept_subject1_name", kind: "text", label: "Department 1 Name" },
  { name: "dept_subject1_head", kind: "text", label: "Department 1 Head" },
  { name: "dept_subject2_name", kind: "text", label: "Department 2 Name" },
  { name: "dept_subject2_head", kind: "text", label: "Department 2 Head" },
  { name: "dept_subject3_name", kind: "text", label: "Department 3 Name" },
  { name: "dept_subject3_head", kind: "text", label: "Department 3 Head" },
  { name: "dept_subject4_name", kind: "text", label: "Department 4 Name" },
  { name: "dept_subject4_head", kind: "text", label: "Department 4 Head" },
  { name: "dept_subject5_name", kind: "text", label: "Department 5 Name" },
  { name: "dept_subject5_head", kind: "text", label: "Department 5 Head" },
  { name: "dept_subject6_name", kind: "text", label: "Department 6 Name" },
  { name: "dept_subject6_head", kind: "text", label: "Department 6 Head" },
  { name: "dept_subject7_name", kind: "text", label: "Department 7 Name" },
  { name: "dept_subject7_head", kind: "text", label: "Department 7 Head" },
  { name: "dept_subject8_name", kind: "text", label: "Department 8 Name" },
  { name: "dept_subject8_head", kind: "text", label: "Department 8 Head" },
  { name: "dept_subject9_name", kind: "text", label: "Department 9 Name" },
  { name: "dept_subject9_head", kind: "text", label: "Department 9 Head" },
  {
    name: "academics_image_1",
    kind: "custom",
    label: "Science Laboratory Photo",
    customRenderer: ({ value, onChange }) => (
      <ImageField value={value} onChange={onChange} aspect={16 / 9} />
    ),
  },
  {
    name: "academics_image_2",
    kind: "custom",
    label: "Classroom / Library Photo",
    customRenderer: ({ value, onChange }) => (
      <ImageField value={value} onChange={onChange} aspect={16 / 9} />
    ),
  },
  { name: "results_cta_title", kind: "text", label: "Title" },
  { name: "results_cta_subtitle", kind: "text", label: "Subtitle" },
];

const academicsSchema = v.object({
  academics_title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  academics_intro: v.pipe(v.string(), v.minLength(1, "Intro is required")),
  section1_grades: v.string(),
  section1_name: v.string(),
  section1_desc: v.string(),
  section2_grades: v.string(),
  section2_name: v.string(),
  section2_desc: v.string(),
  section3_grades: v.string(),
  section3_name: v.string(),
  section3_desc: v.string(),
  stream1_name: v.string(),
  stream1_desc: v.string(),
  stream2_name: v.string(),
  stream2_desc: v.string(),
  stream3_name: v.string(),
  stream3_desc: v.string(),
  stream4_name: v.string(),
  stream4_desc: v.string(),
  dept_subject1_name: v.string(),
  dept_subject1_head: v.string(),
  dept_subject2_name: v.string(),
  dept_subject2_head: v.string(),
  dept_subject3_name: v.string(),
  dept_subject3_head: v.string(),
  dept_subject4_name: v.string(),
  dept_subject4_head: v.string(),
  dept_subject5_name: v.string(),
  dept_subject5_head: v.string(),
  dept_subject6_name: v.string(),
  dept_subject6_head: v.string(),
  dept_subject7_name: v.string(),
  dept_subject7_head: v.string(),
  dept_subject8_name: v.string(),
  dept_subject8_head: v.string(),
  dept_subject9_name: v.string(),
  dept_subject9_head: v.string(),
  academics_image_1: v.string(),
  academics_image_2: v.string(),
  results_cta_title: v.string(),
  results_cta_subtitle: v.string(),
});

const academicsConfig: FormConfig<AcademicsFormValues> = {
  fields: academicsFields,
  sections: [
    { id: "hero", title: "Hero Section", collapsible: true },
    {
      id: "sections",
      title: "Sections of Study",
      description: "Primary / Secondary / Advanced Level",
      collapsible: true,
    },
    { id: "streams", title: "A/L Streams", collapsible: true },
    {
      id: "departments",
      title: "Subject Departments",
      description: "Leave a name empty to remove that row",
      collapsible: true,
    },
    { id: "results", title: "Results Callout", collapsible: true },
  ],
  layout: [
    { columns: [{ fields: ["academics_title", "academics_intro"], span: 12 }] },
    { columns: [{ fields: ["section1_grades", "section1_name"], span: 12 }] },
    { columns: [{ fields: ["section1_desc"], span: 12 }] },
    { columns: [{ fields: ["section2_grades", "section2_name"], span: 12 }] },
    { columns: [{ fields: ["section2_desc"], span: 12 }] },
    { columns: [{ fields: ["section3_grades", "section3_name"], span: 12 }] },
    { columns: [{ fields: ["section3_desc"], span: 12 }] },
    { columns: [{ fields: ["stream1_name", "stream1_desc"], span: 12 }] },
    { columns: [{ fields: ["stream2_name", "stream2_desc"], span: 12 }] },
    { columns: [{ fields: ["stream3_name", "stream3_desc"], span: 12 }] },
    { columns: [{ fields: ["stream4_name", "stream4_desc"], span: 12 }] },
    {
      columns: [
        {
          fields: [
            "dept_subject1_name",
            "dept_subject1_head",
            "dept_subject2_name",
            "dept_subject2_head",
          ],
          span: 12,
        },
      ],
    },
    {
      columns: [
        {
          fields: [
            "dept_subject3_name",
            "dept_subject3_head",
            "dept_subject4_name",
            "dept_subject4_head",
          ],
          span: 12,
        },
      ],
    },
    {
      columns: [
        {
          fields: [
            "dept_subject5_name",
            "dept_subject5_head",
            "dept_subject6_name",
            "dept_subject6_head",
          ],
          span: 12,
        },
      ],
    },
    {
      columns: [
        {
          fields: [
            "dept_subject7_name",
            "dept_subject7_head",
            "dept_subject8_name",
            "dept_subject8_head",
          ],
          span: 12,
        },
      ],
    },
    { columns: [{ fields: ["dept_subject9_name", "dept_subject9_head"], span: 12 }] },
    { columns: [{ fields: ["academics_image_1", "academics_image_2"], span: 12 }] },
    { columns: [{ fields: ["results_cta_title", "results_cta_subtitle"], span: 12 }] },
  ],
  submitLabel: "Save Changes",
};

export const Route = createFileRoute("/admin/academics")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(orpc.settings.getAll.queryOptions());
  },
  component: AdminAcademics,
});

function AdminAcademics() {
  const queryClient = useQueryClient();

  const { data: settings } = useSuspenseQuery(orpc.settings.getAll.queryOptions());

  const mutation = useMutation(
    orpc.admin.settings.setMany.mutationOptions({
      onSuccess: () => {
        toast.success("Academics page updated");
        queryClient.invalidateQueries({ queryKey: orpc.settings.key() });
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const settingsMap = settings as Record<string, string> | undefined;
  const defaultValues: AcademicsFormValues = {
    academics_title: settingsMap?.academics_title ?? DEFAULTS.academics_title,
    academics_intro: settingsMap?.academics_intro ?? DEFAULTS.academics_intro,
    section1_grades: settingsMap?.section1_grades ?? DEFAULTS.section1_grades,
    section1_name: settingsMap?.section1_name ?? DEFAULTS.section1_name,
    section1_desc: settingsMap?.section1_desc ?? DEFAULTS.section1_desc,
    section2_grades: settingsMap?.section2_grades ?? DEFAULTS.section2_grades,
    section2_name: settingsMap?.section2_name ?? DEFAULTS.section2_name,
    section2_desc: settingsMap?.section2_desc ?? DEFAULTS.section2_desc,
    section3_grades: settingsMap?.section3_grades ?? DEFAULTS.section3_grades,
    section3_name: settingsMap?.section3_name ?? DEFAULTS.section3_name,
    section3_desc: settingsMap?.section3_desc ?? DEFAULTS.section3_desc,
    stream1_name: settingsMap?.stream1_name ?? DEFAULTS.stream1_name,
    stream1_desc: settingsMap?.stream1_desc ?? DEFAULTS.stream1_desc,
    stream2_name: settingsMap?.stream2_name ?? DEFAULTS.stream2_name,
    stream2_desc: settingsMap?.stream2_desc ?? DEFAULTS.stream2_desc,
    stream3_name: settingsMap?.stream3_name ?? DEFAULTS.stream3_name,
    stream3_desc: settingsMap?.stream3_desc ?? DEFAULTS.stream3_desc,
    stream4_name: settingsMap?.stream4_name ?? DEFAULTS.stream4_name,
    stream4_desc: settingsMap?.stream4_desc ?? DEFAULTS.stream4_desc,
    dept_subject1_name: settingsMap?.dept_subject1_name ?? DEFAULTS.dept_subject1_name,
    dept_subject1_head: settingsMap?.dept_subject1_head ?? DEFAULTS.dept_subject1_head,
    dept_subject2_name: settingsMap?.dept_subject2_name ?? DEFAULTS.dept_subject2_name,
    dept_subject2_head: settingsMap?.dept_subject2_head ?? DEFAULTS.dept_subject2_head,
    dept_subject3_name: settingsMap?.dept_subject3_name ?? DEFAULTS.dept_subject3_name,
    dept_subject3_head: settingsMap?.dept_subject3_head ?? DEFAULTS.dept_subject3_head,
    dept_subject4_name: settingsMap?.dept_subject4_name ?? DEFAULTS.dept_subject4_name,
    dept_subject4_head: settingsMap?.dept_subject4_head ?? DEFAULTS.dept_subject4_head,
    dept_subject5_name: settingsMap?.dept_subject5_name ?? DEFAULTS.dept_subject5_name,
    dept_subject5_head: settingsMap?.dept_subject5_head ?? DEFAULTS.dept_subject5_head,
    dept_subject6_name: settingsMap?.dept_subject6_name ?? DEFAULTS.dept_subject6_name,
    dept_subject6_head: settingsMap?.dept_subject6_head ?? DEFAULTS.dept_subject6_head,
    dept_subject7_name: settingsMap?.dept_subject7_name ?? DEFAULTS.dept_subject7_name,
    dept_subject7_head: settingsMap?.dept_subject7_head ?? DEFAULTS.dept_subject7_head,
    dept_subject8_name: settingsMap?.dept_subject8_name ?? DEFAULTS.dept_subject8_name,
    dept_subject8_head: settingsMap?.dept_subject8_head ?? DEFAULTS.dept_subject8_head,
    dept_subject9_name: settingsMap?.dept_subject9_name ?? DEFAULTS.dept_subject9_name,
    dept_subject9_head: settingsMap?.dept_subject9_head ?? DEFAULTS.dept_subject9_head,
    academics_image_1: settingsMap?.academics_image_1 ?? DEFAULTS.academics_image_1,
    academics_image_2: settingsMap?.academics_image_2 ?? DEFAULTS.academics_image_2,
    results_cta_title: settingsMap?.results_cta_title ?? DEFAULTS.results_cta_title,
    results_cta_subtitle: settingsMap?.results_cta_subtitle ?? DEFAULTS.results_cta_subtitle,
  };

  return (
    <div className="space-y-8 p-6 w-full max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Academics Page Content</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize every section of the academics page
          </p>
        </div>
      </div>
      <FormBuilder<AcademicsFormValues>
        config={academicsConfig}
        valibotSchema={academicsSchema}
        defaultValues={defaultValues}
        mutationOptions={{
          mutationFn: async ({ body }) => {
            const items = Object.entries(body).map(([key, value]) => ({ key, value }));
            return mutation.mutateAsync({ items });
          },
        }}
        queryKeysToInvalidate={[orpc.settings.key()]}
      />
    </div>
  );
}
