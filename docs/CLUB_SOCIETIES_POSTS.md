# Clubs and club content

How the Photography Club submits content, and how a CMS reviewer publishes it.

> **Part of a pair.** The whole-system map is at [`ARCHITECTURE.md`](./ARCHITECTURE.md).

**Status:** exactly one club exists — the Photography Club, seated as `photography-admin`. The schema and API are club-scoped by a `club` column (`CLUBS = ["photography"]` in `schema/club-photos.ts`), so a second club is a second slug and a second seeded seat, not a schema change.

## The model

There is no gallery concept, no proposal/diff queue, and no per-club admin access panel. There are four flat content types, each living in its own table with the same shape:

| Table | Holds |
| --- | --- |
| `club_photo` | one photo submitted to the club's public gallery |
| `announcement` (shared with CMS-authored school announcements) | a club announcement, distinguished by its `club` column |
| `event` (shared with CMS-authored school events) | a club event, distinguished by its `club` column |
| `news_post` | a club news article |

Every row carries `status` (`pending` / `approved` / `rejected`), `submittedById`, and — once decided — `reviewedById`, `reviewedAt`, `reviewNote`. A `*_review_fields_paired` CHECK on each table makes "approved with no reviewer" and "still pending but reviewed" both unrepresentable.

**A submission _is_ the content row**, not a separate proposal that gets copied into a content table on approval. `submitPhoto` (etc.) inserts the row directly, starting `pending`. `reviewPhoto` (etc.) does one `update … set status, reviewedById, reviewedAt` call — that status flip is the entire publish step, because every public read (`listApprovedPhotos`, etc.) filters on `status = 'approved'` and nothing else sets it. There is no separate appliers module, no JSON payload blob, no base-snapshot diff, and no "the CMS can hand-edit the JSON" escape hatch — a reviewer approves or rejects the row as submitted, with an optional `reviewNote` on rejection.

Each content type has six endpoints in `packages/api/src/routers/club/`, one file per endpoint:

| Endpoint | Caller | Does |
| --- | --- | --- |
| `submit*` | club seat (`club:submit`) | insert a `pending` row for the caller's own club |
| `listMy*` | club seat (`club:read`) | the caller's own rows, all statuses, newest first — their only feedback channel |
| `withdraw*` | club seat (`club:submit`) | delete a still-`pending` row the caller submitted; once reviewed the row is history |
| `listPending*` | reviewer (`admin` or `cms`) | every `pending` row, oldest first |
| `review*` | reviewer (`admin` or `cms`) | approve or reject a pending row |
| `listApproved*` | public, no session | the public read; the only query a visitor's page calls |

## Authorisation

The club is taken from the request body's `club` field (today always `"photography"`, validated against `CLUBS`) and the account's permission is checked with Better Auth's access control (`club:read` / `club:submit`, granted to the `club-admin` role). There is no per-club ownership check beyond that, because there is exactly one club seat and `submittedById` scopes `listMy*`/`withdraw*` to it. `club_photo`, `announcement` and `event` rows all carry a plain `club` text column constrained by a `CHECK … IN ('photography')`, not a club registry table or a username-derived scope lookup.

Reviewers are `admin` or `cms` — the same `clubReviewerProcedure` used across all four content types — not a per-club CMS panel or a ban/unban/access-grant screen.

## The screens

**`club-admin/photography/`** — four independent screens, `photos.tsx`, `announcements.tsx`, `events.tsx`, `news.tsx`, each a submit form plus the caller's own list with a withdraw action on pending rows. No combined queue, no profile/account screen.

**`cms/club-photos.tsx`, `cms/club-announcements.tsx`, `cms/club-events.tsx`, `cms/club-news.tsx`** — one reviewer screen per content type: the pending list, an approve/reject action with an optional note.

**`admin/index.tsx`** — seat administration (`routers/admin-accounts.ts`): list the seeded club seats and reset a seat's password. No per-club access panel, no activity-audit feed.

## Where the code is

| Looking for | Go to |
| --- | --- |
| The four content tables | `packages/db/src/schema/club-photos.ts`, `announcements.ts`, `root-content.ts` (`event`), `news-posts.ts` |
| Every club endpoint | `packages/api/src/routers/club/` |
| The club admin screens | `apps/web/src/routes/club-admin/photography/` |
| The CMS review screens | `apps/web/src/routes/cms/club-*.tsx` |
| Seat administration | `packages/api/src/routers/admin-accounts.ts`, `apps/web/src/routes/admin/index.tsx` |
| The spec this was built from | `specs/CLUB-ARCHITECTURE/` |
