"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { OBEventForm } from "@/components-client/ob-event-form";

export const Route = createFileRoute("/ob-admin/events_/new")({
  component: CreateOBEventDialog,
});

function CreateOBEventDialog() {
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/ob-admin/events" });
      }}
    >
      <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New OB Event</DialogTitle>
        </DialogHeader>
        <OBEventForm mode="create" onSuccess={() => navigate({ to: "/ob-admin/events" })} />
      </DialogContent>
    </Dialog>
  );
}
