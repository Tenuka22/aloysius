"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { StudentWorkForm } from "@/components-client/student-work-form";

export const Route = createFileRoute("/admin/student-works_/new")({
  component: CreateStudentWorkDialog,
});

function CreateStudentWorkDialog() {
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/admin/student-works" });
      }}
    >
      <DialogContent className="w-[min(90vw,1100px)] sm:w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Student Work</DialogTitle>
        </DialogHeader>
        <StudentWorkForm mode="create" onSuccess={() => navigate({ to: "/admin/student-works" })} />
      </DialogContent>
    </Dialog>
  );
}
