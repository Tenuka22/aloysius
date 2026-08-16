"use client";

import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { FormBuilder } from "@aloysius-web/ui/lib/form-builder";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";
import * as v from "valibot";
import { client, orpc } from "@/utils/orpc";
import { convertToWebp } from "@/utils/convert-to-webp";
import { toast } from "sonner";
import { Dropzone } from "@/components/file-upload";
import { cn } from "@aloysius-web/ui/lib/utils";

const DEFAULT_HOUSES = [
  { name: "Cooreman", color: "#FFD700" },
  { name: "Murphy", color: "#E31E24" },
  { name: "Neut", color: "#009A44" },
  { name: "Standaert", color: "#C52691" },
  { name: "Van Reeth", color: "#0072CE" },
];

type StudentsFormValues = {
  students_title: string;
  students_intro: string;
  sports_cricket_image: string;
  sports_rugby_image: string;
  sports_athletics_image: string;
  sports_more_text: string;
  house1_name: string;
  house1_color: string;
  house2_name: string;
  house2_color: string;
  house3_name: string;
  house3_color: string;
  house4_name: string;
  house4_color: string;
  house5_name: string;
  house5_color: string;
  prefects_title: string;
  prefects_subtitle: string;
  prefects_cta_text: string;
  prefects_cta_url: string;
};

