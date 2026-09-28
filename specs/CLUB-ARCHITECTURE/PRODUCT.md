# Single-admin club content

## Goal

Support hardcoded clubs with one administrator account per club. Club admins create club-owned galleries, events, and announcements; nothing becomes public until CMS review approves it.

A club's _identity_ — its name, its web address, its cover banner — is separate from the content it publishes, and only the second half is approval-gated in the way the rest of this spec describes.

## Rules

- Club definitions are hardcoded in the backend.
- A club has exactly one admin identity: `<club-slug>-admin`.
- There is no club membership model and no club-member role hierarchy.
- A club admin may submit profile, gallery, gallery-image, event, and announcement changes only for their own club.
- The club is resolved from the signed-in username on every request. No submission endpoint accepts a `clubId` from the client, so there is no field to get wrong.
- A club may change its own description, cover banner and section background. It may not change its name or slug.
- An event holds **no images of its own** except a single cover. Everything else about an event is a gallery attached to it through `gallery_link`.
- A gallery may be linked to the caller's own club events and achievements as well as to school-wide ones.
- CMS may edit a pending payload, approve it, reject it, or ban the club admin.
- Banned admins cannot create, edit, or submit content until an administrator unbans them.
- Only approved content is returned by public queries. An approved gallery is therefore public to anyone, including signed-out visitors.

## Success criteria

- Photography Club is usable with `photography-admin`.
- A request from another club admin cannot target Photography Club.
- A banned club admin receives `FORBIDDEN` for every club-content submission.
- CMS approval remains the only path from pending content to public content.
- A club admin can set a cover banner on `/club/profile` and see it on `/students` once approved; and can remove it again.
- A club can create an event, then link one of its galleries to that event, and the event's photographs appear on the event's page at `/events`.
- A visitor who is not signed in can open `/galleries/:slug` and follow the gallery's off-site album link.
