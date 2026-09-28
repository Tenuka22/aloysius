import {
  CmsButton,
  EmptyState,
  Field,
  FieldGrid,
  Notice,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  describeOperation,
  describeTarget,
  titleFromPayload,
} from "@/components/club/format";
import { FieldStack } from "@/components/club/page-parts";
import {
  RawPayloadArea,
  SubmissionDiff,
} from "@/components/cms/submission-diff";
import { orpc } from "@/utils/orpc";

/**
 * The reviewer's queue.
 *
 * Everything a club submits lands here and nothing reaches the website without
 * a decision on this screen. Three things it has to do well, in order of how
 * often they are needed:
 *
 * - **See what will change.** A field-by-field diff against the live row, so
 *   approving is a judgement about three sentences rather than a read-through of
 *   escaped JSON. The snapshot needed for that was already being selected and
 *   discarded.
 * - **Say why something was rejected.** A rejection with a note is the single
 *   most useful thing this system produces, and `reject` has always accepted a
 *   note that this screen never sent.
 * - **Not approve by accident.** Approving is immediate and public, so it is
 *   separated from the payload editor and the ban controls.
 *
 * The frame and heading are the shared `ScreenWrap` / `ScreenHead`, the same
 * ones the club portal and the editor screens use. This page previously declared
 * its own smaller, non-display heading with no breadcrumb, which made the review
 * queue look like a different application from the screens either side of it.
 */

const MAX_REVIEW_NOTE = 1000;

interface QueueRow {
  id: string;
  scope: "club" | "global";
  target: string;
  operation: string;
  payload: string;
  baseSnapshot: string | null;
  clubId: string | null;
  clubName: string | null;
  submittedBy: string | null;
  submittedAt: Date;
}

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

const operationTone = (operation: string) => {
  if (operation === "create") {
    return "warning" as const;
  }
  if (operation === "delete") {
    return "danger" as const;
  }
  return "neutral" as const;
};

