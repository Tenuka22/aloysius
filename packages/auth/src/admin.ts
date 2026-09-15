import type { Database } from "@aloysius/db";
import { account, user } from "@aloysius/db/schema/auth";
import { hashPassword } from "better-auth/crypto";
import { and, eq, or } from "drizzle-orm";

import type { AuthConfig } from "./index";

/**
 * Bootstraps (or re-secures) the site admin's credential login using direct
 * database operations — bypassing Better Auth's HTTP API layer entirely.
 *
 * Reasons for the direct-DB approach:
 * - `auth.api.signUpEmail` / `auth.api.createUser` both construct a web
 *   `Response` object internally. Varlock's patched Response constructor scans
 *   every response body for sensitive config values; calling those endpoints
 *   during request handling triggers false-positive leak detection.
 * - Bootstrap is a privileged, server-only operation. It should never go
 *   through the public HTTP pipeline.
 *
 * The admin signs in with username + password. A synthetic internal email
 * (`<username>@aloysius.internal`) satisfies Better Auth's required email
 * field and is never shown to the user.
 */
export const ensureSiteAdmin = async (database: Database, env: AuthConfig) => {
  const adminUsername = env.ADMIN_USERNAME;
  const internalEmail = `${adminUsername.toLowerCase()}@aloysius.internal`;
  const password = env.ADMIN_PASSWORD;

  const [hash, existing] = await Promise.all([
    hashPassword(password),
    database
      .select()
      .from(user)
      .where(
        or(eq(user.username, adminUsername), eq(user.email, internalEmail))
      )
      .get(),
  ]);

  if (!existing) {
    const userId = crypto.randomUUID();
    await database
      .insert(user)
      .values({
        id: userId,
        name: "Site Admin",
        email: internalEmail,
        emailVerified: true,
        username: adminUsername,
        role: "admin",
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

    console.log(`[auth] Created site admin: username=${adminUsername}`);
    return;
  }

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
    `[auth] Rotated password for site admin: username=${adminUsername}`
  );
};
