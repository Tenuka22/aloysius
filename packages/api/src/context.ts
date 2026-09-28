import type { createAuth } from "@aloysius/auth";
import type { Database } from "@aloysius/db";
import type { Storage } from "@aloysius/storage";
import { ORPCError } from "@orpc/server";

export interface Context {
  auth: ReturnType<typeof createAuth> | null;
  session: Awaited<
    ReturnType<ReturnType<typeof createAuth>["api"]["getSession"]>
  >;
  db: Database;
  storage: Storage;
}

/**
 * Narrow the nullable `auth` on a context.
 *
 * Provisioning an account goes through Better Auth's own admin endpoint, so the
 * auth instance is required rather than optional. It is `null` only in unit
 * tests, which never provision a real credential.
 */
export const requireAuth = (auth: Context["auth"]) => {
  if (!auth) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "The authentication service is unavailable",
    });
  }
  return auth;
};
