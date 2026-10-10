import type { Database } from "@aloysius/db";
import { account, session, user } from "@aloysius/db/schema/auth";
import { hashPassword } from "better-auth/crypto";
import { eq, or } from "drizzle-orm";

import type { Auth, AuthConfig } from "./index";
import type { AppRole } from "./permissions";
import { isValidUsername } from "./username";

/**
 * Bootstraps (or re-secures) a credential login using direct database
 * operations — bypassing Better Auth's HTTP API layer entirely.
 *
 * Reasons for the direct-DB approach:
 * - `auth.api.signUpEmail` / `auth.api.createUser` both construct a web
 *   `Response` object internally. Varlock's patched Response constructor scans
 *   every response body for sensitive config values; calling those endpoints
 *   during request handling triggers false-positive leak detection.
 * - Bootstrap is a privileged, server-only operation. It should never go
 *   through the public HTTP pipeline.
 *
 * The account signs in with username + password. A synthetic internal email
 * (`<username>@aloysius.internal`) satisfies Better Auth's required email
 * field and is never shown to the user.
 */
const ensureCredentialUser = async (
  database: Database,
  {
    username: accountUsername,
    password,
    name,
    role,
  }: { username: string; password: string; name: string; role: string }
) => {
  const internalEmail = `${accountUsername.toLowerCase()}@aloysius.internal`;
  const [hash, [existing]] = await Promise.all([
    hashPassword(password),
    database
      .select()
      .from(user)
      .where(
        or(eq(user.username, accountUsername), eq(user.email, internalEmail))
      )
      .limit(1),
  ]);

  if (!existing) {
    const userId = crypto.randomUUID();
    await database.insert(user).values({
      id: userId,
      name,
      email: internalEmail,
      emailVerified: true,
      username: accountUsername,
      role,
    });

    await database.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hash,
    });

    /*
     * Deliberately no log line. The two this replaced printed the username at
     * credential-creation and password-rotation time, which the project style
     * guide prohibits, and the rotation one fires on *every* server boot for the
     * CMS account - so it was pure noise as well as a small disclosure.
     *
     * Both outcomes are observable without it: an admin screen shows whether an
     * account is provisioned, and a bad credential fails loudly at sign-in
     * rather than quietly.
     */
    return;
  }

  // Reassert the role every run, so it can't drift if someone edits the row
  // by hand, and rotate the credential password to match the configured env.
  await database.update(user).set({ role }).where(eq(user.id, existing.id));

  const [existingAccount] = await database
    .select()
    .from(account)
    .where(eq(account.userId, existing.id))
    .limit(1);

  // oxlint-disable-next-line unicorn/prefer-ternary
  if (existingAccount) {
    await database
      .update(account)
      .set({ password: hash })
      .where(eq(account.id, existingAccount.id));
  } else {
    await database.insert(account).values({
      id: crypto.randomUUID(),
      accountId: existing.id,
      providerId: "credential",
      userId: existing.id,
      password: hash,
    });
  }
};

const normalizeUsername = (username: string) => username.trim().toLowerCase();

const credentialEmail = (username: string) =>
  `${normalizeUsername(username)}@aloysius.internal`;

/** Better Auth's codes for "that identity is already taken". */
const DUPLICATE_CODES = new Set([
  "USER_ALREADY_EXISTS",
  "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
]);

const errorCodeOf = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const candidate = error as { body?: { code?: unknown }; code?: unknown };
  if (typeof candidate.body?.code === "string") {
    return candidate.body.code;
  }
  return typeof candidate.code === "string" ? candidate.code : null;
};

const isDuplicateIdentity = (error: unknown) => {
  const code = errorCodeOf(error);
  return code !== null && DUPLICATE_CODES.has(code);
};

export interface ClubCredentialInput {
  username: string;
  password: string;
  name: string;
  role?: AppRole;
}

