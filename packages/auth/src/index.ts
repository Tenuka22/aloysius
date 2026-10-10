import type { Database } from "@aloysius/db";
import * as schema from "@aloysius/db/schema/auth";
import { betterAuth } from "better-auth";
import type {
  Auth as BetterAuthInstance,
  BetterAuthOptions,
} from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
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
  clubAdmin as clubAdminRole,
  user as userRole,
} from "./permissions";
import { forceSessionRevocationOnPasswordChange } from "./session-revocation";
import { isValidUsername } from "./username";

export { ac, admin, clubAdmin, cms, user } from "./permissions";
export type { AppAccessControl, AppRole } from "./permissions";
export { isValidUsername, USERNAME_PATTERN } from "./username";
export { PASSPHRASE_ENTROPY_BITS, generatePassphrase } from "./passphrase";
export {
  createClubCredential,
  ensureAdminUser,
  ensureCmsUser,
  rotateClubCredentialPassword,
} from "./admin";

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
 * domain.
 */
export const AUTH_COOKIE_PREFIX = "aloysius";

const buildAuthOptions = (
  env: AuthConfig,
  database: Database
): BetterAuthOptions => ({
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
  emailAndPassword: { enabled: true },
  hooks: {
    before: createAuthMiddleware((ctx) =>
      Promise.resolve(forceSessionRevocationOnPasswordChange(ctx))
    ),
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin: adminRole,
        cms: cmsRole,
        "club-admin": clubAdminRole,
        user: userRole,
      },
    }),
    multiSession(),
    username({
      /*
       * Club administrator usernames are generated from the club configuration
       * and are hyphenated. The plugin's default rule rejects hyphens, and it
       * enforces that rule at sign-in, so leaving it in place makes every one
       * of them unloginable.
       */
      usernameValidator: isValidUsername,
    }),
    tanstackStartCookies(),
  ],
});

interface AdminPluginOptions {
  ac: typeof ac;
  roles: {
    admin: typeof adminRole;
    cms: typeof cmsRole;
    "club-admin": typeof clubAdminRole;
    user: typeof userRole;
  };
}

export interface ResolvedAuthOptions extends BetterAuthOptions {
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
