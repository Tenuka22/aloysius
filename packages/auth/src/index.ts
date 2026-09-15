import type { Database } from "@aloysius/db";
import * as schema from "@aloysius/db/schema/auth";
import { betterAuth } from "better-auth";
import type {
  Auth as BetterAuthInstance,
  BetterAuthOptions,
} from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin as adminPlugin,
  multiSession,
  username,
} from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import {
  ac,
  admin as adminRole,
  cms as cmsRole,
  user as userRole,
} from "./permissions";

export { ac, admin, cms, user } from "./permissions";
export type { AppAccessControl } from "./permissions";
export { ensureCmsUser, ensureSiteAdmin } from "./admin";

export interface AuthConfig {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  CMS_USERNAME: string;
  CMS_PASSWORD: string;
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

const buildAuthOptions = (
  env: AuthConfig,
  database: Database
): BetterAuthOptions => {
  // Synthetic internal email derived from the configured username.
  // Never exposed — the admin signs in with username + password.
  const siteAdminEmail = `${env.ADMIN_USERNAME.toLowerCase()}@aloysius.internal`;

  return {
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
          before: (created) => {
            const role =
              created.email?.toLowerCase() === siteAdminEmail
                ? "admin"
                : "user";
            // `before` is typed as returning a promise, and this hook has
            // nothing to await, so the result is resolved eagerly.
            return Promise.resolve({ data: { ...created, role } });
          },
        },
        update: {
          before: (updated) => {
            if (updated.email?.toLowerCase() !== siteAdminEmail) {
              return Promise.resolve({ data: updated });
            }
            return Promise.resolve({ data: { ...updated, role: "admin" } });
          },
        },
      },
    },
    emailAndPassword: { enabled: true },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [
      adminPlugin({
        ac,
        roles: { admin: adminRole, cms: cmsRole, user: userRole },
      }),
      multiSession(),
      username(),
      tanstackStartCookies(),
    ],
  };
};

interface AdminPluginOptions {
  ac: typeof ac;
  roles: {
    admin: typeof adminRole;
    cms: typeof cmsRole;
    user: typeof userRole;
  };
}

interface ResolvedAuthOptions extends BetterAuthOptions {
  plugins: [
    ReturnType<typeof adminPlugin<AdminPluginOptions>>,
    ReturnType<typeof multiSession>,
    ReturnType<typeof username>,
    ReturnType<typeof tanstackStartCookies>,
  ];
}

export const createAuth = (
  env: AuthConfig,
  database: Database
): BetterAuthInstance<ResolvedAuthOptions> =>
  betterAuth(
    buildAuthOptions(env, database)
  ) as unknown as BetterAuthInstance<ResolvedAuthOptions>;

export type Auth = BetterAuthInstance<ResolvedAuthOptions>;
