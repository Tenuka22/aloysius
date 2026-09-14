import type { Database } from "@aloysius/db";
import { account, user } from "@aloysius/db/schema/auth";
import { hashPassword } from "better-auth/crypto";
import { and, eq, or } from "drizzle-orm";

import type { Auth, AuthConfig } from "./index";

/**
 * Bootstraps (or re-secures) the site admin's credential login. If the
 * account already exists its password is rotated to the configured default
 * so a forgotten/leaked password is always reset on boot.
 *
 * The admin signs in with username + password. A synthetic internal email
 * (`<username>@aloysius.internal`) is derived at creation time and never
 * surfaced to the UI — it only satisfies Better Auth's required email field.
 *
 * `signUpEmail` is used for creation (not `createUser`) because only the
 * former runs the username plugin's before-hook that persists the username
 * column.
 */
export const ensureSiteAdmin = async (
  auth: Auth,
  database: Database,
  env: AuthConfig
) => {
  const adminUsername = env.ADMIN_USERNAME;
  const internalEmail = `${adminUsername.toLowerCase()}@aloysius.internal`;
  const password = env.ADMIN_PASSWORD;

  // Look up by username (normal path) or fall back to internal email for
  // accounts that existed before the username column was added.
  const existing = await database
    .select()
    .from(user)
    .where(or(eq(user.username, adminUsername), eq(user.email, internalEmail)))
    .get();

  if (!existing) {
    try {
      await auth.api.signUpEmail({
        body: { email: internalEmail, password, name: "Site Admin", username: adminUsername },
      });
      console.log(`[auth] Created site admin: username=${adminUsername}`);
    } catch (error) {
      console.error("[auth] ensure site admin create error:", error);
    }
    return;
  }

  const hash = await hashPassword(password);

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

  console.log(`[auth] Rotated password for site admin: username=${adminUsername}`);
};
