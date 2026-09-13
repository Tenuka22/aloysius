import type { Database } from "@aloysius/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin, multiSession } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import * as schema from "@aloysius/db/schema/auth";

import { ac, admin as adminRole, user as userRole } from "./permissions";

export { ac, admin, user } from "./permissions";
export type { AppAccessControl } from "./permissions";
export { ensureSiteAdmin } from "./admin";

export interface AuthConfig {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
}

/**
 * The app's cookies are named off this instead of better-auth's "better-auth"
 * default, so they don't collide with another app on the same top-level
 * domain. The client (apps/web/src/lib/auth-client.ts) doesn't need this
 * value itself - `createAuthClient` has no cookie-name option, since the
 * browser sends whatever `Set-Cookie` the server issued - but it must stay in
 * lockstep with whatever server plugins are enabled here, which is what the
 * client's `adminClient()`/`multiSessionClient()` pairing is for.
 */
export const AUTH_COOKIE_PREFIX = "aloysius";

export const createAuth = (env: AuthConfig, database: Database) => {
  const siteAdminEmail = env.ADMIN_EMAIL.toLowerCase();

  return betterAuth({
    database: drizzleAdapter(database, {
      provider: "sqlite",
      schema,
    }),
    trustedOrigins: [env.BETTER_AUTH_URL],
    advanced: {
      cookiePrefix: AUTH_COOKIE_PREFIX,
    },
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
            const role =
              created.email?.toLowerCase() === siteAdminEmail
                ? "admin"
                : "user";
            return { data: { ...created, role } };
          },
        },
        update: {
          before: async (updated) => {
            if (updated.email?.toLowerCase() !== siteAdminEmail) {
              return { data: updated };
            }
            return { data: { ...updated, role: "admin" } };
          },
        },
      },
    },
    emailAndPassword: { enabled: true },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [
      adminPlugin({ ac, roles: { admin: adminRole, user: userRole } }),
      multiSession(),
      tanstackStartCookies(),
    ],
  });
};

export type Auth = ReturnType<typeof createAuth>;
