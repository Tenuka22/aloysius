import {
  EmptyState,
  Notice,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { describeTarget, titleFromPayload } from "@/components/club/format";
import { ClubPage, ClubPageLoading } from "@/components/club/page-parts";
import { orpc } from "@/utils/orpc";

/**
 * Where a club administrator starts: what is published, and what is still
 * waiting on a reviewer.
 *
 * The pending count is the reason this page exists. Everything a club submits
 * is invisible until a CMS editor approves it, which is correct but means the
 * usual question - "did my photos go up?" - is unanswerable from the public
 * site. Answering it here is the whole job.
 */

interface PendingRow {
  id: string;
  scope: "global" | "club";
  target: string;
  operation: string;
  submittedAt: Date;
  targetId: string | null;
  payload: string;
}

const operationLabel = (operation: string) => {
  if (operation === "create") {
    return "New";
  }
  if (operation === "delete") {
    return "Removal";
  }
  return "Edit";
};

const relativeDay = (value: Date) => {
  const days = Math.round(
    (Date.now() - new Date(value).getTime()) / 86_400_000
  );
  if (days <= 0) {
    return "today";
  }
  if (days === 1) {
    return "yesterday";
  }
  return `${days} days ago`;
};

const PendingSubmissions = ({ rows }: { rows: readonly PendingRow[] }) => {
  if (rows.length === 0) {
    return (
      <EmptyState
        note="Anything you submit will appear here until a CMS editor has looked at it."
        title="Nothing waiting for review."
      />
    );
  }

  return (
    <RecordList label="Pending submissions">
      {rows.map((row) => (
        <RecordRow
          actions={<Pill tone="warning">{operationLabel(row.operation)}</Pill>}
          key={`${row.scope}-${row.id}`}
          meta={
            <>
              <span>{describeTarget(row.target)}</span>
              <span aria-hidden="true">·</span>
              <span>sent {relativeDay(row.submittedAt)}</span>
            </>
          }
          name={titleFromPayload(row.payload)}
        />
      ))}
    </RecordList>
  );
};

const OverviewPage = () => {
  const clubQuery = useQuery(orpc.clubs.myClub.queryOptions());
  const galleryQuery = useQuery(orpc.clubs.listMyGalleries.queryOptions());
  const pendingQuery = useQuery(orpc.clubs.listMySubmissions.queryOptions());

  const galleries = galleryQuery.data ?? [];
  const pending: PendingRow[] = [
    ...(pendingQuery.data?.global ?? []).map((row) => ({
      ...row,
      scope: "global" as const,
    })),
    ...(pendingQuery.data?.club ?? []).map((row) => ({
      ...row,
      scope: "club" as const,
    })),
  ];

  const imageCount = galleries.reduce(
    (total, gallery) => total + gallery.items.length,
    0
  );

  return (
    <ClubPage
      eyebrow="Club / Overview"
      note="Everything you submit is reviewed before it appears on the website. This page shows what is live and what is still waiting."
      title={clubQuery.data?.name ?? "Your club"}
    >
      <Panel accent>
        <PanelHead
          eyebrow="At a glance"
          note="Signed in as the club administrator. You can create and edit your own club's content and nothing else."
          title="Your club"
        />

        <RecordList label="Club summary">
          <RecordRow
            meta={
              <span>Everything you submit is reviewed by a CMS editor</span>
            }
            name={`${galleries.length} ${galleries.length === 1 ? "gallery" : "galleries"} published`}
          />
          <RecordRow
            meta={
              <span>
                Across {galleries.length}{" "}
                {galleries.length === 1 ? "gallery" : "galleries"}
              </span>
            }
            name={`${imageCount} ${imageCount === 1 ? "image" : "images"}`}
          />
          <RecordRow
            actions={
              <Pill tone={pending.length > 0 ? "warning" : "positive"}>
                {pending.length > 0 ? "In review" : "All clear"}
              </Pill>
            }
            meta={<span>Submitted and not yet approved or rejected</span>}
            name={`${pending.length} waiting`}
          />
        </RecordList>

        {pendingQuery.error ? (
          <Notice tone="danger">
            Your submission queue could not be loaded. Reload the page to try
            again.
          </Notice>
        ) : null}
      </Panel>
      <Panel>
        <PanelHead
          eyebrow="Waiting on review"
          note="Nothing here is public yet. A CMS editor approves or rejects each one."
          title="Pending submissions"
        />

        {pendingQuery.isPending ? (
          <ClubPageLoading what="your submissions" />
        ) : (
          <PendingSubmissions rows={pending} />
        )}
      </Panel>
      <Panel>
        <PanelHead
          eyebrow="How this works"
          note="Worth reading once. It is the whole model, and it is the same for every club."
          title="Nothing you send is published straight away"
        />
        <RecordList label="How publishing works">
          <RecordRow
            actions={<Pill tone="positive">1</Pill>}
            key="write"
            meta={
              <span>
                Write a gallery, event, achievement or notice using the pages in
                the sidebar. Nothing is live yet.
              </span>
            }
            name="You write it"
          />
          <RecordRow
            actions={<Pill tone="warning">2</Pill>}
            key="review"
            meta={
              <span>
                A CMS editor looks at it. They can approve it, reject it, or fix
                the wording themselves and approve that.
              </span>
            }
            name="A CMS editor reviews it"
          />
          <RecordRow
            actions={<Pill tone="positive">3</Pill>}
            key="live"
            meta={
              <span>
                Only then does it appear on the website. Check My submissions to
                see what is still waiting.
              </span>
            }
            name="It goes live"
          />
        </RecordList>
      </Panel>{" "}
    </ClubPage>
  );
};

export const Route = createFileRoute("/club/")({
  head: () => ({
    meta: [
      { title: "Overview — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OverviewPage,
});
