# Single-admin club content implementation

- Keep club definitions in the API as a typed constant (`routers/clubs/config.ts`). The `club` table row is a presentation record seeded from that constant; the constant remains the authority on which clubs exist and who administers them.
- Keep authentication users in the existing Better Auth `user` table, but identify a club admin by the hardcoded username and the `club-admin` role.
- Remove the `club_member` schema and all membership joins.
- Add one authorization helper that resolves a club definition, checks the session username against its admin username, and checks `user.banned`. Call it `ownClubScope`; it returns the club id so no caller has to pass one.
- Mount public and submission club routers in the application router.
- Keep club and global submission tables as the CMS review boundary. Ban/unban updates the existing user ban fields; pending content remains auditable and cannot be submitted to again while banned.

## Images

- A club's cover banner and section background live on the `club` row as `files` references, and are edited through the existing `club_content_submission` target `"club"` — so a banner is approval-gated like everything else a club writes. `clubUpdatePayloadSchema` makes the image fields _nullable_ rather than merely optional, which is what distinguishes "remove the banner" from "leave it alone".
- `applyClub` inserts the registry row if it is missing, seeded from `HARDCODED_CLUBS`. Without this an approved banner could be applied to zero rows and still be marked approved.
- `routers/clubs/file-urls.ts` is the one place a `fileId` becomes a URL. The extension lives in the storage key, so a client cannot build the URL itself.

## Galleries and events

- `gallery_link` gains `clubEvent` and `clubAchievement` targets alongside `person`, `event`, `achievement` and `exhibition`. They are separate values rather than extensions of `event`/`achievement` because `club_event` and `club_achievement` are separate tables with separate ownership.
- `routers/clubs/link-targets.ts` holds `LINK_TARGET_RESOLVERS`, the single map the submit handler, the applier and the club's own screen all read. Adding a target to `GALLERY_LINK_TARGETS` without a resolver is a runtime error naming the target.
- Resolvers and appliers take `DbLike` (root handle _or_ transaction) from `routers/clubs/db.ts`; they are called from inside the approval transaction and a `Database`-only signature will not accept one.
- `listMyLinkTargets` exists because a club must be able to name its own event _before_ that event is approved. `listClubEvents` only returns published, upcoming events, so using it as the picker's source would leave a club unable to attach photographs to the very event it is waiting on.
- `getGallery` returns everything one gallery page needs in a single call: detail row, items with resolved URLs, owning club, album link, and outbound links with target titles resolved. It is a `publicProcedure` with no per-viewer check — approval is the access control.
