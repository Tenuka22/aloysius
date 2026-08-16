"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { OBNewsForm } from "@/components-client/ob-news-form";

export const Route = createFileRoute("/ob-admin/news_/$id/edit")({
  component: EditOBNewsDialog,
});

function EditOBNewsDialog() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/ob-admin/news" });
      }}
    >
      <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit OB News Article</DialogTitle>
        </DialogHeader>
        <OBNewsForm mode="edit" id={id} onSuccess={() => navigate({ to: "/ob-admin/news" })} />
      </DialogContent>
    </Dialog>
  );
}
