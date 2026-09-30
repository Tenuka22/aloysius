import {
  CmsButton,
  EmptyState,
  Field,
  Notice,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  describeOperation,
  describeTarget,
  operationTone,
  relativeDay,
  titleFromPayload,
} from "@/components/club/format";
import { FieldStack } from "@/components/club/page-parts";
import {
  RawPayloadArea,
  SubmissionDiff,
} from "@/components/cms/submission-diff";
import { orpc } from "@/utils/orpc";

/**
 * The reviewer's card, shared by /cms/clubs and /admin/clubs/photography-club.
 *
 * Everything a club submits reaches the website only through a decision on one
 * of these cards, so both review surfaces have to behave identically: the same
 * diff against the live row, the same payload editor, the same rejection note
 * that the club can read. Extracted rather than copied because the two queues
 * differ only in *which* submissions they list, not in what a decision means.
 */

const MAX_REVIEW_NOTE = 1000;

export interface ReviewRow {
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

export const ReviewCard = ({
  onDecided,
  row,
}: {
  onDecided: (message: string) => void;
  row: ReviewRow;
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

export const QueueList = ({ rows }: { rows: readonly ReviewRow[] }) => {
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

/**
 * Ban and unban for one club's administrator.
 *
 * Shared for the same reason as `ReviewCard`: the CMS queue and the dedicated
 * club page hand out the same power, so they must render the same controls and
 * the same confirmation. Unban needs no confirmation - it is the direction
 * that restores access, and the reviewer's intent when they press it is never
 * in doubt.
 */
export const ClubAdminPanel = ({
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
