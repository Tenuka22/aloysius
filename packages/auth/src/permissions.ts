import { createAccessControl } from "better-auth/plugins/access";
import type { AccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Application-wide permission statements. Each key is a resource and the
 * array enumerates every action that can be granted on that resource.
 *
 * `defaultStatements` re-exports better-auth's built-in `user` and `session`
 * resources so we keep a single source of truth here.
 */
export const statement = {
  ...defaultStatements,
  /** File assets: upload (create), enumerate (list), remove (delete). */
  file: ["create", "list", "delete"],
  /** CMS content: edit and publish pages. */
  cms: ["edit", "publish"],
  /** Club-authored content. */
  club: ["read", "submit"],
} as const;

export type AppAccessControl = AccessControl<typeof statement>;

/**
 * Every role the admin plugin is configured with. Typed as a union so a
 * credential cannot be created with a role the plugin would reject at runtime.
 */
export type AppRole = "admin" | "cms" | "club-admin" | "user";

export const ac: AppAccessControl = createAccessControl(statement);

/**
 * Admin – full control over every resource, including file management and CMS.
 * Spreads the default admin statements so all built-in user/session
 * permissions are preserved.
 */
export const admin = ac.newRole({
  ...adminAc.statements,
  file: ["create", "list", "delete"],
  cms: ["edit", "publish"],
});

/** The single hardcoded administrator role used by each club. */
export const clubAdmin = ac.newRole({
  club: ["read", "submit"],
});

/**
 * CMS editor – can edit and publish homepage content. Cannot manage files
 * or other admin-only resources.
 */
export const cms = ac.newRole({
  cms: ["edit", "publish"],
});

/**
 * Regular user – no special permissions beyond built-in user/session.
 */
export const user = ac.newRole({
  club: ["read"],
});
