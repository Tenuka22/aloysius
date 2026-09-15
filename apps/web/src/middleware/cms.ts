import { createMiddleware } from "@tanstack/react-start";

import { authMiddleware } from "./auth";

/**
 * CMS role gate. Allows users with role "admin" or "cms" to access
 * CMS routes and API endpoints. Layers on `authMiddleware`'s session.
 */
export const requireCmsRoleMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(({ next, context }) => {
    const user = context.session?.user;
    if (!user) {
      throw new Error("UNAUTHORIZED");
    }
    if (user.role !== "admin" && user.role !== "cms") {
      throw new Error("FORBIDDEN");
    }
    return next({
      context: { session: context.session },
    });
  });
