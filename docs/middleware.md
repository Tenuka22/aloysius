# Web Middleware Documentation

## Overview

The web app (`apps/web/`) uses TanStack Start middleware to enforce authentication and authorization on server functions. Middleware is defined in `apps/web/src/middleware/`.

## Middleware Files

| File | Export | Purpose |
| --- | --- | --- |
| `auth.ts` | `authMiddleware` | Resolves session from cookies |
| `site-admin.ts` | `assertSiteAdmin` | Pure function — validates admin role |
| `admin.ts` | `requireSiteAdminMiddleware` | Composes auth + admin check |

## The Middleware Chain

```
requireSiteAdminMiddleware
  └── authMiddleware (parent)
        └── resolve session from request cookies
  └── assertSiteAdmin(session)
        └── check user exists + role === "admin"
```

### `authMiddleware` (`auth.ts`)

Resolves the better-auth session from the request's cookies:

```ts
import { auth } from "../services";

export const authMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return next({
      context: { session },
    });
  }
);
```

- Uses `auth.api.getSession()` — reads the session token from cookies
- Session is `null` if not authenticated (no error thrown here)
- Adds `session` to the middleware context for downstream use

### `assertSiteAdmin` (`site-admin.ts`)

A pure function with no service dependencies — makes it fully unit-testable:

```ts
export type SiteAdminSession =
  { user: { role?: string | null } } | null | undefined;

export function assertSiteAdmin(session: SiteAdminSession): void {
  const user = session?.user;
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
}
```

**Throws:**

| Error            | Condition                             |
| ---------------- | ------------------------------------- |
| `"UNAUTHORIZED"` | No session or no user                 |
| `"FORBIDDEN"`    | User exists but role is not `"admin"` |

### `requireSiteAdminMiddleware` (`admin.ts`)

Composes `authMiddleware` + `assertSiteAdmin` into a single middleware:

```ts
export const requireSiteAdminMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    assertSiteAdmin(context.session);
    return next({
      context: { session: context.session },
    });
  });
```

## Usage in Server Functions

```ts
import { createFileRoute } from "@tanstack/react-router";
import { requireSiteAdminMiddleware } from "../../middleware/admin";
import { authMiddleware } from "../../middleware/auth";

// Protected route — requires any authenticated user
export const Route = createFileRoute("/some-route")({
  server: {
    middleware: [authMiddleware],
    handlers: {
      GET: async ({ context }) => {
        // context.session is guaranteed
      },
    },
  },
});

// Admin-only route — requires admin role
export const Route = createFileRoute("/admin-route")({
  server: {
    middleware: [requireSiteAdminMiddleware],
    handlers: {
      GET: async ({ context }) => {
        // context.session.user.role === "admin"
      },
    },
  },
});
```

## Unit Testing `assertSiteAdmin`

The pure function pattern makes testing straightforward — no mocking needed:

```ts
import { describe, expect, it } from "vitest";
import { assertSiteAdmin } from "./site-admin";

describe("assertSiteAdmin", () => {
  it("throws UNAUTHORIZED when there is no session", () => {
    expect(() => assertSiteAdmin(null)).toThrowError("UNAUTHORIZED");
    expect(() => assertSiteAdmin(undefined)).toThrowError("UNAUTHORIZED");
  });

  it("throws FORBIDDEN when the session user is not a site admin", () => {
    expect(() => assertSiteAdmin({ user: { role: "user" } })).toThrowError(
      "FORBIDDEN"
    );
    expect(() => assertSiteAdmin({ user: { role: null } })).toThrowError(
      "FORBIDDEN"
    );
  });

  it("does not throw for an authenticated site admin", () => {
    expect(() => assertSiteAdmin({ user: { role: "admin" } })).not.toThrow();
  });
});
```

## When to Use Each Middleware

| Middleware | Use when |
| --- | --- |
| None | Public routes, no auth needed |
| `authMiddleware` | Route requires any authenticated user |
| `requireSiteAdminMiddleware` | Route requires admin role (file management, admin panel) |

## Adding New Permission-Based Middleware

To add a new role check (e.g., `"moderator"`):

1. Create a pure assertion function in `site-admin.ts` or a new file:

```ts
export function assertModerator(session: SiteAdminSession): void {
  const user = session?.user;
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.role !== "moderator" && user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
}
```

2. Create a middleware that composes auth + the assertion:

```ts
export const requireModeratorMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    assertModerator(context.session);
    return next({ context: { session: context.session } });
  });
```

3. Write unit tests for the assertion function (no mocking needed)
