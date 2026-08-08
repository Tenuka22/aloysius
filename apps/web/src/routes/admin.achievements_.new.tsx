"use client"

import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@aloysius-web/ui/components/dialog"
import { AchievementForm } from "@/components-client/achievement-form"

export const Route = createFileRoute("/admin/achievements_/new")({
  component: CreateAchievementDialog,
})

function CreateAchievementDialog() {
  const navigate = useNavigate()

  return (
    <Dialog open onOpenChange={(open) => { if (!open) navigate({ to: "/admin/achievements" }) }}>
      <DialogContent className="w-[min(90vw,1100px)] sm:w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Achievement</DialogTitle>
        </DialogHeader>
        <AchievementForm mode="create" onSuccess={() => navigate({ to: "/admin/achievements" })} />
      </DialogContent>
    </Dialog>
  )
}
