# syntax=docker/dockerfile:1

# Build context is the repo root (bun workspaces resolve `@aloysius/config`
# etc. from there) — build with:
#   docker build -f apps/building/Dockerfile -t aloysius-building .
ARG BUN_VERSION=1.4.0

########################################################################
# deps - install every workspace dependency once, from the lockfile only.
#
# Only manifests are copied here, so this layer is cache-invalidated by a
# dependency change, never by editing application source. bun's workspace
# resolver requires every member declared in bun.lock to have a package.json
# on disk, so every packages/*/package.json is copied even though building
# only depends on @aloysius/config for dev.
########################################################################
FROM oven/bun:${BUN_VERSION}-slim AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/building/package.json apps/building/
COPY apps/web/package.json apps/web/
COPY packages/api/package.json packages/api/
COPY packages/auth/package.json packages/auth/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/ui/package.json packages/ui/

RUN bun install --frozen-lockfile

########################################################################
# builder - compile the static placeholder page with Vite.
########################################################################
FROM deps AS builder
WORKDIR /app

COPY apps/building/ apps/building/

RUN cd apps/building && bun run build

########################################################################
# runner - server.ts only uses Bun/Node built-ins (node:path, Bun.serve,
# Bun.file), so the runtime image needs no node_modules at all - just the
# built assets, the server script, and a package.json for `bun run start`.
########################################################################
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app/apps/building
ENV NODE_ENV=production

COPY --from=builder /app/apps/building/dist ./dist
COPY --from=builder /app/apps/building/server.ts ./server.ts
COPY --from=builder /app/apps/building/package.json ./package.json

# `bun` (uid 1000) is the non-root user already baked into this base image.
USER bun

ENV PORT=4001
EXPOSE 4001

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||4001)+'/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "start"]
