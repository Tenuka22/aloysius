"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { GalleryForm } from "@/components-client/gallery-form";

export const Route = createFileRoute("/admin/gallery_/new")({
  component: CreateGalleryDialog,
});

function CreateGalleryDialog() {
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/admin/gallery" });
      }}
    >
      <DialogContent className="w-[min(90vw,1100px)] sm:w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Gallery Album</DialogTitle>
        </DialogHeader>
        <GalleryForm mode="create" onSuccess={() => navigate({ to: "/admin/gallery" })} />
      </DialogContent>
    </Dialog>
  );
}
