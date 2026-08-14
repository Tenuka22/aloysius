"use client";

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { client } from "@/utils/orpc";
import { toast } from "sonner";

const CONTACT_KEYS = [
  "contact_page_title",
  "address",
  "contact_phone",
  "contact_email",
  "office_hours",
  "contact_form_note",
];

const DEFAULTS: Record<string, string> = {
  contact_page_title: "Contact the College",
  address: "St. Aloysius' College\nTemplars' Road\nGalle 80000\nSouthern Province, Sri Lanka",
  contact_phone: "091 2 333 233",
  contact_email: "info@aloysiuscollege.lk",
  office_hours: "Monday - Friday, 7:30am - 2:30pm",
  contact_form_note: "Enquiries are directed to the College office.",
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
          rows={4}
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

export const Route = createFileRoute("/admin/contact")({
  component: AdminContact,
});

function AdminContact() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "contact"],
    queryFn: () => client.settings.getAll(),
  });

  const mutation = useMutation({
    mutationFn: (items: { key: string; value: string }[]) => client.settings.setMany({ items }),
    onSuccess: () => {
      toast.success("Contact info updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const getValue = (key: string) => form[key] ?? settings?.[key] ?? DEFAULTS[key] ?? "";

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const items = CONTACT_KEYS.map((key) => ({
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
          <h1 className="text-2xl font-bold">Contact & Office Info</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Shared across the Contact page and site footer
          </p>
        </div>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Contact Page Hero" />
        <Field
          label="Title"
          value={getValue("contact_page_title")}
          onChange={(v) => setField("contact_page_title", v)}
        />
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="College Office" description="Used on the Contact page and in the site footer" />
        <Field
          label="Address"
          value={getValue("address")}
          onChange={(v) => setField("address", v)}
          description="Use new lines to break onto separate lines"
          multiline
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Telephone"
            value={getValue("contact_phone")}
            onChange={(v) => setField("contact_phone", v)}
          />
          <Field
            label="Email"
            value={getValue("contact_email")}
            onChange={(v) => setField("contact_email", v)}
          />
        </div>
        <Field
          label="Office Hours"
          value={getValue("office_hours")}
          onChange={(v) => setField("office_hours", v)}
        />
      </section>

      <section className="border bg-card p-6 space-y-4">
        <SectionHeader title="Contact Form" />
        <Field
          label="Note below the form title"
          value={getValue("contact_form_note")}
          onChange={(v) => setField("contact_form_note", v)}
        />
        <p className="text-xs text-muted-foreground">
          Messages are sent via the visitor's own email client, addressed to the Email above
        </p>
      </section>
    </div>
  );
}
