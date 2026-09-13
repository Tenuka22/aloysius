# Infrastructure Documentation

## Docker Services

`docker-compose.yml` defines four services:

| Service | Image | Port | Purpose |
| --- | --- | --- | --- |
| `web` | Built from `apps/web/Dockerfile` | `${WEB_PORT:-3001}` | Main web application (TanStack Start) |
| `turso-db` | `ghcr.io/tursodatabase/libsql-server:latest` | `${LIBSQL_PORT:-8080}` | SQLite-compatible database (libSQL) |
| `minio` | `quay.io/minio/minio:latest` | `9000` (API), `9001` (console) | S3-compatible object storage |
| `building` | Built from `apps/building/Dockerfile` | `${BUILDING_PORT:-4001}` | Secondary service (building-related) |

### Service dependencies

```
web
├── turso-db (condition: service_healthy)
└── minio (condition: service_healthy)
```

The `web` service waits for both `turso-db` and `minio` to pass health checks before starting.

### Volumes

| Volume       | Service    | Purpose                                    |
| ------------ | ---------- | ------------------------------------------ |
| `turso_data` | `turso-db` | Persists database files at `/var/lib/sqld` |
| `minio_data` | `minio`    | Persists object storage at `/data`         |

## Dev vs Production

Storage is **MinIO-only** — there is no local/dev-only backend. `bun run dev` still needs a reachable MinIO instance (`docker compose up minio`, or any S3-compatible endpoint pointed to by the `MINIO_*` env vars).

### Development (`NODE_ENV=development`)

- **Database**: Local SQLite file at `../../data/local.db` (relative to `apps/web/`), resolved via `file:` URL
- **Storage**: MinIO, same as production — point `MINIO_ENDPOINT`/`MINIO_PORT` at a local container (`docker compose up minio`) or a remote bucket
- **Docker optional for the web app itself**: run it directly with `bun run dev`, but MinIO (and libSQL, if not using the local SQLite file) still need to be up

### Production (`NODE_ENV=production`)

- **Database**: libSQL server via `http://turso-db:8080`
- **Storage**: MinIO object store at `minio:9000`
- **Docker Compose**: All services orchestrated together

`packages/storage/src/index.ts` no longer branches on `NODE_ENV`:

```ts
export const createStorage = (config: StorageConfig): Storage =>
  createMinioBackend(config);
```

There used to be an LMDB-backed local-file store selected in development, plus a `normalizeStorageKey()` helper and a `FILE_STORAGE_DIR` env var. All three were removed when storage went MinIO-only — do not reintroduce assumptions about them.

## Storage Layer

`packages/storage/src/index.ts`

### Interface

```ts
export interface Storage {
  put: (
    key: string,
    data: Buffer | Uint8Array,
    contentType: string
  ) => Promise<void>;
  get: (key: string) => Promise<StoredObject | null>;
  remove: (key: string) => Promise<void>;
  /** One-time presigned URL for direct client → S3/MinIO upload. */
  getPresignedUploadUrl: (
    key: string,
    contentType: string,
    expiresIn?: number
  ) => Promise<string>;
}
```

### MinIO Backend (dev and production)

- Uses the `minio` client (dynamically imported), lazily instantiated and memoized
- Auto-creates the bucket on first use (`bucketExists` → `makeBucket`), memoized so concurrent first calls don't race
- Bucket name from `MINIO_BUCKET` (default: `"aloysius"`)
- Content type stored as object metadata, read back via `statObject` on `get`
- `getPresignedUploadUrl` returns a `presignedPutObject` URL; the URL itself carries no `Content-Type` — the uploading client must set that header explicitly

### Key Format

Keys are not passed through any normalization helper (there is no `normalizeStorageKey()` anymore) — each caller builds its own key. The only caller today, `staff.getUploadUrl`, uses `admin/{uuid}.{extension}` (a fixed `admin/` prefix, not the uploading user's ID).

## Database

`packages/db/src/index.ts`

### Setup

- **Driver**: `@libsql/client` (libSQL/Turso)
- **ORM**: Drizzle ORM with SQLite dialect
- **Schema**: `packages/db/src/schema/`
- **Migrations**: `packages/db/src/migrations/` (managed by `drizzle-kit`)

### Schema tables

| Table          | File              | Purpose                                 |
| -------------- | ----------------- | --------------------------------------- |
| `user`         | `schema/auth.ts`  | Users with role, ban fields, timestamps |
| `session`      | `schema/auth.ts`  | Sessions with expiry, IP, user agent    |
| `account`      | `schema/auth.ts`  | OAuth/password accounts linked to users |
| `verification` | `schema/auth.ts`  | Email verification tokens               |
| `files`        | `schema/files.ts` | Uploaded file metadata                  |

### Drizzle config

`packages/db/drizzle.config.ts`:

```ts
export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || "",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

## Environment Variables

`apps/web/.env.schema` defines all variables with validation:

| Variable | Type | Default | Sensitivity | Purpose |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | `enum(development, production, test)` | `development` | — | Controls storage backend, build behavior |
| `BETTER_AUTH_SECRET` | `string(min 32)` | — | sensitive | Session signing key |
| `BETTER_AUTH_URL` | `url` | — | public | Auth endpoint base URL |
| `TURSO_DATABASE_URL` | `string(min 1)` | — | — | libSQL connection string (`file:` for local, `http:` for server) |
| `TURSO_AUTH_TOKEN` | `string` | — | — | Auth token for remote libSQL (unused for local `file:` URLs) |
| `ADMIN_EMAIL` | `email` | `admin@example.com` | public | Site admin email |
| `ADMIN_PASSWORD` | `string(min 8)` | — | sensitive | Site admin password (rotated on boot) |
| `MINIO_ENDPOINT` | `string(min 1)` | `localhost` | public | MinIO host |
| `MINIO_PORT` | `number` | `9000` | public | MinIO API port |
| `MINIO_ACCESS_KEY` | `string(min 1)` | `minioadmin` | — | MinIO credentials |
| `MINIO_SECRET_KEY` | `string(min 1)` | `minioadmin` | — | MinIO credentials |
| `MINIO_BUCKET` | `string(min 1)` | `aloysius` | public | S3 bucket name |
| `MINIO_USE_SSL` | `boolean` | `false` | public | Use HTTPS for MinIO |

### Production overrides

`apps/web/.env.production` contains Docker Compose topology values. These are **build-time placeholders** — real values come from `docker-compose.yml` environment overrides and the `.env` file.

## Running Dev Infrastructure

### Local development (no Docker)

```bash
# From project root
bun run dev
```

Uses the local SQLite file for the database, but storage is MinIO-only — start it separately (`docker compose up minio`) or point `MINIO_*` at a remote bucket before running the web app.

### Full stack with Docker

```bash
# Start all services
docker compose up

# Start specific services
docker compose up turso-db minio

# Rebuild after changes
docker compose up --build web
```

### Database migrations

```bash
# Generate migration
bunx drizzle-kit generate

# Apply migration
bunx drizzle-kit migrate
```
