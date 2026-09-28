import {
  CmsButton,
  EmptyState,
  Notice,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { describeTarget, titleFromPayload } from "@/components/club/format";
import { ClubPage, ClubPageLoading } from "@/components/club/page-parts";
import { orpc } from "@/utils/orpc";

/**
 * Everything this club has sent, in one list.
 *
 * The per-section queues show one target each, which is what you want while you
 * are working on that thing. This page is the other question: "what have I sent,
 * and what happened to it?" — including the decisions, because a rejection with
 * a note is the most useful thing in the system and there is nowhere else it
 * appears.
 *
 * The API returns pending rows only, so approved and rejected history is not
 * available from the club side at all. That is a real limit and it is stated in
 * the panel rather than hidden.
 */

interface HistoryRow {
  id: string;
  scope: "club" | "global";
  target: string;
  operation: string;
  status: string;
  payload: string;
  submittedAt: Date;
  reviewNote: string | null;
}

const STATUS_TONE: Record<string, "warning" | "neutral"> = {
  pending: "warning",
};

/**
 * Which submission a withdraw button is currently working on, across two
 * mutations. A null means neither is in flight, which is what re-enables every
 * button at once.
 */
const withdrawingIdOf = (
  club: {
    isPending: boolean;
    variables?: { submissionId: string } | undefined;
  },
  global: {
    isPending: boolean;
    variables?: { submissionId: string } | undefined;
  }
) => {
  if (club.isPending) {
    return club.variables?.submissionId ?? null;
  }
  if (global.isPending) {
    return global.variables?.submissionId ?? null;
  }
  return null;
};

const SubmissionList = ({
  onWithdraw,
  rows,
  withdrawingId,
}: {
  onWithdraw: (row: HistoryRow) => void;
  rows: readonly HistoryRow[];
  withdrawingId: string | null;
}) => {
  if (rows.length === 0) {
    return (
      <EmptyState
        note="Galleries, events, achievements and notices you send will appear here until a CMS editor has looked at them."
        title="Nothing waiting for review."
      />
    );
  }

  return (
    <RecordList label="All pending submissions">
      {rows.map((row) => (
        <RecordRow
          actions={
            <>
              <Pill tone={STATUS_TONE[row.status] ?? "neutral"}>
                {row.status}
              </Pill>
              <CmsButton
                disabled={withdrawingId === row.id}
                onClick={() => {
                  onWithdraw(row);
                }}
                tone="danger"
              >
                {withdrawingId === row.id ? "Withdrawing…" : "Withdraw"}
              </CmsButton>
            </>
          }
          key={`${row.scope}-${row.id}`}
          meta={
            <>
              <span>{describeTarget(row.target)}</span>
              <span aria-hidden="true">·</span>
              <span>
                sent {new Date(row.submittedAt).toLocaleDateString("en-GB")}
              </span>
            </>
          }
          name={titleFromPayload(row.payload)}
        />
      ))}
    </RecordList>
  );
};

const SubmissionsPage = () => {
  const queryClient = useQueryClient();
  const query = useQuery(orpc.clubs.listMySubmissions.queryOptions());

  const rows: HistoryRow[] = [
    ...(query.data?.club ?? []).map((row) => ({
      ...row,
      scope: "club" as const,
    })),
    ...(query.data?.global ?? []).map((row) => ({
      ...row,
      scope: "global" as const,
    })),
  ];

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: orpc.clubs.listMySubmissions.key(),
    });
  };

  const withdraw = useMutation(
    orpc.clubs.withdrawClubSubmission.mutationOptions({ onSuccess: refresh })
  );
  const withdrawGlobal = useMutation(
    orpc.clubs.withdrawGlobalSubmission.mutationOptions({ onSuccess: refresh })
  );

  const inFlight = withdrawingIdOf(withdraw, withdrawGlobal);

  return (
    <ClubPage
      eyebrow="Club / Submissions"
      note="Everything your club has sent that has not yet been approved or rejected. Once a CMS editor has decided, the item leaves this list."
      title="My submissions"
    >
      <Panel>
        <PanelHead
          eyebrow="In review"
          note="Approved and rejected items are removed from this list. If something you sent is not here and not on the website, ask a CMS editor."
          title="Waiting for a decision"
        />

        {query.error ? (
          <Notice tone="danger">
            Your submissions could not be loaded. Reload the page to try again.
          </Notice>
        ) : null}

        {query.isPending ? (
          <ClubPageLoading what="your submissions" />
        ) : (
          <SubmissionList
            onWithdraw={(row) => {
              if (row.scope === "club") {
                withdraw.mutate({ submissionId: row.id });
                return;
              }
              withdrawGlobal.mutate({ submissionId: row.id });
            }}
            rows={rows}
            withdrawingId={inFlight}
          />
        )}
      </Panel>
    </ClubPage>
  );
};

export const Route = createFileRoute("/club/submissions")({
  head: () => ({
    meta: [
      { title: "My submissions — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SubmissionsPage,
});