const SubmissionCard = ({
  onDecided,
  row,
}: {
  onDecided: (message: string) => void;
  row: QueueRow;
}) => {
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: orpc.adminClubs.pendingClub.key(),
      }),
      queryClient.invalidateQueries({
        queryKey: orpc.adminClubs.pendingGlobal.key(),
      }),
    ]);
  };

  const decide = useMutation(
    orpc.adminClubs.approve.mutationOptions({
      onSuccess: async () => {
        onDecided("Approved. It is live on the website now.");
        await refresh();
      },
    })
  );
  const reject = useMutation(
    orpc.adminClubs.reject.mutationOptions({
      onSuccess: async () => {
        onDecided("Rejected. The club can see your note.");
        await refresh();
      },
    })
  );
  const savePayload = useMutation(
    orpc.adminClubs.updatePayload.mutationOptions({
      onSuccess: async () => {
        setEditing(false);
        onDecided("Payload updated. Review it again before approving.");
        await refresh();
      },
    })
  );

  const busy = decide.isPending || reject.isPending;

  const runSave = () => {
    try {
      JSON.parse(draft);
    } catch {
      setProblem("That is not valid JSON, so it cannot be saved.");
      return;
    }
    setProblem(null);
    savePayload.mutate({
      id: row.id,
      kind: row.scope,
      payload: draft,
    });
  };

  const runReject = () => {
    const trimmed = note.trim();
    if (trimmed === "") {
      setProblem(
        "Say why. A rejection with no reason leaves the club with nothing to act on."
      );
      return;
    }
    setProblem(null);
    reject.mutate({
      id: row.id,
      kind: row.scope,
      note: trimmed,
    });
  };

  const failure = decide.error ?? reject.error ?? savePayload.error ?? null;

  return (
    <Panel accent>
      <PanelHead
        eyebrow={row.clubName ?? "Club"}
        note={
          <span>
            Sent by {row.submittedBy ?? "a club administrator"} ·{" "}
            {relativeDay(row.submittedAt)}
          </span>
        }
        title={titleFromPayload(row.payload)}
        action={
          <Pill tone={operationTone(row.operation)}>{row.operation}</Pill>
        }
      />

      <p>
        <strong>{describeTarget(row.target)}</strong> ·{" "}
        {describeOperation(row.operation)}
      </p>

      {editing ? (
        <FieldStack>
          <RawPayloadArea onChange={setDraft} value={draft} />
          {problem ? <Notice tone="danger">{problem}</Notice> : null}
          <div>
            <CmsButton
              disabled={savePayload.isPending}
              onClick={runSave}
              tone="primary"
            >
              {savePayload.isPending ? "Saving…" : "Save payload"}
            </CmsButton>
            <CmsButton
              onClick={() => {
                setEditing(false);
                setProblem(null);
              }}
              tone="quiet"
            >
              Cancel
            </CmsButton>
          </div>
        </FieldStack>
      ) : (
        <SubmissionDiff
          baseSnapshot={row.baseSnapshot}
          operation={row.operation}
          payload={row.payload}
        />
      )}

      {problem && !editing ? <Notice tone="danger">{problem}</Notice> : null}
      {failure ? (
        <Notice tone="danger">{failure.message} Nothing was changed.</Notice>
      ) : null}

      {rejecting ? (
        <FieldStack>
          <Field
            hint={`What the club should change. ${note.length} of ${MAX_REVIEW_NOTE} characters. They can see this.`}
            kind="textarea"
            label="Reason for rejecting"
            onChange={setNote}
            value={note}
            wide
          />
          <div>
            <CmsButton disabled={busy} onClick={runReject} tone="danger">
              {reject.isPending ? "Rejecting…" : "Confirm rejection"}
            </CmsButton>
            <CmsButton
              onClick={() => {
                setRejecting(false);
                setNote("");
                setProblem(null);
              }}
              tone="quiet"
            >
              Cancel
            </CmsButton>
          </div>
        </FieldStack>
      ) : (
        <div>
          <CmsButton
            disabled={busy}
            onClick={() => {
              decide.mutate({ id: row.id, kind: row.scope });
            }}
            tone="primary"
          >
            {decide.isPending ? "Approving…" : "Approve"}
          </CmsButton>
          <CmsButton
            disabled={busy}
            onClick={() => {
              setRejecting(true);
            }}
            tone="danger"
          >
            Reject
          </CmsButton>
          <CmsButton
            disabled={busy}
            onClick={() => {
              setDraft(JSON.stringify(JSON.parse(row.payload), null, 2));
              setEditing(true);
              setProblem(null);
            }}
            tone="quiet"
          >
            Edit payload
          </CmsButton>
        </div>
      )}
    </Panel>
  );
};

const ClubAdminPanel = ({
  clubId,
  clubName,
  onDecided,
}: {
  clubId: string;
  clubName: string;
  onDecided: (message: string) => void;
}) => {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: orpc.adminClubs.list.key(),
    });
  };

  const ban = useMutation(
    orpc.adminClubs.ban.mutationOptions({
      onSuccess: async () => {
        onDecided(`${clubName} administrator banned.`);
        setConfirming(false);
        await refresh();
      },
    })
  );
  const unban = useMutation(
    orpc.adminClubs.unban.mutationOptions({
      onSuccess: async () => {
        onDecided(`${clubName} administrator unbanned.`);
        setConfirming(false);
        await refresh();
      },
    })
  );

  return (
    <Panel>
      <PanelHead
        eyebrow="Club access"
        note="A banned administrator cannot submit anything. Their pending work stays here."
        title={clubName}
      />

      {confirming ? (
        <Notice tone="warning">
          Banning {clubName} stops them submitting immediately. Anything already
          pending still needs a decision, and nothing they have already sent is
          withdrawn.
        </Notice>
      ) : null}

      <div>
        {confirming ? (
          <>
            <CmsButton
              disabled={ban.isPending}
              onClick={() => {
                ban.mutate({ clubId });
              }}
              tone="danger"
            >
              {ban.isPending ? "Banning…" : "Yes, ban them"}
            </CmsButton>
            <CmsButton
              onClick={() => {
                setConfirming(false);
              }}
              tone="quiet"
            >
              Cancel
            </CmsButton>
          </>
        ) : (
          <>
            <CmsButton
              onClick={() => {
                setConfirming(true);
              }}
              tone="danger"
            >
              Ban administrator
            </CmsButton>
            {/*
             * Unban needs no confirmation: it is the direction that restores
             * access, and the reviewer's intent when they press it is never in
             * doubt.
             */}
            <CmsButton
              disabled={unban.isPending}
              onClick={() => {
                unban.mutate({ clubId });
              }}
              tone="quiet"
            >
              {unban.isPending ? "Unbanning…" : "Unban administrator"}
            </CmsButton>
          </>
        )}
      </div>
    </Panel>
  );
};

