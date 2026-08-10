"use client"

import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@aloysius-web/ui/components/button"
import { client } from "@/utils/orpc"
import { toast } from "sonner"

const HOMEPAGE_KEYS = [
  "hero_title",
  "hero_badge",
  "hero_subtitle",
  "hero_cta1_text",
  "hero_cta1_url",
  "hero_cta2_text",
  "hero_cta2_url",
  "cta_title",
  "cta_subtitle",
  "cta_button_text",
  "cta_button_url",
]

const DEFAULTS: Record<string, string> = {
  hero_title: "A place to shape\ncharacter. A stage to\nshowcase greatness.",
  hero_badge: "#AloysiusPride",
  hero_subtitle: "At Aloysius College, students don\u2019t just learn \u2014 they create, explore, and inspire. Discover the talent, innovation, and spirit of our students.",
  hero_cta1_text: "Explore Student Works",
  hero_cta1_url: "/student-works",
  hero_cta2_text: "About Our College",
  hero_cta2_url: "#",
  cta_title: "Be part of a legacy.\nBuild your future.",
  cta_subtitle: "Join a community where values meet vision, and every student shines.",
  cta_button_text: "Apply Now",
  cta_button_url: "#",
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

function HomepageEditor() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Record<string, string>>({})

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "homepage"],
    queryFn: () => client.settings.getAll(),
  })

  const mutation = useMutation({
    mutationFn: (items: { key: string; value: string }[]) => client.settings.setMany({ items }),
    onSuccess: () => {
      toast.success("Homepage updated")
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    },
    onError: (err) => toast.error(err.message),
  })

  const getValue = (key: string) => form[key] ?? settings?.[key] ?? DEFAULTS[key] ?? ""

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    const items = HOMEPAGE_KEYS.map((key) => ({
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
    <div className="space-y-8 p-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Homepage Content</h1>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Hero Section</h2>
        <Field label="Title" value={getValue("hero_title")} onChange={(v) => setField("hero_title", v)} placeholder="Main heading (use new lines for line breaks)" multiline />
        <Field label="Badge" value={getValue("hero_badge")} onChange={(v) => setField("hero_badge", v)} placeholder="e.g. #AloysiusPride" />
        <Field label="Subtitle" value={getValue("hero_subtitle")} onChange={(v) => setField("hero_subtitle", v)} placeholder="Description text" multiline />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Primary Button Text" value={getValue("hero_cta1_text")} onChange={(v) => setField("hero_cta1_text", v)} placeholder="e.g. Explore Student Works" />
          <Field label="Primary Button URL" value={getValue("hero_cta1_url")} onChange={(v) => setField("hero_cta1_url", v)} placeholder="e.g. /student-works" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Secondary Button Text" value={getValue("hero_cta2_text")} onChange={(v) => setField("hero_cta2_text", v)} placeholder="e.g. About Our College" />
          <Field label="Secondary Button URL" value={getValue("hero_cta2_url")} onChange={(v) => setField("hero_cta2_url", v)} placeholder="e.g. /about" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">CTA Banner</h2>
        <Field label="Title" value={getValue("cta_title")} onChange={(v) => setField("cta_title", v)} placeholder="Banner heading" multiline />
        <Field label="Subtitle" value={getValue("cta_subtitle")} onChange={(v) => setField("cta_subtitle", v)} placeholder="Banner description" multiline />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Button Text" value={getValue("cta_button_text")} onChange={(v) => setField("cta_button_text", v)} placeholder="e.g. Apply Now" />
          <Field label="Button URL" value={getValue("cta_button_url")} onChange={(v) => setField("cta_button_url", v)} placeholder="e.g. /apply" />
        </div>
      </section>
    </div>
  )
}

export const Route = createFileRoute("/admin/homepage")({
  component: HomepageEditor,
})
