"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { PrincipalForm } from "@/components-client/principal-form";

export const Route = createFileRoute("/admin/principals_/new")({
  component: CreatePrincipalDialog,
});

function CreatePrincipalDialog() {
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/admin/principals" });
      }}
    >
      <DialogContent className="w-[min(90vw,800px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Staff Member</DialogTitle>
        </DialogHeader>
        <PrincipalForm mode="create" onSuccess={() => navigate({ to: "/admin/principals" })} />
      </DialogContent>
    </Dialog>
  );
}
