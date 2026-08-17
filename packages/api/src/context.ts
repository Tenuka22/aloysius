import { createAuth } from "@aloysius-web/auth";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await createAuth().api.getSession({
    headers: context.req.raw.headers,
  });

  return {
    auth: session
      ? {
          userId: session.user.id,
          role: session.user.role,
        }
      : null,
    session,
    bucket: context.env.PUBLIC_ASSETS_BUCKET ?? null,
    r2PublicUrl: context.env.R2_PUBLIC_URL ?? "",
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
