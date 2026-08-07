type ClerkContextAuth = {
  userId: string | null;
};

type ClerkRequestContext = {
  auth: ClerkContextAuth | null;
  session: null;
  bucket: import("@cloudflare/workers-types").R2Bucket | null;
  r2PublicUrl: string;
};

function toClerkContextAuth(auth: { userId: string | null } | null): ClerkContextAuth | null {
  return auth ? { userId: auth.userId } : null;
}

import { createClerkClient } from "@clerk/backend";
import { env } from "@web-template/env/server";

const clerkClient = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

async function authenticateClerkRequest(request: Request): Promise<ClerkContextAuth | null> {
  const requestState = await clerkClient.authenticateRequest(request, {
    authorizedParties: [env.CORS_ORIGIN],
  });
  return toClerkContextAuth(requestState.toAuth());
}

import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({
  context,
}: CreateContextOptions): Promise<ClerkRequestContext> {
  const clerkAuth = await authenticateClerkRequest(context.req.raw);
  return {
    auth: clerkAuth,
    session: null,
    bucket: context.env.PUBLIC_ASSETS_BUCKET ?? null,
    r2PublicUrl: context.env.R2_PUBLIC_URL ?? "",
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
