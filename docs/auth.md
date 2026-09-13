# Authentication & RBAC System

## Overview

Aloysius uses [better-auth](https://www.better-auth.com/) with a custom RBAC system via `createAccessControl`, admin plugin, and multi-session support. Authentication is session-based (not JWT), with sessions stored in the database.

## File Structure

```
packages/auth/src/
├── index.ts          # createAuth + exports
├── admin.ts          # ensureSiteAdmin
├── permissions.ts    # RBAC: ac, admin role, user role
└── index.test.ts     # Tests
```

## RBAC Permissions

`packages/auth/src/permissions.ts` — single source of truth for all permissions.

```ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements, // user + session from better-auth
  file: ["create", "list", "delete"], // custom resource
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  ...adminAc.statements, // all default admin permissions
  file: ["create", "list", "delete"],
});

export const user = ac.newRole({});
```

### Roles summary

| Role | Capabilities |
| --- | --- |
| `"admin"` | Full control over all resources: user management, session management, file operations |
| `"user"` (default) | Authenticated, can access protected routes. No file permissions |

### Resources and permissions

| Resource | Actions | Who |
| --- | --- | --- |
| `user` | create, list, set-role, ban, impersonate, delete, set-password, set-email, get, update | admin |
| `session` | list, revoke, delete | admin |
| `file` | create, list, delete | admin |

## Configuration

`packages/auth/src/index.ts` — `createAuth(env, database)`

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
  plugins: [
    adminPlugin({ ac, roles: { admin: adminRole, user: userRole } }),
    multiSession(),
    tanstackStartCookies(),
  ],
  emailAndPassword: { enabled: true },
});
```

### Key config points

| Setting | Value | Purpose |
| --- | --- | --- |
| `cookiePrefix` | `"aloysius"` | Cookie names become `aloysius.session`, etc. |
| `admin()` plugin | With `ac` + `roles` | Custom RBAC permissions for admin and user roles |
| `multiSession()` plugin | enabled | Allows multiple concurrent sessions per user |

The client (`apps/web/src/lib/auth-client.ts`) must mirror the server plugins exactly:

```ts
import { ac, admin, user } from "@aloysius/auth/permissions";

createAuthClient({
  plugins: [adminClient({ ac, roles: { admin, user } }), multiSessionClient()],
});
```

## Role System

The `user.role` field is a string column (default: `"user"`). It's set via `databaseHooks` — no other mechanism assigns roles.

### How admin role is assigned

In `packages/auth/src/index.ts`, `databaseHooks` force the role on every `user.create` and `user.update`:

```ts
databaseHooks: {
  user: {
    create: {
      before: async (created) => {
        const role = created.email?.toLowerCase() === siteAdminEmail ? "admin" : "user";
        return { data: { ...created, role } };
      },
    },
    update: {
      before: async (updated) => {
        if (updated.email?.toLowerCase() !== siteAdminEmail) {
          return { data: updated };
        }
        return { data: { ...updated, role: "admin" } };
      },
    },
  },
},
```

**Behavior:**

- On user creation: if email matches `ADMIN_EMAIL` (case-insensitive), role is set to `"admin"`, otherwise `"user"`
- On user update: if the email is the site admin email, role is forced back to `"admin"` — prevents drift from profile edits
- The `role` field has `input: false`, so it cannot be set directly via the auth API

### Site admin bootstrap

`ensureSiteAdmin()` in `packages/auth/src/admin.ts` runs once at server start (`apps/web/src/services.ts`):

1. If the admin user doesn't exist, it's created via `auth.api.createUser()`
2. If it exists, the password is **rotated** to `ADMIN_PASSWORD` — a leaked password is always reset on boot

## API Layer Auth Enforcement

`packages/api/src/index.ts` defines three procedure tiers:

```ts
export const publicProcedure = o;
export const protectedProcedure = publicProcedure.use(requireAuth);
export const adminProcedure = publicProcedure.use(requireAdmin);
```

### Procedure tiers

| Procedure            | Auth required | Role check         | Used by       |
| -------------------- | ------------- | ------------------ | ------------- |
| `publicProcedure`    | No            | None               | `healthCheck` |
| `protectedProcedure` | Yes           | None               | `privateData` |
| `adminProcedure`     | Yes           | `role === "admin"` | `files.*`     |

## Web Middleware Auth Enforcement

`apps/web/src/middleware/` contains the middleware chain:

### `authMiddleware` (`auth.ts`)

Resolves the session from cookies using `auth.api.getSession()`.

### `requireSiteAdminMiddleware` (`admin.ts`)

Layers on `authMiddleware` and rejects non-admin users via `assertSiteAdmin()`.

### `assertSiteAdmin` (`site-admin.ts`)

Pure function — no auth service imports, fully unit-testable:

```ts
export function assertSiteAdmin(session: SiteAdminSession): void {
  const user = session?.user;
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.role !== "admin") throw new Error("FORBIDDEN");
}
```

## Auth Flow

```
Request arrives
  │
  ├─ API route (oRPC)
  │    ├─ publicProcedure → no check
  │    ├─ protectedProcedure → requireAuth
  │    │    └─ session exists? → YES → proceed
  │    │                      → NO  → UNAUTHORIZED
  │    └─ adminProcedure → requireAuth + role check
  │         └─ session.user.role === "admin"? → YES → proceed
  │                                          → NO  → FORBIDDEN
  └─ Web server function
       ├─ authMiddleware → resolve session from cookies
       └─ requireSiteAdminMiddleware → authMiddleware + assertSiteAdmin
            ├─ session.user exists? → NO  → UNAUTHORIZED
            ├─ session.user.role === "admin"? → NO  → FORBIDDEN
            └─ YES → proceed
```

## Environment Variables

| Variable | Purpose | Example |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Signing key for sessions (min 32 chars) | `N7E8Spn6ZwfjwCbQcHPi8rjfXlPyFaDw` |
| `BETTER_AUTH_URL` | Base URL for auth endpoints | `http://localhost:3001` |
| `ADMIN_EMAIL` | Site admin email (hardcoded role) | `admin@example.com` |
| `ADMIN_PASSWORD` | Site admin password (rotated on boot) | `admin123456` |
