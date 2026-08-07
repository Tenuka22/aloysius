type ClerkContextAuth = {
  userId: string | null;
  adminCalled: boolean;
};

type ClerkRequestContext = {
  auth: ClerkContextAuth | null;
  session: null;
  bucket: import("@cloudflare/workers-types").R2Bucket | null;
  r2PublicUrl: string;
};

function toClerkContextAuth(auth: { userId: string | null; sessionClaims?: Record<string, unknown> } | null): ClerkContextAuth | null {
  if (!auth) return null;
  const role = (auth.sessionClaims as any)?.metadata?.role;
  return {
    userId: auth.userId,
    adminCalled: role === "admin",
  };
}

import { createClerkClient } from "@clerk/backend";
import { env } from "@aloysius-web/env/server";

const clerkClient = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

async function authenticateClerkRequest(request: Request): Promise<ClerkContextAuth | null> {
  const requestState = await clerkClient.authenticateRequest(request, {
    authorizedParties: [env.CORS_ORIGIN],
  });
  const auth = requestState.toAuth();
  return toClerkContextAuth({
    userId: auth?.userId ?? null,
    sessionClaims: auth?.sessionClaims as Record<string, unknown> | undefined,
  });
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
