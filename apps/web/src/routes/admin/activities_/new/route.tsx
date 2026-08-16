"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { ActivitiesForm } from "@/components-client/activities-form";

export const Route = createFileRoute("/admin/activities_/new")({
  component: CreateActivityDialog,
});

function CreateActivityDialog() {
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/admin/activities" });
      }}
    >
      <DialogContent className="w-[min(90vw,1100px)] sm:w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Activity</DialogTitle>
        </DialogHeader>
        <ActivitiesForm mode="create" onSuccess={() => navigate({ to: "/admin/activities" })} />
      </DialogContent>
    </Dialog>
  );
}
