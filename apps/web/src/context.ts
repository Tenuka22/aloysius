import type { Context as ApiContext } from "@aloysius/api/context";

import { ensureServerBootstrap, getDb, getStorage, auth } from "./services";

export const createContext = async ({
  req,
}: {
  req: Request;
}): Promise<ApiContext> => {
  await ensureServerBootstrap();
  const db = await getDb();
  const storage = getStorage();
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return {
    db,
    storage,
    auth: null,
    session,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
