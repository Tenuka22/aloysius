import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

// ─── Auth middleware ─────────────────────────────────────────────────────────

const requireAuth = o.middleware(({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

// ─── Role-based middleware ───────────────────────────────────────────────────

const requireRole = (...allowedRoles: string[]) =>
  o.middleware(({ context, next }) => {
    if (!context.session?.user) {
      throw new ORPCError("UNAUTHORIZED");
    }
    if (!allowedRoles.includes(context.session.user.role ?? "")) {
      throw new ORPCError("FORBIDDEN");
    }
    return next({
      context: {
        session: context.session,
      },
    });
  });

export const adminProcedure = publicProcedure.use(requireRole("admin"));

export const cmsProcedure = publicProcedure.use(requireRole("admin", "cms"));

// ─── Permission-based middleware ─────────────────────────────────────────────

type PermissionResource = string;
type PermissionAction = string;

/**
 * Check if the current user's role has a specific permission via better-auth's
 * access control system. Falls back to role-based check if auth is unavailable.
 */
const requirePermission = (
  resource: PermissionResource,
  action: PermissionAction
) =>
  o.middleware(async ({ context, next }) => {
    if (!context.session?.user) {
      throw new ORPCError("UNAUTHORIZED");
    }

    const { role } = context.session.user;
    if (!role) {
      throw new ORPCError("FORBIDDEN");
    }

    // Admin bypasses all permission checks
    if (role === "admin") {
      return next({
        context: {
          session: context.session,
        },
      });
    }

    // If auth is unavailable, deny access (tests may pass null)
    if (!context.auth) {
      throw new ORPCError("FORBIDDEN");
    }

    try {
      const result = await context.auth.api.userHasPermission({
        body: {
          role: role as "admin" | "cms" | "user",
          permissions: { [resource]: [action] },
        },
      });

      if (!result.success) {
        throw new ORPCError("FORBIDDEN");
      }
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      // If permission check fails (e.g., role doesn't exist), deny access
      throw new ORPCError("FORBIDDEN");
    }

    return next({
      context: {
        session: context.session,
      },
    });
  });

// ─── Permission-checked procedures ──────────────────────────────────────────

/** Student management: requires student:create or student:read etc. */
export const requireStudentPermission = (action: PermissionAction) =>
  publicProcedure.use(requirePermission("student", action));

/** Mark management: requires mark:create or mark:read etc. */
export const requireMarkPermission = (action: PermissionAction) =>
  publicProcedure.use(requirePermission("mark", action));

/** Exam management: requires exam:create or exam:read etc. */
export const requireExamPermission = (action: PermissionAction) =>
  publicProcedure.use(requirePermission("exam", action));

/** Staff management: requires staff:create or staff:read etc. */
export const requireStaffPermission = (action: PermissionAction) =>
  publicProcedure.use(requirePermission("staff", action));

/** Assignment management: requires assignment:create etc. */
export const requireAssignmentPermission = (action: PermissionAction) =>
  publicProcedure.use(requirePermission("assignment", action));

/** CMS management: requires cms:edit or cms:publish etc. */
export const requireCmsPermission = (action: PermissionAction) =>
  publicProcedure.use(requirePermission("cms", action));
