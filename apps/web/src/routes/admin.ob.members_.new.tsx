"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { OBMemberForm } from "@/components-client/ob-member-form";

export const Route = createFileRoute("/admin/ob/members_/new")({
  component: CreateOBMemberDialog,
});

function CreateOBMemberDialog() {
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/admin/ob/members" });
      }}
    >
      <DialogContent className="w-[min(90vw,700px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Committee Member</DialogTitle>
        </DialogHeader>
        <OBMemberForm mode="create" onSuccess={() => navigate({ to: "/admin/ob/members" })} />
      </DialogContent>
    </Dialog>
  );
}
