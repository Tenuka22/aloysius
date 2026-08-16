import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.auth?.userId) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      auth: context.auth,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

const requireSiteAdmin = o.middleware(async ({ context, next }) => {
  if (!context.auth?.userId) {
    throw new ORPCError("UNAUTHORIZED");
  }
  if (!context.auth.adminCalled) {
    throw new ORPCError("FORBIDDEN", { message: "Site admin access required." });
  }
  return next({
    context: {
      auth: context.auth,
    },
  });
});

/**
 * Super-user tier: site-admin-only procedures. This is the ONLY procedure
 * builder allowed to gate on `context.auth.adminCalled` — every admin-only
 * mutation across the API must be built on this, never an inline check mixed
 * into a scoped-admin or public procedure. Backs the `client.admin.*` router
 * namespace exclusively.
 */
export const adminProcedure = publicProcedure.use(requireSiteAdmin);
