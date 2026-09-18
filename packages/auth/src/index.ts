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
export { ensureCmsUser } from "./admin";

export interface AuthConfig {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
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
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin: adminRole,
        cms: cmsRole,
        user: userRole,
      },
    }),
    multiSession(),
    username(),
    tanstackStartCookies(),
  ],
});

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
