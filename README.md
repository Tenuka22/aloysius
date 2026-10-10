# Aloysius

The website for St. Aloysius' College, Galle. Public pages for prospective families, news and notices, a media gallery, and three signed-in areas: a CMS for editors, an admin area for technical staff, and a per-club workspace for the people who run the societies.

Built as a Bun-workspaces monorepo. Started from [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) and diverged substantially since — the CMS, the club submission pipeline, the design token system and the second app were all added afterwards.

> **New here? Read [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) first.** It covers the whole system and, more usefully, why it is shaped the way it is. [`docs/README.md`](./docs/README.md) indexes the rest, including which documents are stale.

## The stack

|  |  |
| --- | --- |
| **Framework** | TanStack Start — SSR, file-based routes, server handlers |
| **API** | oRPC, isomorphic — the same router object serves SSR and the browser |
| **Validation** | Valibot, end to end, shared between request and response |
| **Database** | libSQL (a SQLite fork) via Drizzle ORM, remote in production |
| **Auth** | Better Auth — username and password, four roles, no OAuth |
| **Styling** | StyleX. No Tailwind |
| **Storage** | MinIO (S3-compatible) — uploads bypass the app server entirely |
| **Config** | Varlock — a typed env module generated from a schema per package |
| **Tasks** | Nx, inferring every target from the workspace `package.json` |
| **Lint/format** | Ultracite (oxlint + oxfmt). No local rule overrides |

## Getting started

```bash
bun install          # also builds API types and generates the env modules
bun run dev          # infra containers, migrations, then every app
```

Then open **http://localhost:4001**.

Ports: the site is 4001 in development and 4000 in the container, so a local dev server and a running stack never fight over a port. The placeholder app is 4003 and 4002. `BETTER_AUTH_URL` must match whichever one is actually bound.

Object storage is required even in development — `bun run dev:infra` starts it along with the database, but if you run the app directly you still need MinIO reachable at the `MINIO_*` settings.

## Two apps

`apps/web` is the site. `apps/building` is a small static "coming soon" page that occupies the college's main domain. It has no dependency on any other package here, and it exists for a reason that is not obvious from its code: a separate admissions codebase shares saved-application cookies across `aloysiuscollege.lk` and `admissions.aloysiuscollege.lk`, and something has to keep refreshing them on the apex host. The architecture document explains this properly.

## The one thing to understand

**Nobody writes to a content table directly.** CMS editors work on snapshots in `content_version`; club administrators work on JSON proposals in a review queue. Approval is the only path to a live table, and it applies the change and flips the status in one transaction. Every public query requires published state, so an unapproved draft has no row to find. The reasoning is in the architecture document, and the club pipeline in `docs/CLUB_SOCIETIES_POSTS.md`.

## Working on the design system

`packages/ui` has no runtime dependency on any other package, which is what lets it be reasoned about as a design system rather than a view layer.

- Design tokens — colour, type, space, motion, z-index — in `packages/ui/src/tokens/`. Brand colours are compile-time constants; every semantic name is a CSS custom property.
- Primitives in `packages/ui/src/components/primitives/`.
- Page components in `packages/ui/src/components/`, imported by subpath:

```tsx
import { SiteHeader } from "@aloysius/ui/components/site/site-header";
import { space } from "@aloysius/ui/tokens/tokens.stylex";
```

Define styles with `stylex.create` and apply them with `stylex.props`. Do not use `className`.

## Environment

Each package owns a `.env.schema`; Varlock generates a typed module from it at install time. **Commit the schemas, keep secrets in ignored env files.** Re-run `bun run env:generate` after changing a schema.

Bun's automatic `.env` loading is disabled in `bunfig.toml`, so Varlock is the only source of configuration.

One coupling worth knowing: `BETTER_AUTH_URL` must match the port the dev server actually binds, because Better Auth's `trustedOrigins` is derived from it. If they disagree, sign-out fails with `INVALID_ORIGIN` while sign-in still appears to work.

## Deployment

Four services in `docker-compose.yml`: the site, the database, object storage, and the placeholder app. `bun run dev:infra` starts just the two backing ones (`turso-db` and `minio`) out of the same file.

```bash
bun run docker:build    # build images
bun run docker:up       # build and start
bun run docker:logs     # tail logs
bun run docker:down     # stop
```

Real environment values come from `apps/web/.env` and the compose overrides; `.env.production` holds build-time placeholders only. See [`docs/infrastructure.md`](./docs/infrastructure.md).

## Scripts

|  |  |
| --- | --- |
| `bun run dev` | infra, migrate, then every app |
| `bun run dev:web` | just the site |
| `bun run dev:infra` | just the database and object storage |
| `bun run build` | build everything |
| `bun run check-types` | typecheck everything |
| `bun run test` | run the tests |
| `bun run check` | lint |
| `bun run fix` | lint and format |
| `bun run db:push` / `db:generate` / `db:migrate` / `db:studio` / `db:local` | database tasks |
| `bun run docker:build` / `up` / `down` / `logs` | containers |
| `bun run env:generate` | regenerate the env modules |

A pre-commit hook runs lint-staged, which formats staged files. **Nothing runs typechecking or tests automatically** — there is no CI. Run them yourself before committing anything that touches types.

## Project structure

```
aloysius/
├── apps/
│   ├── web/         the site
│   └── building/    the "coming soon" placeholder
├── packages/
│   ├── api/         oRPC routers, permission tiers, the approval appliers
│   ├── auth/        roles, permissions, credential provisioning
│   ├── config/      shared TypeScript settings (one file)
│   ├── db/          Drizzle schema — 24 tables
│   ├── storage/     MinIO behind a four-method interface
│   └── ui/          design system, page components, content constants
├── docs/            start at docs/README.md
└── specs/           the product and technical specs
```

## Known gaps

The architecture document's "Known problems" section is the honest list. The ones most likely to surprise you:

- **No CI.** Lint-staged on commit is the only automated gate.
- **Sports, houses and prefects do not render.** There is no sports data model at all, and the components for all three are unreachable from any route.
- **A club's name and slug cannot be changed.** Excluded from the submission schema as "CMS-owned", and no CMS endpoint can edit them either. A club _can_ change its own description, cover banner and section background, approval-gated, on `/club/profile`.
- **The API has no tests.** Over a hundred procedures, ten content appliers, and not one test file in the package.

## License

Private.
