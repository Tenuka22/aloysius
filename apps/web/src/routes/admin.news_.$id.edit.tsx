"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { NewsForm } from "@/components-client/news-form";

export const Route = createFileRoute("/admin/news_/$id/edit")({
  component: EditNewsDialog,
});

function EditNewsDialog() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/admin/news" });
      }}
    >
      <DialogContent className="w-[min(90vw,1100px)] sm:w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit News Article</DialogTitle>
        </DialogHeader>
        <NewsForm mode="edit" id={id} onSuccess={() => navigate({ to: "/admin/news" })} />
      </DialogContent>
    </Dialog>
  );
}
