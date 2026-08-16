"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { AnnouncementForm } from "@/components-client/announcement-form";

export const Route = createFileRoute("/admin/announcements_/$id/edit")({
  component: EditAnnouncementDialog,
});

function EditAnnouncementDialog() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/admin/announcements" });
      }}
    >
      <DialogContent className="w-[min(90vw,1100px)] sm:w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
        </DialogHeader>
        <AnnouncementForm
          mode="edit"
          id={id}
          onSuccess={() => navigate({ to: "/admin/announcements" })}
        />
      </DialogContent>
    </Dialog>
  );
}
