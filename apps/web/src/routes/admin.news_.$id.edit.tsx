"use client"

import { useState, useEffect } from "react"
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

export const Route = createFileRoute("/admin/news/$id/edit")({
  component: EditAnnouncement,
})

function EditAnnouncement() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState<SerializedEditorState | null>(null)
  const [initialContent, setInitialContent] = useState<SerializedEditorState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await fetch(`/api/rpc/announcements.get?id=${id}`)
        if (!response.ok) throw new Error("Not found")
        const data = await response.json()
        setTitle(data.title)
        setExcerpt(data.excerpt ?? "")
        const parsed = JSON.parse(data.content)
        setInitialContent(parsed)
        setContent(parsed)
      } catch (error) {
        console.error(error)
        alert("Failed to load announcement")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnnouncement()
  }, [id])

  const handleSave = async (publishNow: boolean) => {
    if (!title.trim()) {
      alert("Title is required")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/rpc/announcements.update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title,
          content: JSON.stringify(content),
          excerpt: excerpt || undefined,
          publishNow,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update")
      }

      navigate({ to: "/admin/news" })
    } catch (error) {
      console.error(error)
      alert("Failed to save announcement")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Edit Announcement</h1>
        </header>
        <div className="flex-1 p-6">
          <div className="mx-auto max-w-3xl animate-pulse space-y-6">
            <div className="h-10 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
            <div className="h-[300px] rounded bg-muted" />
          </div>
        </div>
      </div>
    )
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
        <h1 className="text-lg font-semibold">Edit Announcement</h1>
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
            {initialContent && (
              <RichEditor
                value={initialContent}
                onChange={(state) => setContent(state)}
                className="rounded-lg border"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
