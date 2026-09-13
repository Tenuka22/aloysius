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

### Development (`NODE_ENV=development`)

- **Database**: Local SQLite file at `../../data/local.db` (relative to `apps/web/`), resolved via `file:` URL
- **Storage**: LMDB-backed local file store at `FILE_STORAGE_DIR` (default: `../../data`)
- **No Docker needed**: Run the web app directly with `bun run dev`

### Production (`NODE_ENV=production`)

- **Database**: libSQL server via `http://turso-db:8080`
- **Storage**: MinIO object store at `minio:9000`
- **Docker Compose**: All services orchestrated together

The storage backend is selected automatically in `packages/storage/src/index.ts`:

```ts
export const createStorage = (config: StorageConfig): Storage =>
  config.NODE_ENV === "production"
    ? createMinioBackend(config)
    : createLmdbBackend(config.FILE_STORAGE_DIR);
```

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
}
```

### LMDB Backend (Development)

- Uses `lmdb` (native binding, dynamically imported)
- Data stored at `FILE_STORAGE_DIR/files.mdb`
- Two prefixes: `d:` for data, `m:` for metadata (content type)
- 4GB map size limit
- Keys normalized with POSIX rules (no OS-specific path issues)

### MinIO Backend (Production)

- Uses `minio` client (dynamically imported)
- Auto-creates bucket on first use
- Bucket name from `MINIO_BUCKET` (default: `"aloysius"`)
- Content type stored as object metadata

### Key Normalization

All storage keys go through `normalizeStorageKey()`:

- POSIX path normalization (no `\` conversion)
- Rejects absolute paths and `..` traversal
- Format: `{userId}/{uuid}.{extension}`

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
| `FILE_STORAGE_DIR` | `string(min 1)` | `../../data` | — | LMDB storage directory (dev only) |
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

Uses local SQLite file and LMDB storage. No external services needed.

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
