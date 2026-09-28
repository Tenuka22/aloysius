import {
  CmsButton,
  EmptyState,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { titleFromPayload } from "@/components/club/format";
import { ClubPageLoading } from "@/components/club/page-parts";
import { orpc } from "@/utils/orpc";

/**
 * What this club has sent that nobody has decided on yet.
 *
 * Read from the submission queue rather than from any content table, because a
 * pending row does not exist in a content table at all — that is the entire
 * point of the review boundary. Four of the seven club screens end with this,
 * and it is the only honest answer to "did my photographs go up?".
 *
 * `scope` is carried per row because the two queues are separate tables with
 * separate withdraw endpoints, and guessing wrong would either 404 or withdraw
 * somebody else's submission.
 */

interface PendingRow {
  id: string;
  scope: "club" | "global";
  operation: string;
  payload: string;
  submittedAt: Date;
}

const OPERATION_LABEL: Record<string, string> = {
  create: "New",
  delete: "Removal",
  update: "Edit",
};

export const PendingList = ({ target }: { target: string }) => {
  const queryClient = useQueryClient();
  const query = useQuery(orpc.clubs.listMySubmissions.queryOptions());

  const rows: PendingRow[] = [
    ...(query.data?.club ?? []).map((row) => ({
      ...row,
      scope: "club" as const,
    })),
    ...(query.data?.global ?? []).map((row) => ({
      ...row,
      scope: "global" as const,
    })),
  ].filter((row) => row.target === target);

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

  if (query.isPending) {
    return <ClubPageLoading what="your submissions" />;
  }

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
      {rows.map((row) => {
        const busy =
          row.scope === "club"
            ? withdraw.isPending && withdraw.variables?.submissionId === row.id
            : withdrawGlobal.isPending &&
              withdrawGlobal.variables?.submissionId === row.id;

        return (
          <RecordRow
            actions={
              <CmsButton
                disabled={busy}
                onClick={() => {
                  if (row.scope === "club") {
                    withdraw.mutate({ submissionId: row.id });
                    return;
                  }
                  withdrawGlobal.mutate({ submissionId: row.id });
                }}
                tone="danger"
              >
                {busy ? "Withdrawing…" : "Withdraw"}
              </CmsButton>
            }
            key={`${row.scope}-${row.id}`}
            meta={
              <>
                <span>{OPERATION_LABEL[row.operation] ?? row.operation}</span>
                <span aria-hidden="true">·</span>
                <span>
                  sent {new Date(row.submittedAt).toLocaleDateString("en-GB")}
                </span>
              </>
            }
            name={titleFromPayload(row.payload)}
          />
        );
      })}
    </RecordList>
  );
};
