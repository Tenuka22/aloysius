"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import { Input } from "@aloysius-web/ui/components/input";
import { Textarea } from "@aloysius-web/ui/components/textarea";
import { IconPlus, IconTrash, IconCheck, IconClock, IconX } from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";
import type { EventRecord } from "@/lib/api-types";

const outcomeConfig = {
  success: {
    label: "Success",
    icon: IconCheck,
    color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  postponed: {
    label: "Postponed",
    icon: IconClock,
    color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  failed: {
    label: "Failed",
    icon: IconX,
    color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

function AddRecordDialog({
  open,
  onOpenChange,
  eventId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}) {
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState<"success" | "postponed" | "failed">("success");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const addRecord = useMutation(
    orpc.admin.events.addRecord.mutationOptions({
      onSuccess: () => {
        toast.success("Record added");
        queryClient.invalidateQueries({ queryKey: orpc.events.key() });
        onOpenChange(false);
        setOutcome("success");
        setReason("");
        setNotes("");
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Event Record</DialogTitle>
          <DialogDescription>Record the outcome of this event.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Outcome</label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="postponed">Postponed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(outcome === "failed" || outcome === "postponed") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason {outcome === "failed" ? "(required)" : ""}
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Why was the event ${outcome}?`}
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              addRecord.mutate({
                eventId,
                outcome,
                reason: reason || undefined,
                notes: notes || undefined,
              })
            }
            disabled={addRecord.isPending || (outcome === "failed" && !reason)}
          >
            {addRecord.isPending ? "Adding..." : "Add Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute("/admin/events_/$id/records")({
  component: EventRecordsPage,
});

function EventRecordsPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: event } = useQuery(orpc.events.get.queryOptions({ input: { id } }));

  const { data: records = [], isLoading } = useQuery(
    orpc.events.listRecords.queryOptions({ input: { eventId: id } }),
  );

  const deleteRecord = useMutation(
    orpc.admin.events.deleteRecord.mutationOptions({
      onSuccess: () => {
        toast.success("Record deleted");
        queryClient.invalidateQueries({ queryKey: orpc.events.key() });
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link to="/admin/events" />}>
            Events
          </Button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-semibold">{event?.title ?? "Event"}</h1>
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <IconPlus className="mr-1 size-4" />
            Add Record
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="text-muted-foreground">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <span className="text-sm">No records yet</span>
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
              <IconPlus className="mr-1 size-4" />
              Add First Record
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record: EventRecord) => {
              const config = outcomeConfig[record.outcome];
              const Icon = config.icon;
              return (
                <div key={record.id} className="flex items-start gap-4 p-4 rounded-lg border">
                  <div className={`shrink-0 p-2 rounded-full ${config.color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
                      >
                        {config.label}
                      </span>
                      <time className="text-xs text-muted-foreground">
                        {new Date(record.recordedAt).toLocaleDateString()}
                      </time>
                    </div>
                    {record.reason && (
                      <div className="text-sm mb-1">
                        <span className="font-medium">Reason:</span> {record.reason}
                      </div>
                    )}
                    {record.notes && (
                      <div className="text-sm text-muted-foreground">{record.notes}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteRecord.mutate({ id: record.id })}
                  >
                    <IconTrash className="size-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <AddRecordDialog open={addOpen} onOpenChange={setAddOpen} eventId={id} />
    </div>
  );
}
