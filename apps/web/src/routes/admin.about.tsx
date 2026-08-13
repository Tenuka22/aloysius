"use client";

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { client } from "@/utils/orpc";
import { toast } from "sonner";

const ABOUT_KEYS = [
  "about_hero_badge",
  "about_hero_title",
  "about_hero_location",
  "about_hero_motto",
  "about_mission_title",
  "about_mission_jesuit_title",
  "about_mission_jesuit_desc",
  "about_mission_saint_title",
  "about_mission_saint_desc",
  "about_history_title",
  "about_history_desc",
  "about_history_founding",
  "about_history_location",
  "about_history_nationalisation",
  "about_history_students",
  "about_crest_title",
  "about_values_title",
  "about_value1_title",
  "about_value1_desc",
  "about_value2_title",
  "about_value2_desc",
  "about_value3_title",
  "about_value3_desc",
  "about_houses_title",
  "about_houses_desc",
  "about_clubs_title",
  "about_clubs_desc",
  "about_sports_title",
  "about_sports_desc",
  "about_bigmatches_title",
  "about_bigmatches_desc",
  "about_anthem_title",
  "about_anthem_desc",
  "about_location_title",
  "about_location_address",
  "about_location_phone",
  "about_location_email",
  "about_location_website",
  "about_alumni_title",
  "about_alumni_desc",
  "about_alumni_countries",
];

