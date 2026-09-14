import { randomUUID } from "node:crypto";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@libsql/client";
import { push } from "drizzle-kit/cli";
import { drizzle } from "drizzle-orm/libsql";

import type { Database } from "./index";

// drizzle-kit's schema glob matcher expects forward slashes even on Windows.
const SCHEMA_GLOB = fileURLToPath(
  new URL("schema/*.ts", import.meta.url)
).replaceAll("\\", "/");

/**
 * Spins up a fresh on-disk libsql database (in a temp dir) with the full
 * schema applied, for tests that need real query/constraint behavior instead
 * of mocks. Each call returns an independent database.
 *
 * Uses a temp file rather than `:memory:`: drizzle-kit's push() opens its own
 * connection to apply the schema, and libsql gives every `:memory:` connection
 * an isolated database, so a push against `:memory:` would land on a database
 * this function's own client never sees.
 */
export const createTestDb = async (): Promise<Database> => {
  const dir = await mkdtemp(path.join(tmpdir(), "aloysius-test-db-"));
  const url = `file:${path.join(dir, `${randomUUID()}.db`)}`;

  const result = await push({
    dialect: "sqlite",
    schema: SCHEMA_GLOB,
    url,
    force: true,
  });

  if (result.status === "error") {
    throw new Error(
      `Failed to push test schema: ${JSON.stringify(result.error)}`
    );
  }

  const client = createClient({ url });
  return drizzle({ client });
};
