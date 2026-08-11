"use client"

import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@aloysius-web/ui/components/button"
import { client } from "@/utils/orpc"
import { toast } from "sonner"

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
  "about_values_title",
  "about_value1_title",
  "about_value1_desc",
  "about_value2_title",
  "about_value2_desc",
  "about_value3_title",
  "about_value3_desc",
  "about_clubs_title",
  "about_clubs_desc",
  "about_sports_title",
  "about_sports_desc",
  "about_bigmatches_title",
  "about_location_title",
  "about_location_address",
  "about_location_phone",
  "about_location_email",
  "about_location_website",
  "about_alumni_title",
  "about_alumni_desc",
  "about_alumni_countries",
]

const DEFAULTS: Record<string, string> = {
  about_hero_badge: "Est. 1895",
  about_hero_title: "St. Aloysius' College",
  about_hero_location: "Galle, Sri Lanka",
  about_hero_motto: "\"Nil Desperandum\" — Never Despair",
  about_mission_title: "Our Mission",
  about_mission_jesuit_title: "Jesuit Tradition",
  about_mission_jesuit_desc: "Founded in 1895 by Belgian Jesuit missionaries led by Bishop Joseph Van Reeth, we carry forward a 130-year tradition of forming young men of competence, conscience, and compassion.",
  about_mission_saint_title: "Named After a Saint",
  about_mission_saint_desc: "Named after St. Aloysius Gonzaga, the patron saint of youth, we embody the Jesuit values of academic excellence, moral integrity, and service to others.",
  about_values_title: "Our Values",
  about_value1_title: "Competence",
  about_value1_desc: "Academic excellence and practical skills for life",
  about_value2_title: "Conscience",
  about_value2_desc: "Moral integrity and ethical decision-making",
  about_value3_title: "Compassion",
  about_value3_desc: "Service to others and care for the community",
  about_clubs_title: "Clubs & Societies",
  about_clubs_desc: "Over 25 clubs and societies fostering leadership, creativity, and intellectual growth.",
  about_sports_title: "Sporting Excellence",
  about_sports_desc: "Excellence across 62+ sports disciplines, from cricket to rugby.",
  about_bigmatches_title: "Big Match Encounters",
  about_location_title: "Find Us",
  about_location_address: "St. Aloysius' College\nTemplars' Road\nGalle 80000\nSouthern Province, Sri Lanka",
  about_location_phone: "011 2 333 233",
  about_location_email: "info@loysius.lk",
  about_location_website: "aloysiuscollege.lk",
  about_alumni_title: "Old Aloysians",
  about_alumni_desc: "Our alumni network spans the globe, with branches in Australia, New Zealand, Qatar, and the United Kingdom.",
  about_alumni_countries: "Australia,New Zealand,Qatar,United Kingdom",
}

function Field({ label, value, onChange, placeholder, multiline }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
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
  )
}

