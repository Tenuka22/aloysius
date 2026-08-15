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

const ALUMNI_KEYS = [
  "alumni_page_title",
  "alumni_page_intro",
  "branch1_name",
  "branch1_contact",
  "branch1_url",
  "branch2_name",
  "branch2_contact",
  "branch2_url",
  "branch3_name",
  "branch3_contact",
  "branch3_url",
  "notable1_name",
  "notable1_field",
  "notable1_photo",
  "notable2_name",
  "notable2_field",
  "notable2_photo",
  "notable3_name",
  "notable3_field",
  "notable3_photo",
  "notable4_name",
  "notable4_field",
  "notable4_photo",
  "join_cta_title",
  "join_cta_desc",
  "join_cta_button_url",
];

const DEFAULTS: Record<string, string> = {
  alumni_page_title: "Once an Aloysian, Always an Aloysian",
  alumni_page_intro: "The Old Boys' Association and the global Aloysian family.",
  branch1_name: "Galle (Main Branch)",
  branch1_contact: "",
  branch1_url: "#",
  branch2_name: "Colombo Branch",
  branch2_contact: "",
  branch2_url: "#",
  branch3_name: "Overseas Branches",
  branch3_contact: "",
  branch3_url: "#",
  notable1_field: "Public Service",
  notable2_field: "Academia",
  notable3_field: "Sport",
  notable4_field: "Arts & Culture",
  join_cta_title: "Reconnect with the College",
  join_cta_desc:
    "Register with the Old Boys' Association to receive news, event invitations and ways to give back.",
  join_cta_button_url: "#",
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
          <img
            src={value}
            alt={label}
            className="w-full aspect-video object-cover pointer-events-none"
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
          aspect={3 / 4}
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
    <h2 className="text-lg font-semibold border-b pb-2 mb-2">
      {title}
      {description && (
        <p className="text-sm font-normal text-muted-foreground mt-1">{description}</p>
      )}
    </h2>
  );
}

export const Route = createFileRoute("/admin/alumni")({
  component: AdminAlumni,
});

function AdminAlumni() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "alumni"],
    queryFn: () => client.settings.getAll(),
  });

  const mutation = useMutation({
    mutationFn: (items: { key: string; value: string }[]) => client.settings.setMany({ items }),
    onSuccess: () => {
      toast.success("Alumni page updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const getValue = (key: string) => form[key] ?? settings?.[key] ?? DEFAULTS[key] ?? "";

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const items = ALUMNI_KEYS.map((key) => ({
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
          <h1 className="text-2xl font-bold">Alumni Page Content</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize every section of the alumni page
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
          value={getValue("alumni_page_title")}
          onChange={(v) => setField("alumni_page_title", v)}
        />
        <Field
          label="Intro"
          value={getValue("alumni_page_intro")}
          onChange={(v) => setField("alumni_page_intro", v)}
          multiline
        />
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="OBA Branches" />
        {[1, 2, 3].map((num) => (
          <div key={num} className="border rounded-lg p-4 space-y-3">
            <Field
              label={`Branch ${num} Name`}
              value={getValue(`branch${num}_name`)}
              onChange={(v) => setField(`branch${num}_name`, v)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label={`Branch ${num} Contact / President`}
                value={getValue(`branch${num}_contact`)}
                onChange={(v) => setField(`branch${num}_contact`, v)}
              />
              <Field
                label={`Branch ${num} Details URL`}
                value={getValue(`branch${num}_url`)}
                onChange={(v) => setField(`branch${num}_url`, v)}
                placeholder="mailto:... or https://..."
              />
            </div>
          </div>
        ))}
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader
          title="Distinguished Aloysians"
          description="Leave a name empty to remove that entry"
        />
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label={`Notable ${num} Name`}
                value={getValue(`notable${num}_name`)}
                onChange={(v) => setField(`notable${num}_name`, v)}
              />
              <Field
                label={`Notable ${num} Field`}
                value={getValue(`notable${num}_field`)}
                onChange={(v) => setField(`notable${num}_field`, v)}
              />
            </div>
            <ImageField
              label={`Notable ${num} Photo`}
              value={getValue(`notable${num}_photo`)}
              onChange={(v) => setField(`notable${num}_photo`, v)}
            />
          </div>
        ))}
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Join Callout" />
        <Field
          label="Title"
          value={getValue("join_cta_title")}
          onChange={(v) => setField("join_cta_title", v)}
        />
        <Field
          label="Description"
          value={getValue("join_cta_desc")}
          onChange={(v) => setField("join_cta_desc", v)}
          multiline
        />
        <Field
          label="Register Button URL"
          value={getValue("join_cta_button_url")}
          onChange={(v) => setField("join_cta_button_url", v)}
          description="Falls back to a mailto link using the College's contact email when left as #"
        />
      </section>
    </div>
  );
}
