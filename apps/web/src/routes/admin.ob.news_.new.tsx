"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { OBNewsForm } from "@/components-client/ob-news-form";

export const Route = createFileRoute("/admin/ob/news_/new")({
  component: CreateOBNewsDialog,
});

function CreateOBNewsDialog() {
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/admin/ob/news" });
      }}
    >
      <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New OB News Article</DialogTitle>
        </DialogHeader>
        <OBNewsForm mode="create" onSuccess={() => navigate({ to: "/admin/ob/news" })} />
      </DialogContent>
    </Dialog>
  );
}
