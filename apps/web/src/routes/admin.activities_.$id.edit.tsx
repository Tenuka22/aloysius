"use client"

import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@aloysius-web/ui/components/dialog"
import { ActivitiesForm } from "@/components-client/activities-form"

export const Route = createFileRoute("/admin/activities_/$id/edit")({
  component: EditActivityDialog,
})

function EditActivityDialog() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  return (
    <Dialog open onOpenChange={(open) => { if (!open) navigate({ to: "/admin/activities" }) }}>
      <DialogContent className="w-[min(90vw,1100px)] sm:w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>
        <ActivitiesForm mode="edit" id={id} onSuccess={() => navigate({ to: "/admin/activities" })} />
      </DialogContent>
    </Dialog>
  )
}
