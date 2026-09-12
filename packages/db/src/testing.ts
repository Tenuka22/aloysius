import { createClient } from "@libsql/client";
import { pushSQLiteSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/libsql";

import type { Database } from "./index";
import * as schema from "./schema";

/**
 * Spins up a fresh in-memory libsql database with the full schema applied, for
 * tests that need real query/constraint behavior instead of mocks. Each call
 * returns an independent database.
 */
export async function createTestDb(): Promise<Database> {
  const client = createClient({ url: ":memory:" });
  const db = drizzle({ client, schema });

  const { apply } = await pushSQLiteSchema(schema, db);
  await apply();

  return db;
}
