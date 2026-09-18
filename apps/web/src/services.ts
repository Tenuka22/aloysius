import {
  createAuth as createConfiguredAuth,
  ensureCmsUser,
} from "@aloysius/auth";
import { createDb } from "@aloysius/db";
import type { Database } from "@aloysius/db";
import { createStorage } from "@aloysius/storage";
import type { Storage } from "@aloysius/storage";

import { env } from "./env.server";

const db = createDb(env);

export const getDb = (): Database => db;

export const auth = createConfiguredAuth(env, db);

const storage = createStorage(env);

export const getStorage = (): Storage => storage;

/**
 * One-time server bootstrap: seeds the CMS editor account.
 * Memoised so every route handler awaits the same promise and concurrent
 * first requests cannot seed twice; a transient failure resets the promise
 * so the next request retries instead of leaving the app unseeded.
 */
let bootstrapPromise: Promise<void> | undefined;

export const ensureServerBootstrap = (): Promise<void> => {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        await ensureCmsUser(db, env);
      } catch (error) {
        bootstrapPromise = undefined;
        throw error;
      }
    })();
  }
  return bootstrapPromise;
};