/**
 * Creates a club administrator through Better Auth's own admin endpoint.
 *
 * Deliberately not a direct insert. `createUser` is the same code path sign-in
 * uses, so the account gets the same password hasher, the same credential-row
 * shape and the same schema transforms. A hand-rolled insert skips all three,
 * and the failure is silent and deferred: it will happily write a username that
 * the sign-in validator rejects, and the account only reveals itself as broken
 * later, at the login screen, with nothing in the database to explain why.
 *
 * Called with neither `headers` nor a request, which is Better Auth's
 * server-side path — the endpoint skips its session and permission checks only
 * when there is no request to read a session from. That keeps this privileged
 * and server-only rather than something reachable over HTTP.
 */
export const createClubCredential = async (
  auth: Auth,
  input: ClubCredentialInput
) => {
  const username = normalizeUsername(input.username);

  if (!isValidUsername(username)) {
    throw new Error(
      `"${input.username}" is not a valid username. Letters, digits, dot, underscore and hyphen only, starting with a letter or digit.`
    );
  }

  /*
   * The synthetic address is derived from the username, so a username that is
   * already taken is always also a taken address. That is what lets the
   * duplicate surface as one error here instead of a second lookup.
   */
  const email = credentialEmail(username);

  try {
    const created = await auth.api.createUser({
      body: {
        // `username` is a field the username plugin contributes to the user
        // model, so it travels in `data` rather than as a top-level key.
        data: { username },
        email,
        name: input.name.trim(),
        password: input.password,
        role: input.role ?? "user",
      },
    });

    return { id: created.user.id, username };
  } catch (error) {
    if (isDuplicateIdentity(error)) {
      throw new Error(`A user with the username ${username} already exists`, {
        cause: error,
      });
    }
    throw error;
  }
};

/**
 * Replaces the credential hash for an existing club user, then ends every
 * active session for that account. An admin resetting a club seat's password
 * is specifically resetting it *out from under* whoever currently holds it —
 * so the new password is worthless as a fix if the old session just keeps
 * working.
 */
export const rotateClubCredentialPassword = async (
  database: Database,
  usernameInput: string,
  newPassword: string
) => {
  const username = normalizeUsername(usernameInput);
  const [existing] = await database
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, username))
    .limit(1);

  if (!existing) {
    throw new Error("That user does not exist");
  }

  const [password, [existingAccount]] = await Promise.all([
    hashPassword(newPassword),
    database
      .select({ id: account.id })
      .from(account)
      .where(eq(account.userId, existing.id))
      .limit(1),
  ]);

  if (!existingAccount) {
    throw new Error("That user has no credential account");
  }

  await database
    .update(account)
    .set({ password })
    .where(eq(account.id, existingAccount.id));

  await database.delete(session).where(eq(session.userId, existing.id));
};

/**
 * Bootstraps (or re-secures) the CMS editor account. This role can only edit
 * and publish homepage content (see `cms` in `permissions.ts`) — it has no
 * access to staff, qualifications, or other admin-only resources.
 */
export const ensureCmsUser = (database: Database, env: AuthConfig) =>
  ensureCredentialUser(database, {
    username: env.CMS_USERNAME,
    password: env.CMS_PASSWORD,
    name: "CMS Editor",
    role: "cms",
  });

/**
 * Bootstraps (or re-secures) the site administrator account — the only role
 * that may act on any account, including other admins (see `isPrivilegedRole`).
 *
 * The `admin` role has always existed in `permissions.ts` and Better Auth's
 * admin plugin, but nothing ever provisioned a holder for it, so it was
 * unreachable in practice: every seeded seat was `cms` or `club-admin`. This
 * closes that gap.
 *
 * Separate from `CMS_USERNAME` deliberately. Sharing one username would mean
 * one password to rotate and one account to compromise for both capabilities,
 * and the shared bootstrap would keep flipping the row back to `cms`.
 */
export const ensureAdminUser = (database: Database, env: AuthConfig) =>
  ensureCredentialUser(database, {
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD,
    name: "Site Administrator",
    role: "admin",
  });
