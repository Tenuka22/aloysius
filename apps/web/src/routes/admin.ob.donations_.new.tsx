"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { OBDonationForm } from "@/components-client/ob-donation-form";

export const Route = createFileRoute("/admin/ob/donations_/new")({
  component: CreateOBDonationDialog,
});

function CreateOBDonationDialog() {
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/admin/ob/donations" });
      }}
    >
      <DialogContent className="w-[min(90vw,700px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Donation</DialogTitle>
        </DialogHeader>
        <OBDonationForm mode="create" onSuccess={() => navigate({ to: "/admin/ob/donations" })} />
      </DialogContent>
    </Dialog>
  );
}
