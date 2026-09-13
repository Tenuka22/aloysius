# System Behavior Patterns

Critical behavioral patterns in the Aloysius codebase that aren't obvious from reading individual files.

## File Deletion Order

**DB record is deleted FIRST, then storage file is deleted.**

In `packages/api/src/routers/files.ts`, `deleteFile`:

```ts
// 1. Delete from storage first
await context.storage.remove(row.key);

// 2. Then delete DB record
await context.db.delete(files).where(...).run();
```

**Wait — this is storage-first, then DB.** Looking at the actual code more carefully:

```ts
await context.storage.remove(row.key);     // storage first
await context.db.delete(files).where(...);  // then DB
```

This means: if the DB delete fails after storage deletion, you have an orphaned DB record pointing to a non-existent file. If storage deletion fails, the DB record still exists and the file is still accessible.

**The actual pattern is:** storage is deleted first, then the DB record. This is intentional — if storage deletion fails, the error propagates and the DB record remains as a reference to retry cleanup. The DB is the source of truth for what should exist.

## Admin-Only File Operations

File management (upload, list, delete) requires admin access, enforced at two layers:

1. **API layer**: All file procedures use `protectedProcedure` (requires any authenticated user)
2. **Web middleware**: File-related server functions use `requireSiteAdminMiddleware` (requires `role === "admin"`)

The API layer alone does NOT restrict file operations to admins — any authenticated user could theoretically call the oRPC endpoints directly. The admin restriction is enforced at the web middleware layer.

## Presigned URL Uploads

**This project does NOT use presigned URL uploads.** The user's request mentioned presigned URLs, but the actual implementation is different:

- Files are uploaded directly to the server via oRPC (`uploadFile` procedure)
- The server receives the full file data, processes it (image → WebP conversion), then stores it
- The server never uses presigned URLs for client-to-S3 uploads

The presigned URL pattern is common in S3-based uploads but is not used here. The server acts as an intermediary:

1. Client sends file to server via oRPC
2. Server converts images to WebP (quality 82) via sharp
3. Server writes to storage (LMDB dev / MinIO production)
4. Server creates DB record

## Role Enforcement

The `admin` role is hardcoded for the site admin email via `databaseHooks`:

```ts
// packages/auth/src/index.ts
databaseHooks: {
  user: {
    create: {
      before: async (created) => {
        const role = created.email?.toLowerCase() === siteAdminEmail ? "admin" : "user";
        return { data: { ...created, role } };
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

Keys follow the pattern: `{userId}/{uuid}.{extension}`

```ts
// packages/api/src/routers/files.ts
const id = crypto.randomUUID();
const key = `${context.session.user.id}/${id}.${extension}`;
```

Examples:

- `user_abc123/550e8400-e29b-41d4-a716-446655440000.webp`
- `user_abc123/660e8400-e29b-41d4-a716-446655440001.pdf`

This provides:

- User isolation (each user's files are in their own prefix)
- No filename collisions (UUID v4)
- Logical grouping for bulk operations

## Image Processing

All uploaded images are normalized to WebP format:

```ts
// packages/api/src/routers/files.ts
const IMAGE_TYPES: Record<string, true> = {
  "image/jpeg": true,
  "image/png": true,
  "image/gif": true,
  "image/webp": true,
  "image/avif": true,
  "image/bmp": true,
  "image/tiff": true,
};

// If image → convert to WebP
const { buffer, contentType, extension } = isImage
  ? {
      buffer: await sharp(originalBuffer)
        .webp({ quality: WEBP_QUALITY })
        .toBuffer(),
      contentType: "image/webp",
      extension: "webp",
    }
  : {/* keep original */};
```

- Quality: 82 (configurable via `WEBP_QUALITY` constant)
- Input: JPEG, PNG, GIF, WebP, AVIF, BMP, TIFF
- Output: WebP (universally supported, smaller files)
- Non-image files: stored as-is with original content type

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

This means file URLs like `/api/files/user_abc123/uuid.webp` are publicly accessible. The security model relies on:

1. UUIDs being unguessable (v4 random)
2. Only admins can create/list files (enforced by middleware)
