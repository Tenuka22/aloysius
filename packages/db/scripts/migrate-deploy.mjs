// Applies pending migrations, then exits. Plain JavaScript so the Node runtime
// image can run it before the server starts: docker-compose.prod.yml's
// `migrate` service, which `web` waits on to complete successfully.
//
// Without it the production stack starts the server against whatever schema the
// last manual step left behind - a fresh `aloysius_turso_data` volume has no
// tables at all, so every request fails. drizzle applies the pending batch in
// one transaction and records each file, so running this on every start is
// idempotent: an up-to-date database is a no-op.
//
// This lives under packages/db rather than the repo root so Node resolves
// `@libsql/client` and `drizzle-orm` from this package's own node_modules,
// which is where bun's workspace layout puts them.
//
// `scripts/migrate.mjs` next to this one wraps `drizzle-kit migrate` instead,
// for interactive/CLI use; it needs drizzle-kit, which is a devDependency and
// is therefore not guaranteed to be present in the runtime image.
import path from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const here = import.meta.dirname;
const migrationsFolder = path.join(here, "../src/migrations");

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("[migrate] TURSO_DATABASE_URL is not set");
  process.exit(1);
}

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

try {
  await migrate(drizzle({ client }), { migrationsFolder });
  console.log("[migrate] database is up to date");
} catch (error) {
  console.error(`[migrate] failed: ${error?.message ?? error}`);
  process.exitCode = 1;
} finally {
  client.close();
}