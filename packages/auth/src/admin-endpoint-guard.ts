import type { Database } from "@aloysius/db";
import {
  accountAuditLog,
  session as sessionTable,
  user as userTable,
} from "@aloysius/db/schema/auth";
import { APIError, getSessionFromCtx } from "better-auth/api";
import { eq } from "drizzle-orm";

import { isPrivilegedRole, isSeededAccount } from "./permissions";

/**
 * Target validation and an audit trail for better-auth's admin plugin.
 *
 * The plugin authorizes on the **caller's** role statements alone: whoever
 * holds `user:ban` may ban anyone. Narrowing the statements only answers
 * "which endpoints may run". This answers "against whom":
 *
 * - a verb no role in this app is granted is refused outright, whoever asks,
 *   so a future widening of a role statement cannot silently reopen it;
 * - an account holding a privileged role, or the seeded club seat, may be
 *   acted on only by `admin` — never by a peer seat, who could otherwise ban
 *   another club's administrator or sign the top administrator out of every
 *   device.
 *
 * Every call that reaches a decision is written to `account_audit_log`.
 */

type MiddlewareContext = Parameters<typeof getSessionFromCtx>[0];

const ADMIN_PATH_PREFIX = "/admin/";

/** Plugin verbs this app never grants to any role. */
const UNGRANTED_PATHS: Record<string, true> = {
  "/admin/create-user": true,
  "/admin/set-user-password": true,
  "/admin/remove-user": true,
  "/admin/impersonate-user": true,
  "/admin/set-role": true,
  "/admin/update-user": true,
};

/** What may never be done to the seeded club seat, by anyone. */
const SEAT_LOCKED_PATHS: Record<string, true> = {
  "/admin/ban-user": true,
  "/admin/set-role": true,
  "/admin/update-user": true,
  "/admin/remove-user": true,
  "/admin/set-user-password": true,
  "/admin/impersonate-user": true,
};

/** Reads with no single target; nothing to validate and nothing to record. */
const READ_ONLY_PATHS: Record<string, true> = {
  "/admin/list-users": true,
  "/admin/get-user": true,
  "/admin/list-user-sessions": true,
  "/admin/has-permission": true,
  "/admin/stop-impersonating": true,
};

const bodyField = (ctx: MiddlewareContext, field: string): string | null => {
  const { body } = ctx as { body?: unknown };
  if (body && typeof body === "object") {
    const value = (body as Record<string, unknown>)[field];
    return typeof value === "string" && value.length > 0 ? value : null;
  }
  return null;
};

const pathOf = (ctx: MiddlewareContext): string => {
  const withPath = ctx as { path?: string };
  return withPath.path ?? "";
};

/** The admin plugin stores `role` as an additional, untyped user field. */
const actorRoleOf = (sessionUser: unknown): string | null => {
  const withRole = sessionUser as { role?: string | null };
  return withRole.role ?? null;
};

/** The user an admin call acts on, if it names one. */
const resolveTargetUserId = async (
  ctx: MiddlewareContext,
  database: Database
): Promise<string | null> => {
  const userId = bodyField(ctx, "userId");
  if (userId) {
    return userId;
  }
  const sessionToken = bodyField(ctx, "sessionToken");
  if (!sessionToken) {
    return null;
  }
  const [row] = await database
    .select({ userId: sessionTable.userId })
    .from(sessionTable)
    .where(eq(sessionTable.token, sessionToken))
    .limit(1);
  return row?.userId ?? null;
};

interface AuditEntry {
  actorUserId: string | null;
  actorRole: string | null;
  action: string;
  targetUserId: string | null;
  outcome: "allowed" | "denied" | "failed";
  detail?: string;
}

const writeAudit = async (database: Database, entry: AuditEntry) => {
  await database.insert(accountAuditLog).values({
    id: crypto.randomUUID(),
    ...entry,
    detail: entry.detail ?? null,
  });
};

const deny = async (
  database: Database,
  entry: Omit<AuditEntry, "outcome">,
  message: string
): Promise<never> => {
  await writeAudit(database, { ...entry, outcome: "denied", detail: message });
  throw new APIError("FORBIDDEN", { message });
};

export const adminEndpointGuard = async (
  ctx: MiddlewareContext,
  database: Database
): Promise<void> => {
  const path = pathOf(ctx);
  if (!path.startsWith(ADMIN_PATH_PREFIX) || READ_ONLY_PATHS[path]) {
    return;
  }

  const current = await getSessionFromCtx(ctx);
  if (!current) {
    // No session: the endpoint itself answers 401.
    return;
  }

  const actorRole = actorRoleOf(current.user);
  const targetUserId = await resolveTargetUserId(ctx, database);
  const entry = {
    actorUserId: current.user.id,
    actorRole,
    action: path,
    targetUserId,
  };

  if (UNGRANTED_PATHS[path]) {
    await deny(database, entry, "This account operation is not available.");
  }

  if (!targetUserId) {
    return;
  }

  const [target] = await database
    .select({ role: userTable.role, username: userTable.username })
    .from(userTable)
    .where(eq(userTable.id, targetUserId))
    .limit(1);

  // The seeded club seat is configuration: nobody bans it or changes it, the
  // administrator included. This used to be claimed by a `user.update`
  // database hook that could never fire for these calls — better-auth hands
  // that hook only the changed fields, with no user id and no request
  // context — so the administrator could ban another seat (found by
  // `auth-escalation.test.ts` in the source project).
  if (isSeededAccount(target?.username) && SEAT_LOCKED_PATHS[path]) {
    await deny(
      database,
      entry,
      "The seeded club account cannot be banned or changed"
    );
  }

  const targetIsProtected =
    isPrivilegedRole(target?.role) || isSeededAccount(target?.username);
  if (targetIsProtected && actorRole !== "admin") {
    await deny(
      database,
      entry,
      "Only the administrator can act on an administrative or seeded account"
    );
  }
};

export const recordAdminEndpointCall = async (
  ctx: MiddlewareContext,
  database: Database
): Promise<void> => {
  const path = pathOf(ctx);
  if (!path.startsWith(ADMIN_PATH_PREFIX) || READ_ONLY_PATHS[path]) {
    return;
  }
  const current = await getSessionFromCtx(ctx);
  if (!current) {
    return;
  }
  const withContext = ctx as { context: { returned?: unknown } };
  const { returned } = withContext.context;
  // Our own refusal of an ungranted verb already wrote its row in
  // `adminEndpointGuard`; a refusal from the plugin's own permission check is
  // recorded below.
  if (
    returned instanceof APIError &&
    returned.status === "FORBIDDEN" &&
    UNGRANTED_PATHS[path]
  ) {
    return;
  }
  await writeAudit(database, {
    actorUserId: current.user.id,
    actorRole: actorRoleOf(current.user),
    action: path,
    targetUserId: await resolveTargetUserId(ctx, database),
    outcome: returned instanceof APIError ? "failed" : "allowed",
    detail: returned instanceof APIError ? returned.message : undefined,
  });
};
