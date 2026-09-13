# API Router Documentation

## Overview

The API uses [oRPC](https://orpc.unnoq.com/) — a type-safe RPC framework. Routers are defined in `packages/api/src/` and the web app proxies them via TanStack Start server functions.

## Architecture

```
packages/api/src/
├── index.ts              # oRPC base + procedure definitions
├── context.ts            # Context type
└── routers/
    ├── index.ts          # Root appRouter
    └── files/
        ├── index.ts      # filesRouter barrel export
        ├── get-upload-url.ts
        ├── complete-upload.ts
        ├── list-files.ts
        └── delete-file.ts
```

## Context

`packages/api/src/context.ts`

```ts
export interface Context {
  auth: null;
  session: Awaited<
    ReturnType<ReturnType<typeof createAuth>["api"]["getSession"]>
  >;
  db: Database;
  storage: Storage;
}
```

| Field | Type | Purpose |
| --- | --- | --- |
| `auth` | `null` | Placeholder (not currently used in handlers) |
| `session` | `Session \| null` | The resolved better-auth session (user, token, expiresAt) |
| `db` | `Database` | Drizzle ORM database instance |
| `storage` | `Storage` | Blob storage (MinIO/S3-compatible) |

## Procedure Tiers

`packages/api/src/index.ts`

### `publicProcedure`

No auth check. Available to anyone.

```ts
export const publicProcedure = o;
```

### `protectedProcedure`

Requires an authenticated session. Throws `UNAUTHORIZED` if no session exists.

```ts
export const protectedProcedure = publicProcedure.use(requireAuth);
```

### `adminProcedure`

Requires an authenticated session with `role === "admin"`. Throws `UNAUTHORIZED` for unauthenticated callers, `FORBIDDEN` for non-admin users.

```ts
export const adminProcedure = publicProcedure.use(requireAdmin);
```

### Usage pattern

```ts
// Public — no auth
healthCheck: publicProcedure.handler(() => "OK"),

// Protected — requires session
getData: protectedProcedure.handler(({ context }) => {
  return { user: context.session.user };
}),

// Admin — requires admin role
uploadFile: adminProcedure.handler(({ context }) => {
  // context.session.user.role === "admin" is guaranteed
}),
```

## Root Router

`packages/api/src/routers/index.ts`

```ts
export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  files: filesRouter,
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
};
```

| Route         | Procedure   | Description                            |
| ------------- | ----------- | -------------------------------------- |
| `healthCheck` | `public`    | Returns `"OK"`                         |
| `files.*`     | `admin`     | File management (admin-only)           |
| `privateData` | `protected` | Returns user info (test/example route) |

## Files Router

`packages/api/src/routers/files/` — split into individual handler files.

### `getUploadUrl`

Generates a one-time presigned URL so the client can upload directly to S3/MinIO.

```ts
getUploadUrl: adminProcedure
  .input(z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    size: z.number().positive().max(MAX_FILE_SIZE),
  }))
  .handler(async ({ input, context }) => { ... })
```

**Flow:**

1. Validate file size (max 10MB)
2. Generate UUID + storage key: `admin/{uuid}.{extension}`
3. Get presigned upload URL from storage (5 min expiry)
4. Return `{ uploadUrl, key, id, expiresInSeconds, largeFile }`

### `completeUpload`

Called by the client after a successful direct upload to S3/MinIO.

```ts
completeUpload: adminProcedure
  .input(z.object({
    key: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
    size: z.number().positive(),
  }))
  .handler(async ({ input, context }) => { ... })
```

**Flow:**

1. Extract file ID from the key
2. Insert record in `files` table
3. Return metadata with URL

### `listFiles`

Returns all files in the system (admin-only, sees everything).

```ts
listFiles: adminProcedure.handler(async ({ context }) => { ... })
```

**Returns:**

```ts
Array<{ id; name; size; type; url; createdAt }>;
```

### `deleteFile`

Deletes a file. DB record is removed first (source of truth), then storage object.

```ts
deleteFile: adminProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => { ... })
```

**Flow:**

1. Look up file by ID
2. If not found: throw `NOT_FOUND`
3. Delete DB record first
4. Best-effort storage cleanup (logged if fails)
5. Return `{ success: true }`

## Error Handling

oRPC uses `ORPCError` with standard HTTP status codes as error names:

```ts
import { ORPCError } from "@orpc/server";

throw new ORPCError("UNAUTHORIZED"); // 401
throw new ORPCError("FORBIDDEN"); // 403
throw new ORPCError("NOT_FOUND", { message: "..." }); // 404
throw new ORPCError("BAD_REQUEST", { message: "..." }); // 400
```

Common error codes:

| Code | Meaning | When thrown |
| --- | --- | --- |
| `UNAUTHORIZED` | No valid session | Missing or expired session in middleware |
| `FORBIDDEN` | Insufficient permissions | Non-admin caller on admin-only endpoint |
| `NOT_FOUND` | Resource doesn't exist | File not found |
| `BAD_REQUEST` | Invalid input | File exceeds size limit |

## Input Validation

All inputs use [Zod](https://zod.dev/) schemas:

```ts
// Object with required fields
.input(z.object({ id: z.string() }))

// File metadata
.input(z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  size: z.number().positive(),
}))
```

## File Serving

Files are served via a TanStack Start server handler at `apps/web/src/routes/api/files/$.ts`:

```
GET /api/files/{key}
```

- Looks up the key in storage
- Returns the binary data with `Content-Type` from storage metadata
- Sets `Cache-Control: public, max-age=31536000, immutable` for aggressive caching
- Returns 404 if not found

## How to Add a New Router

1. Create `packages/api/src/routers/my-router/my-action.ts`:

```ts
import { z } from "zod";
import { adminProcedure } from "../../index";

export const myAction = adminProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    return { data: "..." };
  });
```

2. Create barrel export `packages/api/src/routers/my-router/index.ts`:

```ts
import { myAction } from "./my-action";
export const myRouter = { myAction };
```

3. Register in `packages/api/src/routers/index.ts`:

```ts
import { myRouter } from "./my-router";

export const appRouter = {
  // ...existing routes
  my: myRouter,
};
```