function AboutEditor() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Record<string, string>>({})

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "about"],
    queryFn: () => client.settings.getAll(),
  })

  const mutation = useMutation({
    mutationFn: (items: { key: string; value: string }[]) => client.settings.setMany({ items }),
    onSuccess: () => {
      toast.success("About page updated")
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    },
    onError: (err) => toast.error(err.message),
  })

  const getValue = (key: string) => form[key] ?? settings?.[key] ?? DEFAULTS[key] ?? ""

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    const items = ABOUT_KEYS.map((key) => ({
      key,
      value: getValue(key),
    }))
    mutation.mutate(items)
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded bg-muted animate-pulse" />
      </div>
    )
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
        <Field label="Badge" value={getValue("about_hero_badge")} onChange={(v) => setField("about_hero_badge", v)} placeholder="e.g. Est. 1895" />
        <Field label="Title" value={getValue("about_hero_title")} onChange={(v) => setField("about_hero_title", v)} placeholder="College name" />
        <Field label="Location" value={getValue("about_hero_location")} onChange={(v) => setField("about_hero_location", v)} placeholder="e.g. Galle, Sri Lanka" />
        <Field label="Motto" value={getValue("about_hero_motto")} onChange={(v) => setField("about_hero_motto", v)} placeholder="e.g. Nil Desperandum — Never Despair" />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Mission Section</h2>
        <Field label="Section Title" value={getValue("about_mission_title")} onChange={(v) => setField("about_mission_title", v)} placeholder="e.g. Our Mission" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Jesuit Tradition Title" value={getValue("about_mission_jesuit_title")} onChange={(v) => setField("about_mission_jesuit_title", v)} placeholder="e.g. Jesuit Tradition" />
          <Field label="Named After a Saint Title" value={getValue("about_mission_saint_title")} onChange={(v) => setField("about_mission_saint_title", v)} placeholder="e.g. Named After a Saint" />
        </div>
        <Field label="Jesuit Tradition Description" value={getValue("about_mission_jesuit_desc")} onChange={(v) => setField("about_mission_jesuit_desc", v)} placeholder="Description of Jesuit tradition" multiline />
        <Field label="Named After a Saint Description" value={getValue("about_mission_saint_desc")} onChange={(v) => setField("about_mission_saint_desc", v)} placeholder="Description of saint naming" multiline />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Values Section</h2>
        <Field label="Section Title" value={getValue("about_values_title")} onChange={(v) => setField("about_values_title", v)} placeholder="e.g. Our Values" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Value 1 Title" value={getValue("about_value1_title")} onChange={(v) => setField("about_value1_title", v)} placeholder="e.g. Competence" />
          <Field label="Value 1 Description" value={getValue("about_value1_desc")} onChange={(v) => setField("about_value1_desc", v)} placeholder="Description" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Value 2 Title" value={getValue("about_value2_title")} onChange={(v) => setField("about_value2_title", v)} placeholder="e.g. Conscience" />
          <Field label="Value 2 Description" value={getValue("about_value2_desc")} onChange={(v) => setField("about_value2_desc", v)} placeholder="Description" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Value 3 Title" value={getValue("about_value3_title")} onChange={(v) => setField("about_value3_title", v)} placeholder="e.g. Compassion" />
          <Field label="Value 3 Description" value={getValue("about_value3_desc")} onChange={(v) => setField("about_value3_desc", v)} placeholder="Description" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Clubs & Societies</h2>
        <Field label="Title" value={getValue("about_clubs_title")} onChange={(v) => setField("about_clubs_title", v)} placeholder="e.g. Clubs & Societies" />
        <Field label="Description" value={getValue("about_clubs_desc")} onChange={(v) => setField("about_clubs_desc", v)} placeholder="Description text" multiline />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Sports</h2>
        <Field label="Title" value={getValue("about_sports_title")} onChange={(v) => setField("about_sports_title", v)} placeholder="e.g. Sporting Excellence" />
        <Field label="Description" value={getValue("about_sports_desc")} onChange={(v) => setField("about_sports_desc", v)} placeholder="Description text" multiline />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Big Matches</h2>
        <Field label="Title" value={getValue("about_bigmatches_title")} onChange={(v) => setField("about_bigmatches_title", v)} placeholder="e.g. Big Match Encounters" />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Location</h2>
        <Field label="Section Title" value={getValue("about_location_title")} onChange={(v) => setField("about_location_title", v)} placeholder="e.g. Find Us" />
        <Field label="Address (use new lines)" value={getValue("about_location_address")} onChange={(v) => setField("about_location_address", v)} placeholder="Full address" multiline />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Phone" value={getValue("about_location_phone")} onChange={(v) => setField("about_location_phone", v)} placeholder="e.g. 011 2 333 233" />
          <Field label="Email" value={getValue("about_location_email")} onChange={(v) => setField("about_location_email", v)} placeholder="e.g. info@loysius.lk" />
          <Field label="Website" value={getValue("about_location_website")} onChange={(v) => setField("about_location_website", v)} placeholder="e.g. aloysiuscollege.lk" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Alumni</h2>
        <Field label="Title" value={getValue("about_alumni_title")} onChange={(v) => setField("about_alumni_title", v)} placeholder="e.g. Old Aloysians" />
        <Field label="Description" value={getValue("about_alumni_desc")} onChange={(v) => setField("about_alumni_desc", v)} placeholder="Description text" multiline />
        <Field label="Countries (comma-separated)" value={getValue("about_alumni_countries")} onChange={(v) => setField("about_alumni_countries", v)} placeholder="e.g. Australia,New Zealand,Qatar,United Kingdom" />
      </section>
    </div>
  )
}

export const Route = createFileRoute("/admin/about")({
  component: AboutEditor,
})
