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

type LinkedKind = "news" | "event" | "achievement";

const LINK_KIND_OPTIONS = [
  { label: "None", value: "" },
  { label: "News post", value: "news" },
  { label: "Event", value: "event" },
  { label: "Achievement", value: "achievement" },
];

const EMPTY_LABEL_BY_KIND: Record<LinkedKind, string> = {
  news: "No news posts yet",
  event: "No events yet",
  achievement: "No achievements yet",
};

/**
 * The second select in the link picker - which specific item, once a kind is
 * picked. Shows an explicit disabled option when the source list is empty
 * rather than an empty dropdown, per the migration plan's "show something,
 * not nothing" fallback.
 */
const LinkTargetPicker = ({
  emptyLabel,
  items,
  onChange,
  value,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
  emptyLabel: string;
}) => {
  const options =
    items.length === 0
      ? [{ label: emptyLabel, value: "" }]
      : [
          { label: "Choose one…", value: "" },
          ...items.map((item) => ({ label: item.label, value: item.id })),
        ];

  return (
    <Field
      kind="select"
      label="Linked item"
      onChange={onChange}
      options={options}
      value={value}
    />
  );
};

const LinkPicker = ({
  achievements,
  events,
  newsPosts,
  onLinked,
  photo,
}: {
  photo: {
    id: string;
    linkedKind: LinkedKind | null;
    linkedNewsId: string | null;
    linkedEventId: string | null;
    linkedAchievementId: string | null;
  };
  newsPosts: { id: string; title: string }[];
  events: { id: string; title: string }[];
  achievements: { id: string; title: string }[];
  onLinked: () => void;
}) => {
  const currentLinkedId =
    photo.linkedNewsId ?? photo.linkedEventId ?? photo.linkedAchievementId;
  const [kind, setKind] = useState<string>(photo.linkedKind ?? "");
  const [linkedId, setLinkedId] = useState<string>(currentLinkedId ?? "");

  const linkMutation = useMutation(orpc.club.setPhotoLink.mutationOptions());

  const itemsByKind: Record<LinkedKind, { id: string; label: string }[]> = {
    news: newsPosts.map((item) => ({ id: item.id, label: item.title })),
    event: events.map((item) => ({ id: item.id, label: item.title })),
    achievement: achievements.map((item) => ({
      id: item.id,
      label: item.title,
    })),
  };
  const canSave =
    !linkMutation.isPending &&
    (kind === "" || linkedId !== "") &&
    (kind !== photo.linkedKind || linkedId !== (currentLinkedId ?? ""));

  const handleSave = () => {
    if (kind === "") {
      linkMutation.mutate(
        { id: photo.id, linkedId: null, linkedKind: null },
        { onSuccess: onLinked }
      );
      return;
    }
    linkMutation.mutate(
      { id: photo.id, linkedId, linkedKind: kind as LinkedKind },
      { onSuccess: onLinked }
    );
  };

  return (
    <>
      <Field
        kind="select"
        label="Related content"
        onChange={(next) => {
          setKind(next);
          setLinkedId("");
        }}
        options={LINK_KIND_OPTIONS}
        value={kind}
      />
      {kind === "" ? null : (
        <LinkTargetPicker
          emptyLabel={EMPTY_LABEL_BY_KIND[kind as LinkedKind]}
          items={itemsByKind[kind as LinkedKind]}
          onChange={setLinkedId}
          value={linkedId}
        />
      )}
      <CmsButton disabled={!canSave} onClick={handleSave} tone="quiet">
        {linkMutation.isPending ? "Saving…" : "Save link"}
      </CmsButton>
    </>
  );
};

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
    linkedKind: LinkedKind | null;
    linkedNewsId: string | null;
    linkedEventId: string | null;
    linkedAchievementId: string | null;
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

  const newsPostsQuery = useSuspenseQuery(
    orpc.cms.listNewsPosts.queryOptions()
  );
  const eventsQuery = useSuspenseQuery(orpc.cms.listEvents.queryOptions());
  const achievementsQuery = useSuspenseQuery(
    orpc.cms.listAchievements.queryOptions()
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
          <LinkPicker
            achievements={achievementsQuery.data}
            events={eventsQuery.data}
            newsPosts={newsPostsQuery.data}
            onLinked={onDecided}
            photo={photo}
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
