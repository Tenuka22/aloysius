import type { Context as ApiContext } from "@aloysius/api/context";

import { ensureServerBootstrap, getDb } from "./services";
import { auth } from "./services";

export async function createContext({ req }: { req: Request }): Promise<ApiContext> {
  await ensureServerBootstrap();
  const db = await getDb();
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return {
    db,
    auth: null,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
