FROM oven/bun:1 AS builder
WORKDIR /app

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache bun install

ENV NODE_ENV=production
RUN cd apps/web && bun run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app

ENV HOST=0.0.0.0
ENV PORT=4000
EXPOSE 4000

# SSR chunks require workspace dependencies at runtime
WORKDIR /app/apps/web
# Migrate, then serve. A failed migration stops the container instead of
# starting a release against the wrong schema - the same arrangement
# ../school-management uses. `migrate-deploy.mjs` uses the drizzle migrator
# directly rather than drizzle-kit, which is a devDependency and is not
# guaranteed to be present in this runtime image.
CMD ["sh", "-c", "node /app/packages/db/scripts/migrate-deploy.mjs && exec node --run start"]