const QueueList = ({ rows }: { rows: readonly QueueRow[] }) => {
  if (rows.length === 0) {
    return (
      <EmptyState
        note="When a club sends a gallery, event, achievement or notice it will appear here."
        title="Nothing waiting for review."
      />
    );
  }

  return (
    <RecordList label="Pending submissions">
      {rows.map((row) => (
        <RecordRow
          actions={
            <Pill tone={operationTone(row.operation)}>{row.operation}</Pill>
          }
          key={`${row.scope}-${row.id}`}
          meta={
            <>
              <span>{describeTarget(row.target)}</span>
              <span aria-hidden="true">·</span>
              <span>
                {row.clubName ?? "Club content"} · sent{" "}
                {relativeDay(row.submittedAt)}
              </span>
            </>
          }
          name={titleFromPayload(row.payload)}
        />
      ))}
    </RecordList>
  );
};

const CmsClubsPage = () => {
  const [clubId, setClubId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const clubsQuery = useQuery(orpc.adminClubs.list.queryOptions());
  const pendingQuery = useQuery(
    orpc.adminClubs.pendingClub.queryOptions({
      input: { clubId: clubId || undefined },
    })
  );
  const globalQuery = useQuery(orpc.adminClubs.pendingGlobal.queryOptions());

  const rows: QueueRow[] = [
    ...(pendingQuery.data ?? []).map((row) => ({
      baseSnapshot: null,
      clubId: null,
      clubName: null,
      operation: row.operation,
      payload: row.payload,
      scope: "club" as const,
      submittedAt: row.submittedAt,
      submittedBy: null,
      target: row.target,
      id: row.id,
    })),
    ...(globalQuery.data ?? []).map((row) => ({
      baseSnapshot: row.baseSnapshot,
      clubId: row.clubId,
      clubName: row.clubName,
      operation: row.operation,
      payload: row.payload,
      scope: "global" as const,
      submittedAt: row.submittedAt,
      submittedBy: row.submittedBy,
      target: row.target,
      id: row.id,
    })),
  ].filter(
    (row) => clubId === "" || row.clubId === null || row.clubId === clubId
  );

  const clubs = clubsQuery.data ?? [];
  const selectedClub = clubs.find((club) => club.id === clubId);

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Clubs / Approvals"
        heading="Club approvals"
        note="Nothing a club sends reaches the website without a decision here. Approve it, or reject it with a reason the club can act on."
      />

      <Panel>
        <PanelHead
          eyebrow="Queue"
          note={`${rows.length} waiting. ${globalQuery.data?.length ?? 0} from all clubs, ${pendingQuery.data?.length ?? 0} from the selected one.`}
          title="Pending submissions"
        />

        <FieldGrid>
          <Field
            hint="Narrow the queue to one club."
            kind="select"
            label="Club"
            onChange={setClubId}
            options={[
              { label: "All clubs", value: "" },
              ...clubs.map((club) => ({ label: club.name, value: club.id })),
            ]}
            value={clubId}
            wide
          />
        </FieldGrid>

        {message ? <Notice tone="success">{message}</Notice> : null}

        {globalQuery.error || pendingQuery.error ? (
          <Notice tone="danger">
            The queue could not be loaded. Reload the page to try again.
          </Notice>
        ) : null}

        {globalQuery.isPending || pendingQuery.isPending ? (
          <p>Loading the queue…</p>
        ) : (
          <QueueList rows={rows} />
        )}
      </Panel>

      {selectedClub ? (
        <ClubAdminPanel
          clubId={selectedClub.id}
          clubName={selectedClub.name}
          onDecided={setMessage}
        />
      ) : null}

      {rows.map((row) => (
        <SubmissionCard
          key={`${row.scope}-${row.id}`}
          onDecided={setMessage}
          row={row}
        />
      ))}
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/cms/clubs")({
  head: () => ({
    meta: [
      { title: "Club approvals — Content Manager — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CmsClubsPage,
});
