import { createAuth as createConfiguredAuth, ensureSiteAdmin } from "@aloysius/auth";
import { type Database, createDb } from "@aloysius/db";

import { env } from "./env.server";

const db = createDb(env);

export function getDb(): Database {
  return db;
}
export const auth = createConfiguredAuth(env, db);

/**
 * One-time server bootstrap: seeds the site admin account. Memoised so every
 * route handler awaits the same promise and concurrent first requests cannot
 * seed twice; a transient failure (e.g. a locked database on boot) resets the
 * promise so the next request retries instead of leaving the app unseeded.
 */
let bootstrapPromise: Promise<void> | undefined;

export function ensureServerBootstrap(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = ensureSiteAdmin(auth, db, env).catch((error: unknown) => {
      bootstrapPromise = undefined;
      throw error;
    });
  }
  return bootstrapPromise;
}
