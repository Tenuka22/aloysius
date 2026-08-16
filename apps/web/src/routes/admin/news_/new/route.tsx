"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { NewsForm } from "@/components-client/news-form";

export const Route = createFileRoute("/admin/news_/new")({
  component: CreateNewsDialog,
});

function CreateNewsDialog() {
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
          <DialogTitle>New News Article</DialogTitle>
        </DialogHeader>
        <NewsForm mode="create" onSuccess={() => navigate({ to: "/admin/news" })} />
      </DialogContent>
    </Dialog>
  );
}
