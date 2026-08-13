"use client";

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { client } from "@/utils/orpc";
import { toast } from "sonner";

const ADMISSIONS_KEYS = [
  "admissions_badge",
  "admissions_title",
  "admissions_subtitle",
  "admissions_step1_title",
  "admissions_step1_desc",
  "admissions_step2_title",
  "admissions_step2_desc",
  "admissions_step3_title",
  "admissions_step3_desc",
  "admissions_step4_title",
  "admissions_step4_desc",
  "admissions_cta_title",
  "admissions_cta_desc",
  "admissions_cta_button_text",
  "admissions_cta_button_url",
  "admissions_contact_email",
];

const DEFAULTS: Record<string, string> = {
  admissions_badge: "Join Us",
  admissions_title: "How to Apply",
  admissions_subtitle:
    "Become part of the St. Aloysius' College family. Follow these simple steps to begin your journey with us.",
  admissions_step1_title: "Review Requirements",
  admissions_step1_desc:
    "Check eligibility and the documents needed before applying. Ensure you meet the academic and age requirements for your desired grade level.",
  admissions_step2_title: "Submit Application",
  admissions_step2_desc:
    "Complete and hand in the official application form by the deadline. Include all required supporting documents.",
  admissions_step3_title: "Interview & Selection",
  admissions_step3_desc:
    "Shortlisted families are invited for the selection process. This includes an interview, entrance assessment, and interaction with faculty.",
  admissions_step4_title: "Enrolment",
  admissions_step4_desc:
    "Successful applicants complete enrolment and join the College. Confirm your place by attending orientation.",
  admissions_cta_title: "Ready to Apply?",
  admissions_cta_desc:
    "Download the application form or contact our admissions office for more information.",
  admissions_cta_button_text: "Contact Admissions",
  admissions_cta_button_url: "mailto:admissions@aloysiuscollege.lk",
  admissions_contact_email: "admissions@aloysiuscollege.lk",
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
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
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

export const Route = createFileRoute("/admin/admissions")({
  component: AdminAdmissions,
});

function AdminAdmissions() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "admissions"],
    queryFn: () => client.settings.getAll(),
  });

  const mutation = useMutation({
    mutationFn: (items: { key: string; value: string }[]) => client.settings.setMany({ items }),
    onSuccess: () => {
      toast.success("Admissions page updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const getValue = (key: string) => form[key] ?? settings?.[key] ?? DEFAULTS[key] ?? "";

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const items = ADMISSIONS_KEYS.map((key) => ({
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
        <h1 className="text-2xl font-bold">Admissions Page Content</h1>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <section className="border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Hero Section</h2>
        <Field
          label="Badge"
          value={getValue("admissions_badge")}
          onChange={(v) => setField("admissions_badge", v)}
          placeholder="e.g. Join Us"
        />
        <Field
          label="Title"
          value={getValue("admissions_title")}
          onChange={(v) => setField("admissions_title", v)}
          placeholder="e.g. How to Apply"
        />
        <Field
          label="Subtitle"
          value={getValue("admissions_subtitle")}
          onChange={(v) => setField("admissions_subtitle", v)}
          placeholder="Short description"
          multiline
        />
      </section>

      <section className="border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Steps</h2>
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="grid grid-cols-2 gap-4">
            <Field
              label={`Step ${num} Title`}
              value={getValue(`admissions_step${num}_title`)}
              onChange={(v) => setField(`admissions_step${num}_title`, v)}
              placeholder="Step title"
            />
            <Field
              label={`Step ${num} Description`}
              value={getValue(`admissions_step${num}_desc`)}
              onChange={(v) => setField(`admissions_step${num}_desc`, v)}
              placeholder="Step description"
              multiline
            />
          </div>
        ))}
      </section>

      <section className="border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Call to Action</h2>
        <Field
          label="CTA Title"
          value={getValue("admissions_cta_title")}
          onChange={(v) => setField("admissions_cta_title", v)}
          placeholder="e.g. Ready to Apply?"
        />
        <Field
          label="CTA Description"
          value={getValue("admissions_cta_desc")}
          onChange={(v) => setField("admissions_cta_desc", v)}
          placeholder="CTA description"
          multiline
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Button Text"
            value={getValue("admissions_cta_button_text")}
            onChange={(v) => setField("admissions_cta_button_text", v)}
            placeholder="e.g. Contact Admissions"
          />
          <Field
            label="Button URL"
            value={getValue("admissions_cta_button_url")}
            onChange={(v) => setField("admissions_cta_button_url", v)}
            placeholder="e.g. mailto:admissions@aloysiuscollege.lk"
          />
        </div>
        <Field
          label="Contact Email"
          value={getValue("admissions_contact_email")}
          onChange={(v) => setField("admissions_contact_email", v)}
          placeholder="e.g. admissions@aloysiuscollege.lk"
        />
      </section>
    </div>
  );
}
