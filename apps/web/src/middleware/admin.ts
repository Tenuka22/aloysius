import { createMiddleware } from "@tanstack/react-start";

import { authMiddleware } from "./auth";

/**
 * Site-admin gate for server functions. Layers on `authMiddleware`'s session
 * and rejects anything but an authenticated user whose role is "admin" -
 * mirrors the API layer's admin-only procedure tier, the only place allowed
 * to check `role === "admin"` for a privileged action.
 */
export const requireSiteAdminMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    const user = context.session?.user;
    if (!user) {
      throw new Error("UNAUTHORIZED");
    }
    if (user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    return next({
      context: { session: context.session },
    });
  });
