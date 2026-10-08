# Handover: Club Admin Surface

## What happened

The Photography Club admin portal was replaced wholesale, ported over from `aloysius-web`. The old model — galleries with cover/banner/trending image roles, a gallery-link graph, club events/achievements, and a proposal-queue-plus-diff-review CMS flow (`submission-diff`, `club_content_submission` / `global_content_submission`, `adminClubs.approve`) — is gone. Every route, component and schema file that implemented it (`club-admin/photography/{galleries,galleries.$galleryId,achievements,submissions,profile,account}.tsx`, `CoverPanel.tsx`, `cms/clubs.tsx` + `submission-diff.tsx`, `admin/clubs*.tsx`, `club-access-panel.tsx`, `activity-table.tsx`, the `club/{announcements,events,galleries,achievements}-table.tsx` components, `pending-list.tsx`, `gallery-images-table.tsx`, `page-parts.tsx`, `gallery-roles.ts`, `use-stored-image.ts`, and the gallery/approvals/activity schema files) was deleted.

In its place is a flatter per-content-type model: four content types — **photo**, **announcement**, **event**, **news post** — each with its own table (`club_photo`, `announcement`, `event`, `news_post`), its own four endpoints (`submit*` / `listMy*` / `withdraw*` / `review*`, plus `listApproved*` for the public read), and its own screen. There is no proposal/diff/JSON-payload layer: a submission is a real row in the content table itself, starting `status = 'pending'`, and review is a direct `approved`/`rejected` status flip on that same row — not a separate write to a separate live table.

## Current routes under `club-admin/photography/`

| File | What it does |
| --- | --- |
| `photography.tsx` | Layout route. Guards the session (must be the hardcoded `photography-admin` seat), renders the `WorkspaceShell`, and lists the four flat sections in the sidebar. |
| `photography/index.tsx` | Redirects to `photography/photos`. |
| `photography/photos.tsx` | Upload a photo (batch file upload + caption/alt text/optional album URL), submit it to the queue, list the submitter's own photos with status, withdraw a pending one. |
| `photography/announcements.tsx` | Submit/list-my/withdraw for club announcements. |
| `photography/events.tsx` | Submit/list-my/withdraw for club events. |
| `photography/news.tsx` | Submit/list-my/withdraw for club news posts. |

Each of the four screens is independent: there is no combined "my submissions" queue and no club-profile/account screen any more (no cover banner, no section background, no password-rotation screen under `club-admin/`). The review side is the mirror image, one CMS route per content type (`cms/club-photos.tsx`, `cms/club-announcements.tsx`, `cms/club-events.tsx`, `cms/club-news.tsx`), each listing pending rows and approving/rejecting with a status write (`club.review*`). Seat/password administration lives under `admin/index.tsx`, backed by `routers/admin-accounts.ts` — there is no per-club access panel or activity-audit table any more.

The API surface for all of this is `packages/api/src/routers/club/` (flat: `submit-photo.ts`, `review-photo.ts`, etc., one file per endpoint, no `clubs/` subsystem of appliers/payloads/link-targets).

## Pending tasks

None carried forward. The prior "Pending Tasks & Recommended Next Steps" section in this file described a gallery-detail image-grid refinement (`galleries.$galleryId.tsx`) that no longer exists — that route and the gallery concept it belonged to were removed in this port, so the task is moot rather than outstanding.
