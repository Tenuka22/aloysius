/**
 * Reading the admin audit trail.
 *
 * The trail is written by the API as `verb_target` / `verb_status` slugs
 * (`ban_club_admin`, `unban_club_admin`, `rotate_password`, and one
 * `operation_status` pair per content submission). Two admin pages render that
 * feed, so the wording lives here rather than being re-derived - otherwise the
 * same action reads one way on the overview and another way in the detail.
 */

export interface AuditEntry {
  id: string;
  actorUsername: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  createdAt: Date;
}

export type AuditOutcomeTone = "warning" | "positive" | "danger";

/*
 * A fixed locale, deliberately. `toLocaleString()` with no locale renders the
 * server's format during SSR and the browser's on hydration, and a timestamp
 * that changes shape between the two is a hydration mismatch.
 */
const AUDIT_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatAuditTime = (value: Date | string) =>
  AUDIT_TIME.format(new Date(value));

const ACTIVITY_LABEL: Record<string, string> = {
  ban_club_admin: "Club administrator banned",
  unban_club_admin: "Club administrator unbanned",
  rotate_password: "Password rotated",
};

const SUBMISSION_STATUS: Record<string, string> = {
  pending: "awaiting review",
  approved: "approved",
  rejected: "rejected",
};

/** The action as a sentence: "Password rotated", "Update awaiting review". */
export const describeActivity = (action: string) => {
  const known = ACTIVITY_LABEL[action];
  if (known) {
    return known;
  }
  const [operation = "", status] = action.split("_");
  const verb = `${operation.slice(0, 1).toUpperCase()}${operation.slice(1)}`;
  return status ? `${verb} ${SUBMISSION_STATUS[status] ?? status}` : verb;
};

/**
 * The review outcome of a content submission, or `null` for the credential
 * actions - "still waiting" and "signed off" are the two things a reviewer
 * scans the feed for, so only submissions carry a chip.
 */
export const submissionOutcome = (
  action: string
): { tone: AuditOutcomeTone; label: string } | null => {
  const [, status] = action.split("_");
  const label = status ? SUBMISSION_STATUS[status] : undefined;
  if (!label) {
    return null;
  }
  if (status === "approved") {
    return { tone: "positive", label: "Approved" };
  }
  if (status === "rejected") {
    return { tone: "danger", label: "Rejected" };
  }
  return { tone: "warning", label: "Awaiting review" };
};

/** Who acted, and on what. */
export const describeAuditTarget = (entry: AuditEntry) => (
  <>
    <span>{entry.actorUsername ? `@${entry.actorUsername}` : "System"}</span>
    <span aria-hidden="true">·</span>
    <span>
      {entry.targetType.replaceAll("_", " ")}
      {entry.targetId ? ` · ${entry.targetId}` : ""}
    </span>
  </>
);
