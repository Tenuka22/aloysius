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
} as const;

export type AppAccessControl = AccessControl<typeof statement>;

export const ac: AppAccessControl = createAccessControl(statement);

/**
 * Admin – full control over every resource, including file management.
 * Spreads the default admin statements so all built-in user/session
 * permissions are preserved.
 */
export const admin = ac.newRole({
  ...adminAc.statements,
  file: ["create", "list", "delete"],
});

/**
 * Regular user – no file permissions. This role is the default assigned
 * to every new account. Users with this role cannot upload, list, or
 * delete files; those actions are admin-only.
 */
export const user = ac.newRole({});
