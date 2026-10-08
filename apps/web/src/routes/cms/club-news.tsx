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
  post,
  onDecided,
}: {
  post: {
    id: string;
    title: string;
    summary: string | null;
    body: string;
    category: string | null;
    createdAt: string;
  };
  onDecided: () => void;
}) => {
  const [note, setNote] = useState("");

  const reviewMutation = useMutation(
    orpc.club.reviewNewsPost.mutationOptions({
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
                id: post.id,
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
                id: post.id,
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
        post.category,
        post.summary,
        post.body,
        `Submitted ${new Date(post.createdAt).toLocaleString()}`,
      ]
        .filter(Boolean)
        .join(" · ")}
      name={post.title}
    />
  );
};

const ClubNewsContent = () => {
  const queryClient = useQueryClient();
  const pendingQuery = orpc.club.listPendingNewsPosts.queryOptions();
  const { data: pending } = useSuspenseQuery(pendingQuery);

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Clubs"
        heading="Club news review"
        note="Nothing here reaches the public news page until it is approved."
      />
      <Panel>
        <PanelHead title="Pending news posts" />
        {pending.length === 0 ? (
          <p>Nothing waiting for review.</p>
        ) : (
          <RecordList label="Pending news submissions">
            {pending.map((post) => (
              <ReviewRow
                key={post.id}
                onDecided={() => queryClient.invalidateQueries(pendingQuery)}
                post={post}
              />
            ))}
          </RecordList>
        )}
      </Panel>
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/cms/club-news")({
  component: ClubNewsContent,
});
