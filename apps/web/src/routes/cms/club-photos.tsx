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
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { resolveFileUrls } from "@/components/club/upload";
import { orpc } from "@/utils/orpc";

const ReviewRow = ({
  photo,
  photoUrl,
  onDecided,
}: {
  photo: {
    id: string;
    fileId: string;
    caption: string;
    altText: string;
    submittedAt: string;
  };
  photoUrl: string | undefined;
  onDecided: () => void;
}) => {
  const [note, setNote] = useState("");

  const reviewMutation = useMutation(
    orpc.club.reviewPhoto.mutationOptions({
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
                id: photo.id,
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
                id: photo.id,
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
      meta={`Submitted ${new Date(photo.submittedAt).toLocaleString()}`}
      name={
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            alt={photo.altText}
            height={48}
            src={photoUrl}
            style={{ borderRadius: 4, objectFit: "cover" }}
            width={48}
          />
          {photo.caption}
        </span>
      }
    />
  );
};

const ClubPhotosContent = () => {
  const queryClient = useQueryClient();
  const pendingQuery = orpc.club.listPendingPhotos.queryOptions();
  const { data: pending } = useSuspenseQuery(pendingQuery);

  const fileIds = pending.map((photo) => photo.fileId);
  const fileUrlsQuery = useQuery({
    queryKey: ["club-photo-review-file-urls", fileIds],
    queryFn: () => resolveFileUrls(fileIds),
    enabled: fileIds.length > 0,
    staleTime: Infinity,
  });
  const fileUrls = fileUrlsQuery.data ?? {};

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Clubs"
        heading="Club photo review"
        note="Nothing here reaches the public gallery until it is approved."
      />
      <Panel>
        <PanelHead title="Pending photos" />
        {pending.length === 0 ? (
          <p>Nothing waiting for review.</p>
        ) : (
          <RecordList label="Pending photo submissions">
            {pending.map((photo) => (
              <ReviewRow
                key={photo.id}
                onDecided={() => queryClient.invalidateQueries(pendingQuery)}
                photo={photo}
                photoUrl={fileUrls[photo.fileId]}
              />
            ))}
          </RecordList>
        )}
      </Panel>
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/cms/club-photos")({
  component: ClubPhotosContent,
});
