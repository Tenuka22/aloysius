import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import type { DatabaseConfig } from "./config";
import * as schema from "./schema";

export const createDb = (env: DatabaseConfig) => {
  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  return drizzle({ client, schema });
};

export type Database = ReturnType<typeof createDb>;
