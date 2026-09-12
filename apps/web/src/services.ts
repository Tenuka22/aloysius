import { createAuth as createConfiguredAuth } from "@aloysius/auth";
import { type Database, createDb } from "@aloysius/db";

import { env } from "./env.server";

const db = createDb(env);

export function getDb(): Database {
  return db;
}
export const auth = createConfiguredAuth(env, db);
