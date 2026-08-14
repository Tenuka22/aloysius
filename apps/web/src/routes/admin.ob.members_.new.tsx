"use client";

import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
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
  const search = useSearch({ from: "/admin/ob/members_/new" });
  const year = (search as any)?.year as string | undefined;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: year ? `/admin/ob/members/${year}` : "/admin/ob/members" });
      }}
    >
      <DialogContent className="w-[min(90vw,700px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Committee Member {year && <span className="text-muted-foreground font-normal">({year})</span>}</DialogTitle>
        </DialogHeader>
        <OBMemberForm mode="create" defaultYear={year} onSuccess={() => navigate({ to: year ? `/admin/ob/members/${year}` : "/admin/ob/members" })} />
      </DialogContent>
    </Dialog>
  );
}
