import type { createAuth } from "@aloysius/auth";
import type { Database } from "@aloysius/db";
import type { Storage } from "@aloysius/storage";

export interface Context {
  auth: null;
  session: Awaited<
    ReturnType<ReturnType<typeof createAuth>["api"]["getSession"]>
  >;
  db: Database;
  storage: Storage;
}
