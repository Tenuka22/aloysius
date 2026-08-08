"use client"

import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@aloysius-web/ui/components/dialog"
import { EventForm } from "@/components-client/event-form"

export const Route = createFileRoute("/admin/events_/$id/edit")({
  component: EditEventDialog,
})

function EditEventDialog() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  return (
    <Dialog open onOpenChange={(open) => { if (!open) navigate({ to: "/admin/events" }) }}>
      <DialogContent className="w-[min(90vw,1100px)] sm:w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <EventForm mode="edit" id={id} onSuccess={() => navigate({ to: "/admin/events" })} />
      </DialogContent>
    </Dialog>
  )
}
