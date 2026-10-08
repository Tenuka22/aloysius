# Flat club content submission

## Goal

Support a hardcoded club with one administrator account. The club admin submits photos, announcements, events and news posts; nothing is public until a CMS reviewer (`admin` or `cms`) approves it.

## Rules

- Clubs are a hardcoded slug list (`CLUBS` in `schema/club-photos.ts`); today just `"photography"`.
- A club has exactly one admin identity: `<club-slug>-admin`, the `club-admin` role.
- There is no club membership model, no club registry row, no club profile (banner/background), and no club-member role hierarchy.
- There are four independent content types — photo, announcement, event, news post — each its own table. A submission inserts a row directly into that table with `status = 'pending'`; it is not a separate proposal copied into a content table on approval.
- A club admin may submit any of the four types only for their own club (the `club` column on the row, checked against `CLUBS`).
- CMS may approve or reject a pending row, with an optional note on rejection. There is no payload-editing escape hatch — a reviewer approves or rejects the row as submitted.
- A club admin may withdraw their own still-pending row. Once reviewed, the row is history.
- Only approved rows are returned by public queries (`listApproved*`). An approved row is therefore public to anyone, including signed-out visitors.

## Success criteria

- Photography Club is usable with `photography-admin`.
- A submission for a club other than the caller's own club is rejected.
- A reviewer can see every pending row across all four content types and approve or reject each independently.
- A withdrawn or rejected row never appears in a public read.
- A visitor who is not signed in can read every approved photo, announcement, event and news post for the club.
