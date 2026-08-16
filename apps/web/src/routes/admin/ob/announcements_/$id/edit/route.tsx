"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { OBAnnouncementForm } from "@/components-client/ob-announcement-form";

export const Route = createFileRoute("/admin/ob/announcements_/$id/edit")({
  component: EditOBAnnouncementDialog,
});

function EditOBAnnouncementDialog() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/admin/ob/announcements" });
      }}
    >
      <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit OB Announcement</DialogTitle>
        </DialogHeader>
        <OBAnnouncementForm
          mode="edit"
          id={id}
          onSuccess={() => navigate({ to: "/admin/ob/announcements" })}
        />
      </DialogContent>
    </Dialog>
  );
}
