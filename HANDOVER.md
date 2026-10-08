# Handover: Club Admin Surface

## What happened

The Photography Club admin portal was replaced wholesale, ported over from `aloysius-web`. The old model — galleries with cover/banner/trending image roles, a gallery-link graph, club events/achievements, and a proposal-queue-plus-diff-review CMS flow (`submission-diff`, `club_content_submission` / `global_content_submission`, `adminClubs.approve`) — is gone. Every route, component and schema file that implemented it (`club-admin/photography/{galleries,galleries.$galleryId,achievements,submissions,profile,account}.tsx`, `CoverPanel.tsx`, `cms/clubs.tsx` + `submission-diff.tsx`, `admin/clubs*.tsx`, `club-access-panel.tsx`, `activity-table.tsx`, the `club/{announcements,events,galleries,achievements}-table.tsx` components, `pending-list.tsx`, `gallery-images-table.tsx`, `page-parts.tsx`, `gallery-roles.ts`, `use-stored-image.ts`, and the gallery/approvals/activity schema files) was deleted.

In its place is a flatter per-content-type model, which has since narrowed further: `club_photo` is the only content type a club seat still submits. `announcement`, `event` and `news_post` started as club-submittable alongside it, but are now **CMS-direct content** — created, edited and deleted straight by CMS staff (`packages/api/src/routers/cms/{announcements,events,news-posts}.ts`), live the instant they are saved, with no submit/review step at all. Only `club_photo` keeps the submit-then-review shape: `submit*`/`listMy*`/`withdraw*` for the submitter, `listPending*`/`review*` for the reviewer, `listApproved*` for the public read, a row starting `status = 'pending'` and review a direct `approved`/`rejected` flip on that same row.

## Current routes under `club-admin/photography/`

| File | What it does |
| --- | --- |
| `photography.tsx` | Layout route. Guards the session (must be the hardcoded `photography-admin` seat), renders the `WorkspaceShell`, and lists the sidebar — now just one section. |
| `photography/index.tsx` | Redirects to `photography/photos`. |
| `photography/photos.tsx` | Upload a photo (batch file upload + caption/alt text/optional album URL), submit it to the queue, list the submitter's own photos with status, withdraw a pending one. |

`photography/announcements.tsx`, `photography/events.tsx` and `photography/news.tsx` are gone — announcements, events and news posts are CMS-direct content now (see below), so there is nothing left for a club seat to submit for them. The photography-admin seat's whole surface is one screen: submit a photo, see its own queue, withdraw a pending one. No combined "my submissions" view and no club-profile/account screen (no cover banner, no section background, no password-rotation screen under `club-admin/`).

The review side has narrowed to match: `cms/club-photos.tsx` is the only review screen left, listing pending photos and approving/rejecting with a status write (`club.review*`), plus an optional "related content" link to a news post, event or achievement (`club.setPhotoLink`). `cms/club-announcements.tsx`, `cms/club-events.tsx` and `cms/club-news.tsx` (the old per-content-type review screens) are deleted; in their place `cms/announcements.tsx`, `cms/events.tsx` and `cms/news-posts.tsx` are plain list-plus-create-plus-edit-plus-delete screens with no review step — a row is live the moment CMS staff save it. Seat/password administration lives under `admin/index.tsx`, backed by `routers/admin-accounts.ts` — there is no per-club access panel or activity-audit table any more.

The API surface is split along the same line: `packages/api/src/routers/club/` is photo-only now (`submit-photo.ts`, `review-photo.ts`, `set-photo-link.ts`, etc., one file per endpoint). Announcements, events and news posts moved to `packages/api/src/routers/cms/{announcements,events,news-posts}.ts`, each a flat `listX`/`createX`/`updateX`/`deleteX` set gated by `cmsProcedure` (`admin`/`cms` roles) for the writes and public for the read.

## Pending tasks

None carried forward. The prior "Pending Tasks & Recommended Next Steps" section in this file described a gallery-detail image-grid refinement (`galleries.$galleryId.tsx`) that no longer exists — that route and the gallery concept it belonged to were removed in this port, so the task is moot rather than outstanding.