const DEFAULTS: StudentsFormValues = {
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

function SportsImageField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (val: unknown) => void;
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

  const imageUrl = value as string | undefined;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">Photo</label>
      {imageUrl ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img
            src={imageUrl}
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
          aspect={4 / 3}
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

const studentsFields: FieldEntry<StudentsFormValues>[] = [
  { name: "students_title", kind: "text", label: "Title", required: true },
  { name: "students_intro", kind: "textarea", label: "Intro", required: true },
  {
    name: "sports_cricket_image",
    kind: "custom",
    label: "Cricket Photo",
    customRenderer: ({ value, onChange }) => (
      <SportsImageField value={value} onChange={onChange} />
    ),
  },
  {
    name: "sports_rugby_image",
    kind: "custom",
    label: "Rugby Photo",
    customRenderer: ({ value, onChange }) => (
      <SportsImageField value={value} onChange={onChange} />
    ),
  },
  {
    name: "sports_athletics_image",
    kind: "custom",
    label: "Athletics Photo",
    customRenderer: ({ value, onChange }) => (
      <SportsImageField value={value} onChange={onChange} />
    ),
  },
  { name: "sports_more_text", kind: "text", label: "More Sports Text" },
  ...DEFAULT_HOUSES.flatMap((_, idx) => [
    {
      name: `house${idx + 1}_name` as keyof StudentsFormValues,
      kind: "text" as const,
      label: `House ${idx + 1} Name` as const,
    },
    {
      name: `house${idx + 1}_color` as keyof StudentsFormValues,
      kind: "text" as const,
      label: `House ${idx + 1} Colour` as const,
      placeholder: "#RRGGBB" as const,
    },
  ]),
  { name: "prefects_title", kind: "text", label: "Title" },
  { name: "prefects_subtitle", kind: "text", label: "Subtitle" },
  { name: "prefects_cta_text", kind: "text", label: "Button Text" },
  { name: "prefects_cta_url", kind: "text", label: "Button URL" },
];

const studentsSchema = v.object({
  students_title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  students_intro: v.pipe(v.string(), v.minLength(1, "Intro is required")),
  sports_cricket_image: v.string(),
  sports_rugby_image: v.string(),
  sports_athletics_image: v.string(),
  sports_more_text: v.string(),
  house1_name: v.string(),
  house1_color: v.string(),
  house2_name: v.string(),
  house2_color: v.string(),
  house3_name: v.string(),
  house3_color: v.string(),
  house4_name: v.string(),
  house4_color: v.string(),
  house5_name: v.string(),
  house5_color: v.string(),
  prefects_title: v.string(),
  prefects_subtitle: v.string(),
  prefects_cta_text: v.string(),
  prefects_cta_url: v.string(),
});

const studentsConfig: FormConfig<StudentsFormValues> = {
  fields: studentsFields,
  sections: [
    { id: "hero", title: "Hero Section", collapsible: true },
    { id: "sports", title: "Sports", description: "Featured photo tiles", collapsible: true },
    { id: "houses", title: "College Houses", collapsible: true },
    { id: "prefects", title: "Prefects Callout", collapsible: true },
  ],
  layout: [
    { columns: [{ fields: ["students_title", "students_intro"], span: 12 }] },
    {
      columns: [
        {
          fields: ["sports_cricket_image", "sports_rugby_image", "sports_athletics_image"],
          span: 12,
        },
      ],
    },
    { columns: [{ fields: ["sports_more_text"], span: 12 }] },
    {
      columns: [
        { fields: ["house1_name", "house1_color", "house2_name", "house2_color"], span: 12 },
      ],
    },
    {
      columns: [
        { fields: ["house3_name", "house3_color", "house4_name", "house4_color"], span: 12 },
      ],
    },
    { columns: [{ fields: ["house5_name", "house5_color"], span: 12 }] },
    { columns: [{ fields: ["prefects_title", "prefects_subtitle"], span: 12 }] },
    { columns: [{ fields: ["prefects_cta_text", "prefects_cta_url"], span: 12 }] },
  ],
  submitLabel: "Save Changes",
};

export const Route = createFileRoute("/admin/students")({
  component: AdminStudents,
});

function AdminStudents() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery(orpc.settings.getAll.queryOptions());

  const mutation = useMutation(
    orpc.admin.settings.setMany.mutationOptions({
      onSuccess: () => {
        toast.success("Students page updated");
        queryClient.invalidateQueries({ queryKey: orpc.settings.key() });
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const settingsMap = settings as Record<string, string> | undefined;
  const defaultValues: StudentsFormValues = {
    students_title: settingsMap?.students_title ?? DEFAULTS.students_title,
    students_intro: settingsMap?.students_intro ?? DEFAULTS.students_intro,
    sports_cricket_image: settingsMap?.sports_cricket_image ?? DEFAULTS.sports_cricket_image,
    sports_rugby_image: settingsMap?.sports_rugby_image ?? DEFAULTS.sports_rugby_image,
    sports_athletics_image: settingsMap?.sports_athletics_image ?? DEFAULTS.sports_athletics_image,
    sports_more_text: settingsMap?.sports_more_text ?? DEFAULTS.sports_more_text,
    house1_name: settingsMap?.house1_name ?? DEFAULTS.house1_name,
    house1_color: settingsMap?.house1_color ?? DEFAULTS.house1_color,
    house2_name: settingsMap?.house2_name ?? DEFAULTS.house2_name,
    house2_color: settingsMap?.house2_color ?? DEFAULTS.house2_color,
    house3_name: settingsMap?.house3_name ?? DEFAULTS.house3_name,
    house3_color: settingsMap?.house3_color ?? DEFAULTS.house3_color,
    house4_name: settingsMap?.house4_name ?? DEFAULTS.house4_name,
    house4_color: settingsMap?.house4_color ?? DEFAULTS.house4_color,
    house5_name: settingsMap?.house5_name ?? DEFAULTS.house5_name,
    house5_color: settingsMap?.house5_color ?? DEFAULTS.house5_color,
    prefects_title: settingsMap?.prefects_title ?? DEFAULTS.prefects_title,
    prefects_subtitle: settingsMap?.prefects_subtitle ?? DEFAULTS.prefects_subtitle,
    prefects_cta_text: settingsMap?.prefects_cta_text ?? DEFAULTS.prefects_cta_text,
    prefects_cta_url: settingsMap?.prefects_cta_url ?? DEFAULTS.prefects_cta_url,
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
          <p className="text-sm text-muted-foreground mt-1">
            Customize every section of the students page
          </p>
        </div>
      </div>
      <FormBuilder<StudentsFormValues>
        config={studentsConfig}
        valibotSchema={studentsSchema}
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
