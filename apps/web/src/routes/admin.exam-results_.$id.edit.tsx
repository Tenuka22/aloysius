"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { ExamResultForm } from "@/components-client/exam-result-form";

export const Route = createFileRoute("/admin/exam-results_/$id/edit")({
  component: EditExamResultDialog,
});

function EditExamResultDialog() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/admin/exam-results" });
      }}
    >
      <DialogContent className="w-[min(90vw,900px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Exam Result</DialogTitle>
        </DialogHeader>
        <ExamResultForm
          mode="edit"
          id={id}
          onSuccess={() => navigate({ to: "/admin/exam-results" })}
        />
      </DialogContent>
    </Dialog>
  );
}
