import type { Database } from "@aloysius/db";
import { account, user } from "@aloysius/db/schema/auth";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";

import type { Auth, AuthConfig } from "./index";

/**
 * Bootstraps (or re-secures) the site admin's credential login. If the
 * account already exists its password is rotated to the configured default
 * so a forgotten/leaked password is always reset on boot - a server-side
 * stand-in for the admin plugin's `setUserPassword` route, which needs an
 * admin session to call.
 */
export const ensureSiteAdmin = async (
  auth: Auth,
  database: Database,
  env: AuthConfig
) => {
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;
  const [hash, existing] = await Promise.all([
    hashPassword(password),
    database.select().from(user).where(eq(user.email, email)).get(),
  ]);

  if (!existing) {
    try {
      await auth.api.createUser({
        body: { email, password, name: "Site Admin", role: "admin" as never },
      });
      console.log(`[auth] Created site admin: ${email}`);
    } catch (error) {
      console.error("[auth] ensure site admin create error:", error);
    }
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
  console.log(`[auth] Rotated password for site admin: ${email}`);
};
