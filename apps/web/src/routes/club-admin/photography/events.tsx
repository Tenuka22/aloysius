import {
  CmsButton,
  Field,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import type { PillTone } from "@aloysius/ui/components/cms/cms-primitives";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import { FormDialog } from "@aloysius/ui/components/dialog";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { mutationErrorText } from "@/components/mutation-error";
import { orpc } from "@/utils/orpc";

const CLUB = "photography" as const;

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved — live on the events page",
  rejected: "Rejected",
};

const STATUS_TONE: Record<string, PillTone> = {
  pending: "warning",
  approved: "positive",
  rejected: "danger",
};

/** `<input type="datetime-local">` has no timezone of its own — the browser
 * reports it in local time with no offset, so this reads it as local and
 * lets `Date` attach the zone. */
const toIso = (localValue: string): string | null => {
  if (!localValue) {
    return null;
  }
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const AddEventDialog = ({
  onClose,
  onSubmitted,
  open,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");

  const submitMutation = useMutation(
    orpc.club.submitEvent.mutationOptions({
      onSuccess: () => {
        setTitle("");
        setDescription("");
        setLocation("");
        setStartsAt("");
        onSubmitted();
        onClose();
      },
    })
  );

  const startsAtIso = toIso(startsAt);
  const canSubmit =
    title.trim().length > 0 &&
    startsAtIso !== null &&
    !submitMutation.isPending;

  const handleSubmit = () => {
    if (!startsAtIso) {
      return;
    }
    submitMutation.mutate({
      club: CLUB,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startsAt: startsAtIso,
    });
  };

  return (
    <FormDialog
      busy={submitMutation.isPending}
      description="Reviewed by the CMS team before it appears on the public events page."
      error={mutationErrorText(
        submitMutation.error,
        "The event could not be submitted."
      )}
      onClose={onClose}
      onSubmit={handleSubmit}
      open={open}
      submitDisabled={!canSubmit}
      submitLabel="Submit for review"
      title="New event"
    >
      <Field kind="text" label="Title" onChange={setTitle} value={title} />
      <Field
        kind="datetime"
        label="Starts at"
        onChange={setStartsAt}
        value={startsAt}
      />
      <Field
        kind="text"
        label="Location (optional)"
        onChange={setLocation}
        value={location}
      />
      <Field
        kind="textarea"
        label="Description (optional)"
        onChange={setDescription}
        value={description}
      />
    </FormDialog>
  );
};

const MyEvents = ({ onAdd }: { onAdd: () => void }) => {
  const queryClient = useQueryClient();
  const myEventsQuery = orpc.club.listMyEvents.queryOptions();
  const { data: events } = useSuspenseQuery(myEventsQuery);

  const withdrawMutation = useMutation(
    orpc.club.withdrawEvent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(myEventsQuery);
      },
    })
  );

  return (
    <Panel>
      <PanelHead
        action={
          <CmsButton onClick={onAdd} tone="primary">
            New event
          </CmsButton>
        }
        title="Your events"
      />
      {events.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <RecordList label="Your event submissions">
          {events.map((item) => (
            <RecordRow
              actions={
                <>
                  <Pill tone={STATUS_TONE[item.status] ?? "neutral"}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </Pill>
                  {item.status === "pending" && (
                    <CmsButton
                      onClick={() => withdrawMutation.mutate({ id: item.id })}
                      tone="danger"
                    >
                      Withdraw
                    </CmsButton>
                  )}
                </>
              }
              key={item.id}
              meta={[
                new Date(item.startsAt).toLocaleString(),
                item.location,
                item.reviewNote && `Reviewer note: ${item.reviewNote}`,
              ]
                .filter(Boolean)
                .join(" · ")}
              name={item.title}
            />
          ))}
        </RecordList>
      )}
    </Panel>
  );
};

const EventsContent = () => {
  const queryClient = useQueryClient();
  const myEventsQuery = orpc.club.listMyEvents.queryOptions();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Photography Club"
        heading="Events"
        note="Every event is reviewed by the CMS team before it appears on the public events page."
      />
      <MyEvents onAdd={() => setDialogOpen(true)} />
      <AddEventDialog
        onClose={() => setDialogOpen(false)}
        onSubmitted={() => queryClient.invalidateQueries(myEventsQuery)}
        open={dialogOpen}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/club-admin/photography/events")({
  component: EventsContent,
});
