# Infrastructure Documentation

## Docker Services

`docker-compose.yml` defines four services:

| Service | Image | Port | Purpose |
| --- | --- | --- | --- |
| `web` | Built from `apps/web/Dockerfile` | `${WEB_PORT:-4000}` | Main web application (TanStack Start) |
| `turso-db` | `ghcr.io/tursodatabase/libsql-server:latest` | `${LIBSQL_PORT:-8080}` | SQLite-compatible database (libSQL) |
| `minio` | `quay.io/minio/minio:latest` | `${MINIO_API_PORT:-4001}` (API), `${MINIO_CONSOLE_PORT:-4002}` (console) | S3-compatible object storage |
| `building` | Built from `apps/building/Dockerfile` | `${BUILDING_PORT:-4002}` | The "coming soon" placeholder on the apex domain - see below |

Containers bind even ports and dev servers odd ones, so a local dev server and a running stack never fight over a port: the site is 4001 in development and 4000 in the container; the placeholder is 4003 and 4002. MinIO's published ports break this rule on purpose: its API (4001) reuses the site's dev-server number and its console (4002) reuses the placeholder's container number. MinIO has no dev-server equivalent in this scheme and local development still reaches it through `docker-compose.dev.yml`'s own 9000/9001, not these - but running `bun run dev` (site or placeholder) alongside a local `docker compose up` of the production stack will collide on 4001 or 4002.

`building` is a standalone static app with **no dependency on any other package in this repo**. It duplicates the crest and hardcodes the three brand colours so it can be built and deployed independently. It exists for a non-obvious reason: a separate admissions codebase shares saved-application cookies across `aloysiuscollege.lk` and `admissions.aloysiuscollege.lk` by rewriting them on every page view, and once the admissions portal no longer occupies the apex host, something has to keep doing that or a visitor's cookie stays scoped to the wrong host. The placeholder does exactly that and nothing else.

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

- **Database**: the `TURSO_DATABASE_URL` from the env schema — in development that is a `libsql://` URL from `turso dev`; in the compose setup it is the `turso-db` service. There is no `data/local.db` or `.data/local.db` — those paths appeared in three different documents and none of them matched the code. Both directories have been deleted.
- **Storage**: MinIO, same as production — point `MINIO_ENDPOINT`/`MINIO_PORT` at a local container (`docker compose up minio`) or a remote bucket
- **Docker optional for the web app itself**: run it directly with `bun run dev`, but MinIO (and libSQL) still need to be up
- **Ports**: the dev server is 4001 and the container is 4000; the placeholder is 4003 and 4002. `BETTER_AUTH_URL` must match whichever is bound, because `trustedOrigins` is derived from it.

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
}
```

### MinIO Backend (dev and production)

- Uses the `minio` client (dynamically imported), lazily instantiated and memoized
- Auto-creates the bucket on first use (`bucketExists` → `makeBucket`), memoized so concurrent first calls don't race
- Bucket name from `MINIO_BUCKET` (default: `"aloysius"`)
- Content type stored as object metadata, read back via `statObject` on `get`
- **There is no presigned upload.** `getPresignedUploadUrl` was removed: it required MinIO to be reachable _from the browser_, which it is not (`minio:9000` is a compose-network address and the port is not published). The browser PUTs to `/api/files/<key>` on this app instead, and that route holds the credentials — the same arrangement `/api/files/<key>` already used to serve every image back out. In `docker-compose.yml` MinIO publishes no ports at all; in `docker-compose.dev.yml` it binds `127.0.0.1` only, because the dev server runs on the host.

### Key Format

Keys are not passed through any normalization helper (there is no `normalizeStorageKey()` anymore) — each caller builds its own key. The only caller today, `files.getUploadUrl`, uses `admin/{uuid}.{extension}` (a fixed `admin/` prefix, not the uploading user's ID), and `PUT /api/files/$` refuses any key outside that pattern.

## Database

`packages/db/src/index.ts`

### Setup

- **Driver**: `@libsql/client` (libSQL/Turso)
- **ORM**: Drizzle ORM with SQLite dialect
- **Schema**: `packages/db/src/schema/`
- **Migrations**: `packages/db/src/migrations/` (managed by `drizzle-kit`)

### Schema tables

Thirteen tables across ten schema files (three of which, `brand.ts`, `primitives.ts` and `clubs.ts`, define no tables - `clubs.ts` just holds the shared `CLUBS` constant). Grouped by what they are for:

| Group | Tables | Files |
| --- | --- | --- |
| Identity and account audit | `user`, `session`, `account`, `verification`, `account_audit_log` | `schema/auth.ts` |
| Assets | `files` | `schema/files.ts` |
| CMS | `content_version` | `schema/cms.ts` |
| School-wide-only content (no public caller today) | `person`, `achievement` | `schema/root-content.ts` |
| CMS-direct content (`status` gates the row, but every row today is CMS-authored and starts `approved`; `club` is a nullable leftover column, unused) | `announcement`, `event`, `news_post` | `schema/announcements.ts`, `schema/root-content.ts`, `schema/news-posts.ts` |
| Club-submitted content | `club_photo` | `schema/club-photos.ts` |

Every id is a branded type (`Brand<string, "XId">`) rather than `string`, and every content table's public visibility is gated on a `publishedAt` timestamp or a `status` column. For what each table is for, see the "Data" section of [`ARCHITECTURE.md`](./ARCHITECTURE.md).

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

## Environment variables

`apps/web/.env.schema` defines all variables with validation, and Varlock code-generates a typed module from it at install time. Twelve variables:

| Variable | Type | Default | Sensitivity | Purpose |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | `enum(development, production, test)` | `development` | public | Build and runtime behaviour |
| `BETTER_AUTH_SECRET` | `string(min 32)` | — | sensitive | Session signing key |
| `BETTER_AUTH_URL` | `url` | — | public | Auth base URL. `trustedOrigins` is derived from it, so it must match the port the dev server actually binds |
| `TURSO_DATABASE_URL` | `string(min 1)` | — | — | libSQL connection string |
| `TURSO_AUTH_TOKEN` | `string` (optional) | — | sensitive | Auth token for remote libSQL |
| `CMS_USERNAME` | `string(min 1)` | `cms` | public | The CMS editor account, seeded on boot |
| `CMS_PASSWORD` | `string(min 8)` | — | sensitive | Re-rotated to this on every server start |
| `MINIO_ENDPOINT` | `string(min 1)` | `localhost` | public | MinIO host |
| `MINIO_PORT` | `number` | `9000` | public | MinIO API port |
| `MINIO_ACCESS_KEY` | `string(min 1)` | `minioadmin` | sensitive | MinIO credentials |
| `MINIO_SECRET_KEY` | `string(min 1)` | `minioadmin` | sensitive | MinIO credentials |
| `MINIO_BUCKET` | `string(min 1)` | `aloysius` | public | S3 bucket name |
| `MINIO_USE_SSL` | `boolean` | `false` | public | Use HTTPS for MinIO |

There is no `ADMIN_EMAIL` or `ADMIN_PASSWORD`. An earlier version of this table listed both; neither has existed for some time. There is one editor account and it is `cms`, not a site admin.

## Environment variables

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
