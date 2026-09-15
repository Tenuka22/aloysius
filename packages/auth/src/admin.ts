import type { Database } from "@aloysius/db";
import { account, user } from "@aloysius/db/schema/auth";
import { hashPassword } from "better-auth/crypto";
import { and, eq, or } from "drizzle-orm";

import type { AuthConfig } from "./index";

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
  const [hash, existing] = await Promise.all([
    hashPassword(password),
    database
      .select()
      .from(user)
      .where(
        or(eq(user.username, accountUsername), eq(user.email, internalEmail))
      )
      .get(),
  ]);

  if (!existing) {
    const userId = crypto.randomUUID();
    await database
      .insert(user)
      .values({
        id: userId,
        name,
        email: internalEmail,
        emailVerified: true,
        username: accountUsername,
        role,
      })
      .run();

    await database
      .insert(account)
      .values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: hash,
      })
      .run();

    console.log(`[auth] Created ${role} user: username=${accountUsername}`);
    return;
  }

  // Reassert the role every run, so it can't drift if someone edits the row
  // by hand, and rotate the credential password to match the configured env.
  await database
    .update(user)
    .set({ role })
    .where(eq(user.id, existing.id))
    .run();

  const existingAccount = await database
    .select()
    .from(account)
    .where(
      and(eq(account.userId, existing.id), eq(account.providerId, "credential"))
    )
    .get();

  await (existingAccount
    ? database
        .update(account)
        .set({ password: hash })
        .where(eq(account.id, existingAccount.id))
        .run()
    : database
        .insert(account)
        .values({
          id: crypto.randomUUID(),
          accountId: existing.id,
          providerId: "credential",
          userId: existing.id,
          password: hash,
        })
        .run());

  console.log(
    `[auth] Rotated password for ${role} user: username=${accountUsername}`
  );
};

export const ensureSiteAdmin = (database: Database, env: AuthConfig) =>
  ensureCredentialUser(database, {
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD,
    name: "Site Admin",
    role: "admin",
  });

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
