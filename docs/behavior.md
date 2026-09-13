# System Behavior Patterns

Critical behavioral patterns in the Aloysius codebase that aren't obvious from reading individual files.

## File Deletion Order

**DB record is deleted FIRST, then storage object is deleted (best-effort).**

`packages/api/src/routers/files/delete-file.ts`:

```ts
// 1. Remove the DB record first — source of truth.
await context.db.delete(files).where(eq(files.id, input.id)).run();

// 2. Best-effort storage cleanup. If this fails the orphaned object
//    can be reaped by a background job; the DB is already consistent.
await context.storage.remove(row.key).catch((error) => {
  console.error(
    "[files] storage cleanup failed, orphaned key:",
    row.key,
    error
  );
});
```

This means: if storage deletion fails, the error is caught and logged, not thrown — the caller still gets `{ success: true }` and the orphaned MinIO object is left for later cleanup. The DB is the source of truth for what should exist; a row in the DB is the contract that a file exists, and once that row is gone, storage catching up asynchronously is acceptable, but a delete succeeding in the DB while still showing up in storage is not a bug to "fix" by reordering.

## Admin-Only File Operations

File management (`getUploadUrl`, `completeUpload`, `listFiles`, `deleteFile`) is enforced at the **API layer directly** — every file procedure uses `adminProcedure` (requires an authenticated session with `role === "admin"`), not `protectedProcedure`. There is no separate web-middleware layer restricting file operations anymore; `adminProcedure` throwing `FORBIDDEN` for non-admin callers is the only gate.

## Presigned URL Uploads

**This project uses presigned URL uploads for direct client → MinIO transfer.** The server never receives the file bytes:

1. Client calls `files.getUploadUrl({ name, type, size })` (admin only) → server generates a UUID, builds the key `admin/{uuid}.{extension}`, and returns a MinIO `presignedPutObject` URL (5 minute expiry, from `context.storage.getPresignedUploadUrl`)
2. Client `PUT`s the file directly to that URL, setting the `Content-Type` header itself — the presigned URL does not encode content type
3. Client calls `files.completeUpload({ key, name, type, size })` → server inserts the `files` DB record (id derived from the key's UUID segment) and returns the file's metadata + serving URL

There is no server-side image processing step in this flow — no WebP conversion, no `sharp` usage. The server only ever touches metadata; the object bytes flow client → MinIO directly.

## Role Enforcement

The `admin` role is hardcoded for the site admin email via `databaseHooks`:

```ts
// packages/auth/src/index.ts
databaseHooks: {
  user: {
    create: {
      before: (created) => {
        const role =
          created.email?.toLowerCase() === siteAdminEmail ? "admin" : "user";
        // Not `async` — there's nothing to await, so the promise the hook
        // type requires is resolved eagerly instead.
        return Promise.resolve({ data: { ...created, role } });
      },
    },
  },
},
```

- Only the user with `ADMIN_EMAIL` gets the admin role
- The role is reasserted on every update — cannot be changed via profile edits
- The `role` field has `input: false` — cannot be set via the auth API
- No other mechanism assigns roles; there is no admin UI for role management

## Session-Based Auth

All auth checks use sessions from better-auth, not JWT tokens:

```ts
// packages/auth/src/index.ts
return betterAuth({
  // ... no jwt plugin configured
  plugins: [admin(), multiSession(), tanstackStartCookies()],
});
```

Sessions are:

- Stored in the database (`session` table)
- Identified by a token in cookies (prefixed with `aloysius.`)
- Resolved via `auth.api.getSession({ headers })` in middleware
- Validated on every request that uses auth middleware

## Storage Key Format

Keys follow the pattern: `admin/{uuid}.{extension}` — a fixed `admin/` prefix, **not** the uploading user's ID.

```ts
// packages/api/src/routers/files/get-upload-url.ts
const id = crypto.randomUUID();
const extension = input.name.split(".").pop() || "bin";
const key = `admin/${id}.${extension}`;
```

Examples:

- `admin/550e8400-e29b-41d4-a716-446655440000.webp`
- `admin/660e8400-e29b-41d4-a716-446655440001.pdf`

Since only admins can call `getUploadUrl` (see [Admin-Only File Operations](#admin-only-file-operations)), there's currently no per-uploader isolation to preserve — every key lives under the same `admin/` prefix. `completeUpload`'s DB insert still records the actual uploader in `files.userId`, so ownership is tracked in the database even though the storage key doesn't encode it.

## No Server-Side Image Processing

Earlier revisions of this project converted uploaded images to WebP via `sharp` on the server. That flow is gone: uploads now go directly from the client to MinIO via a presigned URL (see [Presigned URL Uploads](#presigned-url-uploads)), so the server never has the bytes in hand to transcode. `sharp` remains listed as a dependency in `packages/api/package.json` and `apps/web/package.json` but nothing in the upload path imports it anymore — don't assume WebP conversion happens on upload.

## Server Bootstrap

`ensureServerBootstrap()` in `apps/web/src/services.ts`:

```ts
let bootstrapPromise: Promise<void> | undefined;

export const ensureServerBootstrap = (): Promise<void> => {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        await ensureSiteAdmin(auth, db, env);
      } catch (error) {
        bootstrapPromise = undefined; // reset so next request retries
        throw error;
      }
    })();
  }
  return bootstrapPromise;
};
```

Key behaviors:

- Runs once per server start (memoized)
- Creates the site admin user if missing
- Rotates the admin password to `ADMIN_PASSWORD` on every boot
- If bootstrap fails, the promise resets so the next request retries
- Concurrent first requests share the same promise (no double-seed)

## File Serving

Files are served via `apps/web/src/routes/api/files/$.ts`:

- Route: `GET /api/files/{key}`
- No auth check — files are publicly accessible if you know the key
- Cache headers: `Cache-Control: public, max-age=31536000, immutable` (1 year)
- Storage keys are URL-decoded from the path

This means file URLs like `/api/files/admin/uuid.webp` are publicly accessible. The security model relies on:

1. UUIDs being unguessable (v4 random)
2. Only admins can create/list files (enforced by `adminProcedure` at the API layer — see [Admin-Only File Operations](#admin-only-file-operations))
