"use client";

import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { OBMemberForm } from "@/components-client/ob-member-form";

export const Route = createFileRoute("/admin/ob/members_/$id/edit")({
  component: EditOBMemberDialog,
});

function EditOBMemberDialog() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const search = useSearch({ from: "/admin/ob/members_/$id/edit" });
  const returnTo = (search as any)?.returnTo as string | undefined;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: returnTo || "/admin/ob/members" });
      }}
    >
      <DialogContent className="w-[min(90vw,700px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Committee Member</DialogTitle>
        </DialogHeader>
        <OBMemberForm
          mode="edit"
          id={id}
          onSuccess={() => navigate({ to: returnTo || "/admin/ob/members" })}
        />
      </DialogContent>
    </Dialog>
  );
}
