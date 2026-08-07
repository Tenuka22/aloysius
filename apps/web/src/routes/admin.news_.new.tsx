"use client"

import { useState } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar"
import { Separator } from "@aloysius-web/ui/components/separator"
import { Button } from "@aloysius-web/ui/components/button"
import { Input } from "@aloysius-web/ui/components/input"
import { Label } from "@aloysius-web/ui/components/label"
import { Textarea } from "@aloysius-web/ui/components/textarea"
import { RichEditor } from "@/components-client/rich-editor"
import { IconArrowLeft } from "@tabler/icons-react"
import type { SerializedEditorState } from "lexical"

export const Route = createFileRoute("/admin/news/new")({
  component: CreateAnnouncement,
})

function CreateAnnouncement() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState<SerializedEditorState | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (publishNow: boolean) => {
    if (!title.trim()) {
      alert("Title is required")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/rpc/announcements.create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: JSON.stringify(content),
          excerpt: excerpt || undefined,
          publishNow,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create")
      }

      navigate({ to: "/admin/news" })
    } catch (error) {
      console.error(error)
      alert("Failed to save announcement")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/admin/news">
            <IconArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">New Announcement</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            Publish
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt (optional)</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary for previews"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <RichEditor
              onChange={(state) => setContent(state)}
              className="rounded-lg border"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
