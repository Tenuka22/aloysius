"use client";

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { client } from "@/utils/orpc";
import { toast } from "sonner";

const ADMISSIONS_KEYS = [
  "admissions_title",
  "admissions_subtitle",
  "admissions_notice_text",
  "admissions_step1_title",
  "admissions_step1_desc",
  "admissions_step2_title",
  "admissions_step2_desc",
  "admissions_step3_title",
  "admissions_step3_desc",
  "admissions_step4_title",
  "admissions_step4_desc",
  "requirement1",
  "requirement2",
  "requirement3",
  "requirement4",
  "requirement5",
  "date1_label",
  "date1_value",
  "date2_label",
  "date2_value",
  "date3_label",
  "date3_value",
  "date4_label",
  "date4_value",
  "download1_title",
  "download1_url",
  "download2_title",
  "download2_url",
  "download3_title",
  "download3_url",
  "faq1_q",
  "faq1_a",
  "faq2_q",
  "faq2_a",
  "faq3_q",
  "faq3_a",
  "faq4_q",
  "faq4_a",
  "admissions_cta_title",
  "admissions_cta_desc",
  "admissions_cta_button_text",
  "admissions_cta_button_url",
];

const DEFAULTS: Record<string, string> = {
  admissions_title: "Become an Aloysian",
  admissions_subtitle:
    "Everything a parent needs to know about joining St. Aloysius' College - process, requirements and key dates.",
  admissions_notice_text: "",
  admissions_step1_title: "Review Requirements",
  admissions_step1_desc: "Check eligibility and the documents needed before applying.",
  admissions_step2_title: "Submit Application",
  admissions_step2_desc: "Complete and hand in the official application form by the deadline.",
  admissions_step3_title: "Interview / Selection",
  admissions_step3_desc: "Shortlisted families are invited for the selection process.",
  admissions_step4_title: "Enrolment",
  admissions_step4_desc: "Successful applicants complete enrolment and join the College.",
  requirement1: "Completed official application form",
  requirement2: "Birth certificate and identity documents",
  requirement3: "Proof of residence",
  requirement4: "Previous school records where applicable",
  requirement5: "Requirements per Ministry of Education circulars",
  date1_label: "Applications open",
  date1_value: "",
  date2_label: "Application deadline",
  date2_value: "",
  date3_label: "Interviews / selection",
  date3_value: "",
  date4_label: "Term begins",
  date4_value: "",
  download1_title: "Grade 1 Application Form",
  download1_url: "#",
  download2_title: "Admission Instructions & Circular",
  download2_url: "#",
  download3_title: "Required Documents Checklist",
  download3_url: "#",
  faq1_q: "When do admissions open?",
  faq1_a: "Answer text managed by the school office.",
  faq2_q: "What grades accept new students?",
  faq2_a: "Answer text managed by the school office.",
  faq3_q: "What documents are required?",
  faq3_a: "Answer text managed by the school office.",
  faq4_q: "How are applicants selected?",
  faq4_a: "Answer text managed by the school office.",
  admissions_cta_title: "Still have questions?",
  admissions_cta_desc: "The College office is happy to help.",
  admissions_cta_button_text: "Contact the College",
  admissions_cta_button_url: "mailto:admissions@aloysiuscollege.lk",
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

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <h2 className="text-lg font-semibold border-b pb-2 mb-2">
      {title}
      {description && <p className="text-sm font-normal text-muted-foreground mt-1">{description}</p>}
    </h2>
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
        <div>
          <h1 className="text-2xl font-bold">Admissions Page Content</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize every section of the admissions page
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
          value={getValue("admissions_title")}
          onChange={(v) => setField("admissions_title", v)}
        />
        <Field
          label="Intro"
          value={getValue("admissions_subtitle")}
          onChange={(v) => setField("admissions_subtitle", v)}
          multiline
        />
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader
          title="Priority Notice"
          description="Thin banner shown below the hero. Leave empty to hide it."
        />
        <Field
          label="Notice Text"
          value={getValue("admissions_notice_text")}
          onChange={(v) => setField("admissions_notice_text", v)}
          placeholder="e.g. Grade 1 application deadline and interview dates now open"
        />
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Application Process" description="Four steps shown in order" />
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="grid grid-cols-2 gap-4">
            <Field
              label={`Step ${num} Title`}
              value={getValue(`admissions_step${num}_title`)}
              onChange={(v) => setField(`admissions_step${num}_title`, v)}
            />
            <Field
              label={`Step ${num} Description`}
              value={getValue(`admissions_step${num}_desc`)}
              onChange={(v) => setField(`admissions_step${num}_desc`, v)}
            />
          </div>
        ))}
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Requirements" description="Shown as a checklist" />
        {[1, 2, 3, 4, 5].map((num) => (
          <Field
            key={num}
            label={`Requirement ${num}`}
            value={getValue(`requirement${num}`)}
            onChange={(v) => setField(`requirement${num}`, v)}
          />
        ))}
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Key Dates" />
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="grid grid-cols-2 gap-4">
            <Field
              label={`Date ${num} Label`}
              value={getValue(`date${num}_label`)}
              onChange={(v) => setField(`date${num}_label`, v)}
            />
            <Field
              label={`Date ${num} Value`}
              value={getValue(`date${num}_value`)}
              onChange={(v) => setField(`date${num}_value`, v)}
              placeholder="e.g. 15 January 2027"
            />
          </div>
        ))}
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Downloads" description="Link to already-hosted PDF files" />
        {[1, 2, 3].map((num) => (
          <div key={num} className="grid grid-cols-2 gap-4">
            <Field
              label={`Download ${num} Title`}
              value={getValue(`download${num}_title`)}
              onChange={(v) => setField(`download${num}_title`, v)}
            />
            <Field
              label={`Download ${num} URL`}
              value={getValue(`download${num}_url`)}
              onChange={(v) => setField(`download${num}_url`, v)}
              placeholder="https://..."
            />
          </div>
        ))}
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="FAQs" />
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="space-y-2 border rounded-lg p-4">
            <Field
              label={`FAQ ${num} Question`}
              value={getValue(`faq${num}_q`)}
              onChange={(v) => setField(`faq${num}_q`, v)}
            />
            <Field
              label={`FAQ ${num} Answer`}
              value={getValue(`faq${num}_a`)}
              onChange={(v) => setField(`faq${num}_a`, v)}
              multiline
            />
          </div>
        ))}
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Contact Callout" description="Shown after the FAQs" />
        <Field
          label="Title"
          value={getValue("admissions_cta_title")}
          onChange={(v) => setField("admissions_cta_title", v)}
        />
        <Field
          label="Description"
          value={getValue("admissions_cta_desc")}
          onChange={(v) => setField("admissions_cta_desc", v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Button Text"
            value={getValue("admissions_cta_button_text")}
            onChange={(v) => setField("admissions_cta_button_text", v)}
          />
          <Field
            label="Button URL"
            value={getValue("admissions_cta_button_url")}
            onChange={(v) => setField("admissions_cta_button_url", v)}
            placeholder="e.g. mailto:admissions@aloysiuscollege.lk"
          />
        </div>
      </section>
    </div>
  );
}
