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
  item: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startsAt: string;
    createdAt: string;
  };
  onDecided: () => void;
}) => {
  const [note, setNote] = useState("");

  const reviewMutation = useMutation(
    orpc.club.reviewEvent.mutationOptions({
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
      meta={[
        new Date(item.startsAt).toLocaleString(),
        item.location,
        item.description,
        `Submitted ${new Date(item.createdAt).toLocaleString()}`,
      ]
        .filter(Boolean)
        .join(" · ")}
      name={item.title}
    />
  );
};

const ClubEventsContent = () => {
  const queryClient = useQueryClient();
  const pendingQuery = orpc.club.listPendingEvents.queryOptions();
  const { data: pending } = useSuspenseQuery(pendingQuery);

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Clubs"
        heading="Club event review"
        note="Nothing here reaches the public events page until it is approved."
      />
      <Panel>
        <PanelHead title="Pending events" />
        {pending.length === 0 ? (
          <p>Nothing waiting for review.</p>
        ) : (
          <RecordList label="Pending event submissions">
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

export const Route = createFileRoute("/cms/club-events")({
  component: ClubEventsContent,
});
