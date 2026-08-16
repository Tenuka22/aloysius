"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { OBAnnouncementForm } from "@/components-client/ob-announcement-form";

export const Route = createFileRoute("/ob-admin/announcements_/new")({
  component: CreateOBAnnouncementDialog,
});

function CreateOBAnnouncementDialog() {
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/ob-admin/announcements" });
      }}
    >
      <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New OB Announcement</DialogTitle>
        </DialogHeader>
        <OBAnnouncementForm
          mode="create"
          onSuccess={() => navigate({ to: "/ob-admin/announcements" })}
        />
      </DialogContent>
    </Dialog>
  );
}
