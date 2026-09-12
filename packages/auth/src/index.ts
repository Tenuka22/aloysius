import type { Database } from "@aloysius/db";
import { account, user } from "@aloysius/db/schema/auth";
import * as schema from "@aloysius/db/schema/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword } from "better-auth/crypto";
import { admin, multiSession } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { and, eq } from "drizzle-orm";

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
};

export function createAuth(env: AuthConfig, database: Database) {
  const siteAdminEmail = env.ADMIN_EMAIL.toLowerCase();

  return betterAuth({
    database: drizzleAdapter(database, {
      provider: "sqlite",
      schema,
    }),
    trustedOrigins: [env.BETTER_AUTH_URL],
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false,
        },
      },
    },
    // The site admin's role is reasserted on every create and update, so the
    // account can't drift to "user" through an ordinary profile edit.
    databaseHooks: {
      user: {
        create: {
          before: async (created) => {
            const role = created.email?.toLowerCase() === siteAdminEmail ? "admin" : "user";
            return { data: { ...created, role } };
          },
        },
        update: {
          before: async (updated) => {
            if (updated.email?.toLowerCase() !== siteAdminEmail) return { data: updated };
            return { data: { ...updated, role: "admin" } };
          },
        },
      },
    },
    emailAndPassword: { enabled: true },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [admin(), multiSession(), tanstackStartCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;

/**
 * Bootstraps (or re-secures) the site admin's credential login. If the
 * account already exists its password is rotated to the configured default
 * so a forgotten/leaked password is always reset on boot - a server-side
 * stand-in for the admin plugin's `setUserPassword` route, which needs an
 * admin session to call.
 */
export async function ensureSiteAdmin(auth: Auth, database: Database, env: AuthConfig) {
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;
  const hash = await hashPassword(password);

  const existing = await database.select().from(user).where(eq(user.email, email)).get();

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
    .where(and(eq(account.userId, existing.id), eq(account.providerId, "credential")))
    .get();

  if (existingAccount) {
    await database
      .update(account)
      .set({ password: hash })
      .where(eq(account.id, existingAccount.id))
      .run();
  } else {
    await database
      .insert(account)
      .values({
        id: crypto.randomUUID(),
        accountId: existing.id,
        providerId: "credential",
        userId: existing.id,
        password: hash,
      })
      .run();
  }
  console.log(`[auth] Rotated password for site admin: ${email}`);
}
