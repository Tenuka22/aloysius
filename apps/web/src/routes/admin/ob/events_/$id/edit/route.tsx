"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { OBEventForm } from "@/components-client/ob-event-form";

export const Route = createFileRoute("/admin/ob/events_/$id/edit")({
  component: EditOBEventDialog,
});

function EditOBEventDialog() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/admin/ob/events" });
      }}
    >
      <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit OB Event</DialogTitle>
        </DialogHeader>
        <OBEventForm mode="edit" id={id} onSuccess={() => navigate({ to: "/admin/ob/events" })} />
      </DialogContent>
    </Dialog>
  );
}
