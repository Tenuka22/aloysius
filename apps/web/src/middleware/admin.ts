import { createMiddleware } from "@tanstack/react-start";

import { authMiddleware } from "./auth";
import { assertSiteAdmin } from "./site-admin";

/**
 * Site-admin gate for server functions. Layers on `authMiddleware`'s session
 * and rejects anything but an authenticated user whose role is "admin" -
 * mirrors the API layer's admin-only procedure tier, the only place allowed
 * to check `role === "admin"` for a privileged action.
 */
export const requireSiteAdminMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    assertSiteAdmin(context.session);
    return next({
      context: { session: context.session },
    });
  });
