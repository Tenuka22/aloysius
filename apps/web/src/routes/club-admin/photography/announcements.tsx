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
  approved: "Approved — live on the notices page",
  rejected: "Rejected",
};

const STATUS_TONE: Record<string, PillTone> = {
  pending: "warning",
  approved: "positive",
  rejected: "danger",
};

const AddAnnouncementDialog = ({
  onClose,
  onSubmitted,
  open,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const submitMutation = useMutation(
    orpc.club.submitAnnouncement.mutationOptions({
      onSuccess: () => {
        setTitle("");
        setBody("");
        onSubmitted();
        onClose();
      },
    })
  );

  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    !submitMutation.isPending;

  return (
    <FormDialog
      busy={submitMutation.isPending}
      description="Reviewed by the CMS team before it appears on the public notices page."
      error={mutationErrorText(
        submitMutation.error,
        "The announcement could not be submitted."
      )}
      onClose={onClose}
      onSubmit={() =>
        submitMutation.mutate({
          club: CLUB,
          title: title.trim(),
          body: body.trim(),
        })
      }
      open={open}
      submitDisabled={!canSubmit}
      submitLabel="Submit for review"
      title="New announcement"
    >
      <Field kind="text" label="Title" onChange={setTitle} value={title} />
      <Field kind="textarea" label="Body" onChange={setBody} value={body} />
    </FormDialog>
  );
};

const MyAnnouncements = ({ onAdd }: { onAdd: () => void }) => {
  const queryClient = useQueryClient();
  const myAnnouncementsQuery = orpc.club.listMyAnnouncements.queryOptions();
  const { data: announcements } = useSuspenseQuery(myAnnouncementsQuery);

  const withdrawMutation = useMutation(
    orpc.club.withdrawAnnouncement.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(myAnnouncementsQuery);
      },
    })
  );

  return (
    <Panel>
      <PanelHead
        action={
          <CmsButton onClick={onAdd} tone="primary">
            New announcement
          </CmsButton>
        }
        title="Your announcements"
      />
      {announcements.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <RecordList label="Your announcement submissions">
          {announcements.map((item) => (
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
              meta={item.reviewNote && `Reviewer note: ${item.reviewNote}`}
              name={item.title}
            />
          ))}
        </RecordList>
      )}
    </Panel>
  );
};

const AnnouncementsContent = () => {
  const queryClient = useQueryClient();
  const myAnnouncementsQuery = orpc.club.listMyAnnouncements.queryOptions();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Photography Club"
        heading="Announcements"
        note="Every announcement is reviewed by the CMS team before it appears on the public notices page."
      />
      <MyAnnouncements onAdd={() => setDialogOpen(true)} />
      <AddAnnouncementDialog
        onClose={() => setDialogOpen(false)}
        onSubmitted={() => queryClient.invalidateQueries(myAnnouncementsQuery)}
        open={dialogOpen}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/club-admin/photography/announcements")({
  component: AnnouncementsContent,
});
