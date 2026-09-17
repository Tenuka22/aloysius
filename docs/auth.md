# Authentication & RBAC System

## Overview

Aloysius uses [better-auth](https://www.better-auth.com/) with a custom RBAC system (`createAccessControl`), the admin plugin, the username plugin, and multi-session support. Authentication is session-based (not JWT), sessions stored in the database. There is **no open signup** — every account (site admin, CMS editor, teacher) is a predefined username + password credential, bootstrapped or created server-side.

## File Structure

```
packages/auth/src/
├── index.ts          # createAuth + AuthConfig + plugin wiring
├── admin.ts          # ensureSiteAdmin, ensureCmsUser, createTeacherCredential,
│                      # rotateTeacherPassword
├── permissions.ts     # RBAC: ac, admin/cms/user/teacher roles
└── index.test.ts     # Tests

packages/api/src/index.ts
├── publicProcedure / protectedProcedure
├── adminProcedure / cmsProcedure / teacherProcedure   # role-based
└── requireStudentPermission / requireMarkPermission /
    requireExamPermission / requireStaffPermission /
    requireAssignmentPermission / requireCmsPermission  # permission-based
```

## RBAC Permissions

`packages/auth/src/permissions.ts` — single source of truth for all permissions.

```ts
export const statement = {
  ...defaultStatements, // user + session from better-auth
  file: ["create", "list", "delete"],
  staff: ["create", "read", "update", "delete"],
  assignment: ["create", "read", "update", "delete"],
  qualification: ["create", "read", "approve"],
  cms: ["edit", "publish"],
  student: ["create", "read", "update", "delete"],
  mark: ["create", "read", "update"],
  exam: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  ...adminAc.statements,
  file: ["create", "list", "delete"],
  staff: ["create", "read", "update", "delete"],
  assignment: ["create", "read", "update", "delete"],
  qualification: ["create", "read", "approve"],
  cms: ["edit", "publish"],
});

export const cms = ac.newRole({ cms: ["edit", "publish"] });

export const user = ac.newRole({ qualification: ["create", "read"] });

export const teacher = ac.newRole({
  student: ["read"],
  mark: ["create", "read", "update"],
  exam: ["read"],
  assignment: ["read"],
});
```

### Roles summary

| Role | Capabilities |
| --- | --- |
| `admin` | Full control over every resource: user/session management, file operations, staff/assignment CRUD, qualification approval, CMS edit/publish |
| `cms` | CMS content edit + publish only. No staff, student, or mark access |
| `teacher` | Read students, create/read/update marks, read exam types, read assignments — scoped to their own assigned classes at the application level (the RBAC layer itself is not per-class; see [marking.md](./marking.md) for how a teacher's assigned classes gate what they actually see) |
| `user` (default, unused by any real account today) | Can create/read their own qualifications only |

The `studentOfficer`/`teacherOfficer` split from an earlier design has been fully replaced by the single `teacher` role above.

### Resources and permissions

| Resource | Actions | Granted to |
| --- | --- | --- |
| `user` / `session` | (better-auth defaults: create, list, ban, impersonate, revoke, etc.) | `admin` |
| `file` | create, list, delete | `admin` |
| `staff` | create, read, update, delete | `admin` |
| `assignment` | create, read, update, delete (`admin`); read (`teacher`) | `admin`, `teacher` |
| `qualification` | create, read (`user`, `admin`); approve (`admin`) | `admin`, `user` |
| `cms` | edit, publish | `admin`, `cms` |
| `student` | create, read, update, delete (`admin`); read (`teacher`) | `admin`, `teacher` |
| `mark` | create, read, update | `admin`, `teacher` |
| `exam` | create, read, update, delete (`admin`); read (`teacher`) | `admin`, `teacher` |

## No Open Signup — Predefined Credential Accounts

Every account is created server-side via `ensureCredentialUser()` (a private helper in `packages/auth/src/admin.ts`), never through better-auth's public sign-up HTTP endpoints. Reasons, straight from the code comment:

- `auth.api.signUpEmail`/`auth.api.createUser` construct a web `Response` internally; Varlock's patched `Response` constructor scans every response body for sensitive config values, and calling those endpoints mid-request triggers false-positive leak detection.
- Account bootstrap is a privileged, server-only operation — it should never go through the public HTTP pipeline at all.

Every credential account signs in with **username + password**. A synthetic internal email (`<username>@aloysius.internal`) satisfies better-auth's required email field but is never shown to the user.

### Site admin and CMS editor — bootstrapped on server start

`ensureSiteAdmin(database, env)` and `ensureCmsUser(database, env)` both call the shared `ensureCredentialUser` helper with `ADMIN_USERNAME`/`ADMIN_PASSWORD` and `CMS_USERNAME`/`CMS_PASSWORD` respectively (from `AuthConfig`). Each run:

1. Looks up the hash and the existing user **concurrently** (`Promise.all`) — the password hash is computed either way, so there's no reason to serialize it after the lookup.
2. If the user doesn't exist: creates the `user` row (with the target role) and an `account` row (credential provider) in one pass.
3. If the user exists: **reasserts the role** on every run (so it can never drift if someone edits the row by hand) and **rotates the password** to match the configured env value, updating the `account` row (or inserting one if somehow missing).

This runs on every server start — a leaked or manually-changed password is always reset to the configured value on the next boot.

### Teacher accounts — created from the admin panel, not bootstrapped

Unlike the site admin/CMS editor (fixed, env-configured, one per role), teacher accounts are created ad hoc by an admin:

- `createTeacherCredential(database, { username, password, name })` — creates a brand-new `role: "teacher"` user + credential account. Throws if the username (or its synthetic email) is already taken.
- `rotateTeacherPassword(database, { username, newPassword })` — rotates an existing teacher's password. Throws if the username doesn't exist.

Both are plain exported functions in `packages/auth/src/admin.ts`, meant to be called from an admin-only API procedure (no such procedure exists yet in `packages/api`; a "teacher manager password" gate is noted in the code as something to add at the API layer before wiring this up).

## Configuration

`packages/auth/src/index.ts` — `createAuth(env, database)`.

```ts
export interface AuthConfig {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  CMS_USERNAME: string;
  CMS_PASSWORD: string;
}
```

```ts
betterAuth({
  database: drizzleAdapter(database, { provider: "sqlite", schema }),
  trustedOrigins: [env.BETTER_AUTH_URL],
  advanced: { cookiePrefix: "aloysius" },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: (created) => {
          /* forces role to "admin" iff email matches
                  the site admin's synthetic email, else "user" */
        },
      },
      update: {
        before: (updated) => {
          /* re-forces "admin" if the site admin's
                  email is ever touched, so profile edits can't demote it */
        },
      },
    },
  },
  emailAndPassword: { enabled: true },
  plugins: [
    adminPlugin({ ac, roles: { admin, cms, user, teacher } }),
    multiSession(),
    username(),
    tanstackStartCookies(),
  ],
});
```

### Key config points

| Setting | Value | Purpose |
| --- | --- | --- |
| `cookiePrefix` | `"aloysius"` | Cookie names become `aloysius.session`, etc. — avoids colliding with another app on the same top-level domain |
| `admin()` plugin | `{ ac, roles: { admin, cms, user, teacher } }` | Registers all four custom RBAC roles with better-auth's admin plugin |
| `username()` plugin | enabled | Lets every credential account (admin, CMS editor, teachers) sign in with username + password instead of email |
| `multiSession()` plugin | enabled | Multiple concurrent sessions per user |
| `role.input` | `false` | The `role` field can never be set directly by a client through the auth API — only the server-side bootstrap/creation functions above set it |

The client (`apps/web/src/lib/auth-client.ts`) must mirror the server plugins exactly (`adminClient({ ac, roles: { admin, cms, user, teacher } })`, `multiSessionClient()`, a matching username client plugin) — a mismatch here silently breaks role-aware client-side checks.

## API Layer Auth Enforcement

`packages/api/src/index.ts` defines two families of gated procedures on top of `publicProcedure`.

### Role-based procedures

```ts
export const protectedProcedure = publicProcedure.use(requireAuth);
export const adminProcedure = publicProcedure.use(requireRole("admin"));
export const cmsProcedure = publicProcedure.use(requireRole("admin", "cms"));
export const teacherProcedure = publicProcedure.use(
  requireRole("admin", "teacher")
);
```

`requireRole(...allowedRoles)` throws `UNAUTHORIZED` if there's no session, `FORBIDDEN` if `session.user.role` isn't in the allowed list. `admin` is included in every specialized tier (`cmsProcedure`, `teacherProcedure`) — an admin can always do what a CMS editor or teacher can.

### Permission-based procedures

For finer-grained checks than a role tier, `requirePermission(resource, action)` backs a family of factory functions:

```ts
requireStudentPermission("read"); // -> student:read
requireMarkPermission("create"); // -> mark:create
requireExamPermission("read"); // -> exam:read
requireStaffPermission("create"); // -> staff:create
requireAssignmentPermission("create"); // -> assignment:create
requireCmsPermission("edit"); // -> cms:edit
```

Each returns a procedure. The check:

1. `UNAUTHORIZED` if no session.
2. `FORBIDDEN` if the session has no role.
3. **`admin` bypasses every permission check** — always allowed.
4. `FORBIDDEN` if `context.auth` is unavailable (e.g. in a test context that only mocks `db`) — permission checks fail closed, not open.
5. Otherwise, calls better-auth's `auth.api.userHasPermission({ role, permissions: { [resource]: [action] } })` and throws `FORBIDDEN` on any failure or thrown error, including an unrecognized role.

This is what the marking router actually uses — e.g. `marking.createStudent` is `requireStudentPermission("create")`, `marking.enterSubjectMark` is `requireMarkPermission("create")`, `marking.assignStudentToClass` is `requireAssignmentPermission("create")`. See [marking.md](./marking.md) and [staff.md](./staff.md) for exactly which procedure each endpoint uses.

## Web Middleware Auth Enforcement

`apps/web/src/middleware/` mirrors the same role checks for server-rendered routes:

- **`authMiddleware`** (`auth.ts`) — resolves the session from cookies via `auth.api.getSession()`.
- **`requireSiteAdminMiddleware`** (`admin.ts`) — layers on `authMiddleware`, rejects non-admin via `assertSiteAdmin()`.
- **`assertSiteAdmin`** (`site-admin.ts`) — pure function, no auth-service imports, fully unit-testable:

  ```ts
  export const assertSiteAdmin = (session?: SiteAdminSession): void => {
    const user = session?.user;
    if (!user) throw new Error("UNAUTHORIZED");
    if (user.role !== "admin") throw new Error("FORBIDDEN");
  };
  ```

- **`cms.ts`** — the equivalent gate for CMS routes (admin or cms role).

## Auth Flow

```
Request arrives
  │
  ├─ API route (oRPC)
  │    ├─ publicProcedure → no check
  │    ├─ protectedProcedure → requireAuth (any authenticated session)
  │    ├─ adminProcedure / cmsProcedure / teacherProcedure → requireRole(...)
  │    │    └─ session.user.role in the allowed set? → YES → proceed
  │    │                                             → NO  → FORBIDDEN
  │    └─ require*Permission(resource, action) → requirePermission(...)
  │         ├─ role === "admin"? → YES → proceed
  │         └─ NO → auth.api.userHasPermission({ role, permissions }) → proceed or FORBIDDEN
  └─ Web server function
       ├─ authMiddleware → resolve session from cookies
       └─ requireSiteAdminMiddleware / cms middleware → assert role
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Signing key for sessions (min 32 chars) |
| `BETTER_AUTH_URL` | Base URL for auth endpoints |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Site admin credential login, bootstrapped and rotated on every server start |
| `CMS_USERNAME` / `CMS_PASSWORD` | CMS editor credential login, bootstrapped and rotated on every server start |

Teacher credentials have no env vars — they're created per-teacher from the admin panel via `createTeacherCredential`/`rotateTeacherPassword`.

## Related

- [staff.md](./staff.md) — which `staff.*` procedures are `adminProcedure` vs. self-service, and the staff/teacher data model these roles gate access to.
- [marking.md](./marking.md) — which `marking.*` procedures use the permission-based procedures documented above.