const DEFAULTS: Record<string, string> = {
  about_hero_badge: "Est. 1895",
  about_hero_title: "St. Aloysius' College",
  about_hero_location: "Galle, Sri Lanka",
  about_hero_motto: '"Certa Viriliter" - Strive Manfully',
  about_mission_title: "Our Mission",
  about_mission_jesuit_title: "Jesuit Tradition",
  about_mission_jesuit_desc:
    "Founded in 1895 by Belgian Jesuit missionaries led by Bishop Joseph Van Reeth, we carry forward a 130-year tradition of forming young men of competence, conscience, and compassion.",
  about_mission_saint_title: "Named After a Saint",
  about_mission_saint_desc:
    "Named after St. Aloysius Gonzaga, the patron saint of youth, we embody the Jesuit values of academic excellence, moral integrity, and service to others.",
  about_history_title: "Our History",
  about_history_desc:
    "St. Aloysius' College was established in 1895 by Belgian Jesuit missionaries led by Bishop Joseph Van Reeth, the first bishop of Galle. The college was named after Saint Aloysius Gonzaga, the patron saint of youth. Situated on Mount Calvary, the college neighbours St. Mary's Cathedral on one side and Sacred Heart Convent on the other. For over a century, it has been a beacon of educational excellence in the Southern Province.",
  about_history_founding:
    "Established in 1895 by Belgian Jesuit missionaries under Bishop Joseph Van Reeth.",
  about_history_location: "Located on Mount Calvary, Galle, neighbouring St. Mary's Cathedral.",
  about_history_nationalisation:
    "Became a national school in 1971 with the appointment of the first Buddhist principal.",
  about_history_students:
    "Over 5,000 students from grade 1 to G.C.E. A/L, representing diverse religious groups.",
  about_crest_title: "The College Crest",
  about_values_title: "Our Values",
  about_value1_title: "Competence",
  about_value1_desc: "Academic excellence and practical skills for life",
  about_value2_title: "Conscience",
  about_value2_desc: "Moral integrity and ethical decision-making",
  about_value3_title: "Compassion",
  about_value3_desc: "Service to others and care for the community",
  about_houses_title: "College Houses",
  about_houses_desc:
    "Students represent five houses named after Jesuit Fathers who were pioneers in developing the school in its early days.",
  about_clubs_title: "Clubs & Societies",
  about_clubs_desc:
    "Over 25 clubs and societies fostering leadership, creativity, and intellectual growth.",
  about_sports_title: "Sporting Excellence",
  about_sports_desc: "Excellence across 62+ sports disciplines, from cricket to rugby.",
  about_bigmatches_title: "Big Match Encounters",
  about_bigmatches_desc: "Annual cricket encounters that define our sporting tradition.",
  about_anthem_title: "College Anthem",
  about_anthem_desc:
    "Sung with pride by generations of Aloysians, our anthem embodies the spirit and values of St. Aloysius' College.",
  about_location_title: "Find Us",
  about_location_address:
    "St. Aloysius' College\nTemplars' Road\nGalle 80000\nSouthern Province, Sri Lanka",
  about_location_phone: "011 2 333 233",
  about_location_email: "info@aloysiuscollege.lk",
  about_location_website: "aloysiuscollege.lk",
  about_alumni_title: "Old Aloysians",
  about_alumni_desc: "Our alumni network spans the globe, with branches in UK, Galle, and Colombo.",
  about_alumni_countries: "UK,Galle,Colombo",
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
        <h1 className="text-2xl font-bold">About Page Content</h1>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Hero Section</h2>
        <Field
          label="Badge"
          value={getValue("about_hero_badge")}
          onChange={(v) => setField("about_hero_badge", v)}
          placeholder="e.g. Est. 1895"
        />
        <Field
          label="Title"
          value={getValue("about_hero_title")}
          onChange={(v) => setField("about_hero_title", v)}
          placeholder="College name"
        />
        <Field
          label="Location"
          value={getValue("about_hero_location")}
          onChange={(v) => setField("about_hero_location", v)}
          placeholder="e.g. Galle, Sri Lanka"
        />
        <Field
          label="Motto"
          value={getValue("about_hero_motto")}
          onChange={(v) => setField("about_hero_motto", v)}
          placeholder="e.g. Nil Desperandum - Never Despair"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Mission Section</h2>
        <Field
          label="Section Title"
          value={getValue("about_mission_title")}
          onChange={(v) => setField("about_mission_title", v)}
          placeholder="e.g. Our Mission"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Jesuit Tradition Title"
            value={getValue("about_mission_jesuit_title")}
            onChange={(v) => setField("about_mission_jesuit_title", v)}
            placeholder="e.g. Jesuit Tradition"
          />
          <Field
            label="Named After a Saint Title"
            value={getValue("about_mission_saint_title")}
            onChange={(v) => setField("about_mission_saint_title", v)}
            placeholder="e.g. Named After a Saint"
          />
        </div>
        <Field
          label="Jesuit Tradition Description"
          value={getValue("about_mission_jesuit_desc")}
          onChange={(v) => setField("about_mission_jesuit_desc", v)}
          placeholder="Description of Jesuit tradition"
          multiline
        />
        <Field
          label="Named After a Saint Description"
          value={getValue("about_mission_saint_desc")}
          onChange={(v) => setField("about_mission_saint_desc", v)}
          placeholder="Description of saint naming"
          multiline
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">History Section</h2>
        <Field
          label="Section Title"
          value={getValue("about_history_title")}
          onChange={(v) => setField("about_history_title", v)}
          placeholder="e.g. Our History"
        />
        <Field
          label="History Description"
          value={getValue("about_history_desc")}
          onChange={(v) => setField("about_history_desc", v)}
          placeholder="Main history paragraph"
          multiline
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Founding Card Text"
            value={getValue("about_history_founding")}
            onChange={(v) => setField("about_history_founding", v)}
            placeholder="Founding info"
          />
          <Field
            label="Location Card Text"
            value={getValue("about_history_location")}
            onChange={(v) => setField("about_history_location", v)}
            placeholder="Location info"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Nationalisation Card Text"
            value={getValue("about_history_nationalisation")}
            onChange={(v) => setField("about_history_nationalisation", v)}
            placeholder="Nationalisation info"
          />
          <Field
            label="Students Card Text"
            value={getValue("about_history_students")}
            onChange={(v) => setField("about_history_students", v)}
            placeholder="Students info"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Crest Section</h2>
        <Field
          label="Section Title"
          value={getValue("about_crest_title")}
          onChange={(v) => setField("about_crest_title", v)}
          placeholder="e.g. The College Crest"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Houses Section</h2>
        <Field
          label="Section Title"
          value={getValue("about_houses_title")}
          onChange={(v) => setField("about_houses_title", v)}
          placeholder="e.g. College Houses"
        />
        <Field
          label="Section Description"
          value={getValue("about_houses_desc")}
          onChange={(v) => setField("about_houses_desc", v)}
          placeholder="Description of the house system"
          multiline
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Anthem Section</h2>
        <Field
          label="Section Title"
          value={getValue("about_anthem_title")}
          onChange={(v) => setField("about_anthem_title", v)}
          placeholder="e.g. College Anthem"
        />
        <Field
          label="Section Description"
          value={getValue("about_anthem_desc")}
          onChange={(v) => setField("about_anthem_desc", v)}
          placeholder="Description of the anthem"
          multiline
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Values Section</h2>
        <Field
          label="Section Title"
          value={getValue("about_values_title")}
          onChange={(v) => setField("about_values_title", v)}
          placeholder="e.g. Our Values"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Value 1 Title"
            value={getValue("about_value1_title")}
            onChange={(v) => setField("about_value1_title", v)}
            placeholder="e.g. Competence"
          />
          <Field
            label="Value 1 Description"
            value={getValue("about_value1_desc")}
            onChange={(v) => setField("about_value1_desc", v)}
            placeholder="Description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Value 2 Title"
            value={getValue("about_value2_title")}
            onChange={(v) => setField("about_value2_title", v)}
            placeholder="e.g. Conscience"
          />
          <Field
            label="Value 2 Description"
            value={getValue("about_value2_desc")}
            onChange={(v) => setField("about_value2_desc", v)}
            placeholder="Description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Value 3 Title"
            value={getValue("about_value3_title")}
            onChange={(v) => setField("about_value3_title", v)}
            placeholder="e.g. Compassion"
          />
          <Field
            label="Value 3 Description"
            value={getValue("about_value3_desc")}
            onChange={(v) => setField("about_value3_desc", v)}
            placeholder="Description"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Clubs & Societies</h2>
        <Field
          label="Title"
          value={getValue("about_clubs_title")}
          onChange={(v) => setField("about_clubs_title", v)}
          placeholder="e.g. Clubs & Societies"
        />
        <Field
          label="Description"
          value={getValue("about_clubs_desc")}
          onChange={(v) => setField("about_clubs_desc", v)}
          placeholder="Description text"
          multiline
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Sports</h2>
        <Field
          label="Title"
          value={getValue("about_sports_title")}
          onChange={(v) => setField("about_sports_title", v)}
          placeholder="e.g. Sporting Excellence"
        />
        <Field
          label="Description"
          value={getValue("about_sports_desc")}
          onChange={(v) => setField("about_sports_desc", v)}
          placeholder="Description text"
          multiline
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Big Matches</h2>
        <Field
          label="Title"
          value={getValue("about_bigmatches_title")}
          onChange={(v) => setField("about_bigmatches_title", v)}
          placeholder="e.g. Big Match Encounters"
        />
        <Field
          label="Description"
          value={getValue("about_bigmatches_desc")}
          onChange={(v) => setField("about_bigmatches_desc", v)}
          placeholder="Description text"
          multiline
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Location</h2>
        <Field
          label="Section Title"
          value={getValue("about_location_title")}
          onChange={(v) => setField("about_location_title", v)}
          placeholder="e.g. Find Us"
        />
        <Field
          label="Address (use new lines)"
          value={getValue("about_location_address")}
          onChange={(v) => setField("about_location_address", v)}
          placeholder="Full address"
          multiline
        />
        <div className="grid grid-cols-3 gap-4">
          <Field
            label="Phone"
            value={getValue("about_location_phone")}
            onChange={(v) => setField("about_location_phone", v)}
            placeholder="e.g. 011 2 333 233"
          />
          <Field
            label="Email"
            value={getValue("about_location_email")}
            onChange={(v) => setField("about_location_email", v)}
            placeholder="e.g. info@loysius.lk"
          />
          <Field
            label="Website"
            value={getValue("about_location_website")}
            onChange={(v) => setField("about_location_website", v)}
            placeholder="e.g. aloysiuscollege.lk"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Alumni</h2>
        <Field
          label="Title"
          value={getValue("about_alumni_title")}
          onChange={(v) => setField("about_alumni_title", v)}
          placeholder="e.g. Old Aloysians"
        />
        <Field
          label="Description"
          value={getValue("about_alumni_desc")}
          onChange={(v) => setField("about_alumni_desc", v)}
          placeholder="Description text"
          multiline
        />
        <Field
          label="Countries (comma-separated)"
          value={getValue("about_alumni_countries")}
          onChange={(v) => setField("about_alumni_countries", v)}
          placeholder="e.g. Australia,New Zealand,Qatar,United Kingdom"
        />
      </section>
    </div>
  );
}

export const Route = createFileRoute("/admin/about")({
  component: AboutEditor,
});
