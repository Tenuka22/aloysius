import type { createAuth } from "@aloysius/auth";
import type { Database } from "@aloysius/db";

export type Context = {
  auth: null;
  session: Awaited<ReturnType<ReturnType<typeof createAuth>["api"]["getSession"]>>;
  db: Database;
};
