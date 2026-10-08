import {
  CmsButton,
  Field,
  Panel,
  PanelHead,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { orpc } from "@/utils/orpc";

const ReviewRow = ({
  item,
  onDecided,
}: {
  item: { id: string; title: string; body: string; createdAt: string };
  onDecided: () => void;
}) => {
  const [note, setNote] = useState("");

  const reviewMutation = useMutation(
    orpc.club.reviewAnnouncement.mutationOptions({
      onSuccess: onDecided,
    })
  );

  return (
    <RecordRow
      actions={
        <>
          <Field
            kind="text"
            label="Reviewer note"
            onChange={setNote}
            value={note}
          />
          <CmsButton
            disabled={reviewMutation.isPending}
            onClick={() =>
              reviewMutation.mutate({
                id: item.id,
                status: "approved",
                reviewNote: note || undefined,
              })
            }
            tone="primary"
          >
            Approve
          </CmsButton>
          <CmsButton
            disabled={reviewMutation.isPending}
            onClick={() =>
              reviewMutation.mutate({
                id: item.id,
                status: "rejected",
                reviewNote: note || undefined,
              })
            }
            tone="danger"
          >
            Reject
          </CmsButton>
        </>
      }
      meta={`${item.body} · Submitted ${new Date(item.createdAt).toLocaleString()}`}
      name={item.title}
    />
  );
};

const ClubAnnouncementsContent = () => {
  const queryClient = useQueryClient();
  const pendingQuery = orpc.club.listPendingAnnouncements.queryOptions();
  const { data: pending } = useSuspenseQuery(pendingQuery);

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Clubs"
        heading="Club announcement review"
        note="Nothing here reaches the public notices page until it is approved."
      />
      <Panel>
        <PanelHead title="Pending announcements" />
        {pending.length === 0 ? (
          <p>Nothing waiting for review.</p>
        ) : (
          <RecordList label="Pending announcement submissions">
            {pending.map((item) => (
              <ReviewRow
                item={item}
                key={item.id}
                onDecided={() => queryClient.invalidateQueries(pendingQuery)}
              />
            ))}
          </RecordList>
        )}
      </Panel>
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/cms/club-announcements")({
  component: ClubAnnouncementsContent,
});
