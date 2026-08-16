import { env } from "@aloysius-web/env/server";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

export function createDb() {
  return drizzle(env.DB, { schema });
}

/** Named handle to the drizzle db instance — import this instead of `ReturnType<typeof createDb>`. */
export type Database = ReturnType<typeof createDb>;
