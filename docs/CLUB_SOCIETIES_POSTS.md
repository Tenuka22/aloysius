# Clubs and club content

How the Photography Club submits photos, how a CMS reviewer publishes them, and how CMS staff manage announcements, events and news posts directly.

> **Part of a pair.** The whole-system map is at [`ARCHITECTURE.md`](./ARCHITECTURE.md).

**Status:** exactly one club exists - the Photography Club, seated as `photography-admin`. The schema and API are club-scoped by a `club` column on `club_photo` (`CLUBS = ["photography"]` in `schema/clubs.ts`, re-exported from `schema/club-photos.ts`), so a second club is a second slug and a second seeded seat, not a schema change.

## The model

There is no gallery concept, no proposal/diff queue, and no per-club admin access panel. A club submits exactly one content type, `club_photo`:

| Table | Holds |
| --- | --- |
| `club_photo` | one photo submitted to the club's public gallery, with an optional link to a related news post, event or achievement |

`announcement`, `event` and `news_post` used to be club-submittable content types alongside photos, each with the same submit/review shape. They aren't any more - they're CMS-direct content now, written, edited and deleted straight by CMS staff with no submit or review step. See [CMS-direct content](#cms-direct-content-announcements-events-news-posts) below.

Every `club_photo` row carries `status` (`pending` / `approved` / `rejected`), `submittedById`, and - once decided - `reviewedById`, `reviewedAt`, `reviewNote`. A `club_photo_review_fields_paired` CHECK makes "approved with no reviewer" and "still pending but reviewed" both unrepresentable.

**A submission _is_ the content row**, not a separate proposal that gets copied into a content table on approval. `submitPhoto` inserts the row directly, starting `pending`. `reviewPhoto` does one `update … set status, reviewedById, reviewedAt` call - that status flip is the entire publish step, because the public read (`listApprovedPhotos`) filters on `status = 'approved'` and nothing else sets it. There is no separate appliers module, no JSON payload blob, no base-snapshot diff, and no "the CMS can hand-edit the JSON" escape hatch - a reviewer approves or rejects the row as submitted, with an optional `reviewNote` on rejection.

Photos have seven endpoints in `packages/api/src/routers/club/`, one file per endpoint:

| Endpoint | Caller | Does |
| --- | --- | --- |
| `submitPhoto` | club seat (`club:submit`) | insert a `pending` row for the caller's own club |
| `listMyPhotos` | club seat (`club:read`) | the caller's own rows, all statuses, newest first - their only feedback channel |
| `withdrawPhoto` | club seat (`club:submit`) | delete a still-`pending` row the caller submitted; once reviewed the row is history |
| `listPendingPhotos` | reviewer (`admin` or `cms`) | every `pending` row, oldest first |
| `reviewPhoto` | reviewer (`admin` or `cms`) | approve or reject a pending row |
| `setPhotoLink` | reviewer (`admin` or `cms`) | attach or clear an optional link from a photo to one existing news post, event or achievement |
| `listApprovedPhotos` | public, no session | the public read; the only query a visitor's page calls |

## CMS-direct content: announcements, events, news posts

Announcements, events and news posts are ordinary CMS content now - no club, no queue, no approval. `packages/api/src/routers/cms/{announcements,events,news-posts}.ts` each expose the same flat shape: `listX` (public, no filtering needed since every row that exists is already live), `createX`/`updateX`/`deleteX` (`cmsProcedure` - `admin` or `cms` role only).

A created row still writes to the same `announcement`/`event`/`news_post` tables the old club-submission flow used, and still sets `status: 'approved'`, `reviewedById`, `reviewedAt` on insert - but `reviewedById` is the same user as `authorId`/`submittedById`: the CMS author stands in as their own reviewer, so the tables' existing `*_review_fields_paired` CHECKs hold without a separate approval step. `club` is `null` on every CMS-direct row; the column exists (nullable) only because the tables once served both models.

The CMS screens (`cms/announcements.tsx`, `cms/events.tsx`, `cms/news-posts.tsx`) are plain list-plus-dialog editors: a list of existing rows, an "Add" button opening a form, and Edit/Delete per row. No pending queue, no approve/reject - saving the form is the entire publish step.

## Authorisation

Photo submission is taken from the request body's `club` field (today always `"photography"`, validated against `CLUBS`) and the account's permission is checked with Better Auth's access control (`club:read` / `club:submit`, granted to the `club-admin` role). There is no per-club ownership check beyond that, because there is exactly one club seat and `submittedById` scopes `listMyPhotos`/`withdrawPhoto` to it. `club_photo` rows carry a plain `club` text column constrained by a `CHECK … IN ('photography')`, not a club registry table or a username-derived scope lookup.

Photo reviewers are `admin` or `cms` (`clubReviewerProcedure`). CMS-direct announcement/event/news-post writes use the ordinary `cmsProcedure` (same `admin`/`cms` roles) - there is no separate "club reviewer" identity for either path, just CMS staff.

## The screens

**`club-admin/photography/`** - one screen, `photos.tsx`: a submit form plus the caller's own list with a withdraw action on pending rows. `announcements.tsx`, `events.tsx` and `news.tsx` are gone - there's nothing left for a club seat to submit for those. No combined queue, no profile/account screen.

**`cms/club-photos.tsx`** - the one remaining reviewer screen: the pending photo list, an approve/reject action with an optional note, and a link picker to attach a related news post, event or achievement.

**`cms/announcements.tsx`, `cms/events.tsx`, `cms/news-posts.tsx`** - direct list/create/edit/delete screens for CMS staff, no review step. `cms/club-announcements.tsx`, `cms/club-events.tsx` and `cms/club-news.tsx` (the old per-content-type review screens) are deleted.

**`admin/index.tsx`** - seat administration (`routers/admin-accounts.ts`): list the seeded club seats and reset a seat's password. No per-club access panel, no activity-audit feed.

## Where the code is

| Looking for | Go to |
| --- | --- |
| The club-submittable photo table | `packages/db/src/schema/club-photos.ts` |
| CMS-direct announcement/event/news post tables | `packages/db/src/schema/announcements.ts`, `root-content.ts` (`event`), `news-posts.ts` |
| Every photo endpoint | `packages/api/src/routers/club/` |
| Every CMS-direct announcement/event/news-post endpoint | `packages/api/src/routers/cms/{announcements,events,news-posts}.ts` |
| The club admin screen | `apps/web/src/routes/club-admin/photography/` |
| The photo review screen | `apps/web/src/routes/cms/club-photos.tsx` |
| The CMS-direct content screens | `apps/web/src/routes/cms/{announcements,events,news-posts}.tsx` |
| Seat administration | `packages/api/src/routers/admin-accounts.ts`, `apps/web/src/routes/admin/index.tsx` |
| The spec this was originally built from | `specs/CLUB-ARCHITECTURE/` (describes the earlier four-content-type club-submission model; superseded by this document where they disagree) |
