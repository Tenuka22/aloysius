import type { AppRouter } from "@aloysius/api/routers/index";
import type { InferRouterOutputs } from "@orpc/server";

/**
 * Every list type the web layer uses, read off the router rather than re-listed.
 *
 * Nothing here is hand-written, and nothing here may become hand-written: each
 * name is a projection of the router's own output types at the path the client
 * actually calls, so a server-side change — a renamed column, a new sortable key
 * — surfaces as a compile error in the table rather than as a runtime
 * `undefined` on a screen that has already shipped.
 */
type RouterOutputs = InferRouterOutputs<AppRouter>;

/* ------------------------------------------------------- pending queues */

type PendingClubOutput = RouterOutputs["adminClubs"]["pendingClub"];
type PendingGlobalOutput = RouterOutputs["adminClubs"]["pendingGlobal"];

type PendingClubRow = PendingClubOutput["rows"][number];
type PendingGlobalRow = PendingGlobalOutput["rows"][number];

/**
 * One pending submission, as either queue returns it.
 *
 * The two queues have the same shape where the table reads them: a row, a
 * payload, a moment. Where they differ — `baseSnapshot` only exists on the
 * global queue, `submittedBy` only on the club queue — the review card takes
 * `null` and renders accordingly, which is why those two fields are nullable
 * here rather than the union being split in two.
 */
export interface QueueRow {
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

export const toQueueRow = (
  row: PendingClubRow | PendingGlobalRow,
  scope: "club" | "global"
): QueueRow => ({
  id: row.id,
  scope,
  target: row.target,
  operation: row.operation,
  payload: row.payload,
  baseSnapshot: "baseSnapshot" in row ? (row.baseSnapshot ?? null) : null,
  clubId: "clubId" in row ? (row.clubId ?? null) : null,
  clubName: row.clubName ?? null,
  submittedBy: row.submittedBy ?? null,
  submittedAt: row.submittedAt,
});

/* ---------------------------------------------------------- submissions */

type MySubmissionsOutput = RouterOutputs["clubs"]["listMySubmissions"];
export type SubmissionRow = MySubmissionsOutput["rows"][number];

/* ------------------------------------------------------------- accounts */

type AdminUsersListOutput = RouterOutputs["adminUsers"]["list"];
export type AccountRow = AdminUsersListOutput["rows"][number];

/* ------------------------------------------------------------ sort keys */

/** The columns a queue header may order by, as the server accepts them. */
export const QUEUE_SORT_KEYS = ["submittedAt", "target", "operation"] as const;
export type QueueSortKey = (typeof QUEUE_SORT_KEYS)[number];

/** The columns an accounts header may order by. */
export const ACCOUNT_SORT_KEYS = ["name", "username", "banned"] as const;
export type AccountSortKey = (typeof ACCOUNT_SORT_KEYS)[number];

/** The columns the club's own submissions list may order by. */
export const SUBMISSION_SORT_KEYS = ["submittedAt", "target"] as const;
export type SubmissionSortKey = (typeof SUBMISSION_SORT_KEYS)[number];
