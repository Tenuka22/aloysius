# Clubs, Societies and Sports

A deep dive on the club system: how a club administrator proposes a change, how a CMS editor reviews it, and what stops any of it being published without review.

> **Part of a pair.** This is the detail on one subsystem. The whole-system map is at [`ARCHITECTURE.md`](./ARCHITECTURE.md). The short product and technical spec this was built from is at `specs/CLUB-ARCHITECTURE/`.

**Status:** exactly one club exists — the Photography Club. Every example here uses it. The schema and the API are multi-club throughout; the registry is a one-element array.

**Status:** sports do not exist. Not a table, not a schema, not an endpoint, not an editable field. [The last section](#sports) covers what is there and what building it would take.

---

## Contents

- [The problem this solves](#the-problem-this-solves)
- [Clubs are identities, not accounts](#clubs-are-identities-not-accounts)
- [A club's own picture](#a-clubs-own-picture)
- [Events hold no images, only galleries](#events-hold-no-images-only-galleries)
- [The two queues](#the-two-queues)
- [What a club may and may not touch](#what-a-club-may-and-may-not-touch)
- [The review](#the-review)
- [What makes the queue pleasant to work with](#what-makes-the-queue-pleasant-to-work-with)
- [How the public site sees the result](#how-the-public-site-sees-the-result)
- [Provisioning a club](#provisioning-a-club)
- [The screens](#the-screens)
- [Sports](#sports)
- [Bugs and gaps](#bugs-and-gaps)
- [Where the code is](#where-the-code-is)

---

## The problem this solves

The obvious way to build this would be to give club officers accounts and let them edit their own club's rows. The problem with that is that a photograph a sixteen-year-old uploads is immediately and permanently public, on the front page, with no chance to catch a mistake.

So the club system has exactly one rule, and everything else follows from it:

> **A club admin never writes to a content table. They write a proposal, and a CMS editor decides whether it becomes real.**

That means fifteen endpoints that do nothing but insert a row, and one function that is the only code in the repository allowed to touch live content.

It also means a fact worth being precise about: **a club is a registry row created by the CMS, not by the club.** A club cannot create itself, delete itself, or change its own name. What it can change is its description and its two images. Everything else about a club's identity is CMS-owned.

## Clubs are identities, not accounts

There is no membership model. No member list, no roles inside a club, no "president" or "secretary". Each club has exactly one administrator account, and the way the system knows which club an account administers is by its **username**.

The convention is that the administrator's username is the club's slug plus `-admin`. So:

|                        |                     |
| ---------------------- | ------------------- |
| Club id                | `club-photography`  |
| Club slug              | `photography`       |
| Club name              | Photography Club    |
| Administrator username | `photography-admin` |

That convention is the whole authorisation model. When a request comes in, the server looks at the session's username, scans the registry for a club whose administrator username matches, and binds the request to that club. **There is no `?club=` parameter anywhere in the club endpoints.**

This is the single most important design decision in the subsystem, so it is worth being explicit about what it prevents. If a club-admin screen sent `?club=photography` to the server and the server trusted it, then anyone who could change that parameter could submit content for any club. Every screen that creates or edits something takes either nothing at all or an id from which the club is derived — a gallery id, whose owner the server reads and then verifies. The comment in the code says exactly this, and it is why the two-generation split in the endpoint list below exists at all.

The registry lives in one typed constant in the API. It is a plain array, and everything scans it rather than indexing it, so adding a club is a one-line change with nothing else to update.

There is a second, subtler reason for the username convention. Better Auth's default username validator **rejects hyphens**, and it enforces that at sign-in rather than at creation. Every club administrator username is hyphenated by construction, so with the default in place the accounts would be created happily and then be permanently unable to sign in, with nothing in the database to explain why. That happened once. The rule now lives in one file with a comment explaining it, and there is a test that fails if anyone reverts it.

## A club's own picture

A club's **identity** and a club's **content** are separate halves of this system, and only the second is approval-gated in the way the rest of this document describes.

The set of clubs is the hardcoded registry in `clubs/config.ts` and stays that way. But a club row also carries a **cover banner** — the wide image shown across the top of the club on the students page — and a **section background** behind the whole block. A club administrator sets both, and both go through the ordinary review queue as target `"club"` in `club_content_submission`. A banner is a thing a club chose to represent itself, so a CMS editor sees it before it is public, exactly as they would see a gallery.

What a club still cannot change is its **name** and its **slug**. Both are excluded from the submission schema because approved content references them, and neither has a CMS endpoint. See [Bugs and gaps](#bugs-and-gaps).

**Three details that are easy to get wrong, and expensive to get wrong visibly:**

- _A banner can be removed._ `clubUpdatePayloadSchema` makes the image fields **nullable** rather than merely optional. `undefined` means "leave this alone"; `null` means "take the banner down". Without that distinction a club could put a banner up and never replace or remove it, which is the same as not being able to change it at all.
- _The row might not exist yet._ The `club` registry row is otherwise only written the first time an administrator's credentials are issued. `applyClub` now inserts it from the hardcoded constant if it is missing, so an approved banner cannot be applied to zero rows and still be marked approved.
- _A `fileId` is not a URL._ The file extension lives in the storage key, so a client cannot build the address from the id. `clubs/file-urls.ts` is the one place that turns a `fileId` into a URL, and both the public club query and the club's own screen go through it.

A club with no banner is the normal case, not an error. The card on `/students` renders no image box at all rather than a placeholder, so the grid stays tidy until banners exist.

## Events hold no images, only galleries

An event has exactly one image: its cover. Everything else about it — the photographs, the video, the scans — is a **gallery that somebody curates**, attached through `gallery_link`. This is a deliberate split, and it has two consequences worth knowing before you touch this area.

**A club can now link a gallery to its own event.** `gallery_link.target` gained `clubEvent` and `clubAchievement` alongside `person`, `event`, `achievement` and `exhibition`. They are separate values rather than extensions of `event` and `achievement` because `club_event` and `club_achievement` are separate tables with separate ownership — a club event is written by a club through the club queue, a school event is CMS-authored global content.

Before this, the natural link could not be expressed at all: a club could propose an event, photograph it, and had nowhere to point the photographs. The event's page had to ask "which galleries link to me?" to know whether it had any at all.

**A club's own event has to be selectable before it is approved.** The picker on a gallery reads `listMyLinkTargets`, not `listClubEvents`. That is not a shortcut: `listClubEvents` only returns events that are _both_ published _and_ still upcoming, so a club waiting on review of the event it is trying to attach photographs to would find nothing to choose. A link and the event it names are reviewed independently and the link may well be reviewed first, so the picker has to be able to name a row that does not exist publicly yet.

Because an event holds no images, **the events page is built entirely out of links.** `/events` merges club events and school events into one date-ordered list; each club event arrives with its linked galleries already resolved in the same query. An event with no linked gallery is a perfectly legitimate thing to publish — the inter-house cross-country run does not need a gallery to have happened — so the page renders one without photographs rather than treating the empty state as a fault.

## The two queues

Proposals go into one of two tables. They are near-identical and differ in scope.

**`club_content_submission`** holds proposals about a club's own content: its profile, its events, its announcements, its achievements. It has a `clubId` column that is not nullable and cascades on club deletion, because club content has exactly one owner and a proposal can never be moved between clubs.

**`global_content_submission`** holds proposals about site-wide content: galleries, gallery images, gallery links, and creations of people, events and achievements. It has no `clubId` — instead an optional `submittedByClubId`, for the audit trail and for scoping the review queue. Null means a CMS editor submitted it directly.

Both tables carry the same shape:

| Column | Meaning |
| --- | --- |
| `target` | what kind of thing — `gallery`, `clubEvent`, `galleryItem`, … |
| `targetId` | which existing row, or null for a creation |
| `operation` | `create`, `update`, or `delete` |
| `payload` | JSON, shaped by a schema per target |
| `baseSnapshot` | JSON, the live row as it was at submit time |
| `status` | `pending`, `approved`, `rejected`, or `withdrawn` |
| `submittedById` | who proposed it |
| `reviewedById`, `reviewedAt`, `reviewNote` | who decided, when, and why |

**Why the payload is a JSON blob on a queue row rather than columns on the content table.** Because the live table only ever holds approved state. "The club changed the cover image" and "the CMS approved the new cover image" become two rows with two timestamps, and the re-approval requirement becomes enforceable: the live row is untouched until a reviewer acts.

## What a club may and may not touch

Fifteen submit endpoints. The rules they encode:

| Target | Club may | Club may not |
| --- | --- | --- |
| Its own profile | Edit description and images | Change its name or slug |
| Its own events | Create, edit, delete | — |
| Its own announcements | Create, edit, delete | — |
| Its own achievements | Create | — |
| Its own galleries | Create, edit, delete | Touch a gallery with no owner |
| Images in its own galleries | Add, edit, delete, propose cover/banner/trending | — |
| Gallery links from its galleries | Create | Link to a target that does not exist |
| School-wide people, events, achievements | **Create only** | Update or delete anything |
| School-wide announcements | **Nothing** | Anything at all |

Three of those deserve comment.

**Galleries are global, and that is the point.** A gallery is addressable from the homepage and any page. But it carries an owner club, and that records a _curation right_, not ownership. The Photography Club curates the photo galleries. Because every write still goes through a proposal, a club can never publish to a global gallery on its own. This is the only global-scope table a club is allowed to drive, and the comment in the schema says so.

**A gallery with no owner is not a club's to touch.** If the owner is null the gallery is CMS-authored — an art gallery run by a teacher, say. The ownership check fails explicitly rather than quietly letting any club admin submit against it.

**A club can propose promoting its own photograph to the homepage.** That is how an image reaches the front page, and it is the same proposal as any other: the cover flag and the trending flag are not written until a reviewer approves. A club cannot put its own shot on the homepage.

There is one more asymmetry that is easy to miss. Root-level `person`, `event` and `achievement` have **create** endpoints but no update or delete. A club can propose adding a school-wide record, and then that record belongs to the school.

## The review

Everything converges on `adminClubs.approve`, which does this:

1. Re-read the proposal with `status = 'pending'`, immediately before acting.
2. Open a database transaction.
3. Run the matching applier — write the change to the live content table.
4. Set the proposal's status to `approved`, with the reviewer's id and the time.
5. Commit.

Re-reading at step 1 means a double-click, or two reviewers clicking at the same moment, cannot apply anything twice. Doing steps 3 and 4 in one transaction means a failed content write leaves the proposal `pending` rather than half-applied. There is no state in which the content changed but the proposal says it did not.

**The appliers are the only code in the repository that writes to a live content table.** There are ten of them, one per target, dispatched through an object literal keyed by the proposal's target — so an unrecognised target is a compile error rather than a runtime surprise.

Two rules govern all ten:

**Partial updates patch; they do not replace.** A proposal to fix a caption must not blank the alt text. Every applier spreads the payload over the existing row, and the database layer skips absent values in a partial update.

**Payloads are re-validated at approval.** The same schema that validated the request on the way in parses the stored JSON on the way out. A proposal that was valid when submitted cannot be applied in a shape the tables do not expect — and an editor's hand-edit of the JSON is validated before it can reach a live row.

**Database constraints are the last line of defence, and their failures are translated.** Two approved proposals can race, because each is a separate reviewer action. So the schema enforces the rules that must hold no matter what: one cover per gallery, one banner per gallery, at most five trending images per gallery ranked 1 to 5, a trending image always has a rank and a non-trending image never does, an event cannot end before it starts, an event slug is unique within its club, a club announcement's window is ordered.

When one of those rejects an otherwise valid approval, the error is caught and re-thrown with the constraint's name turned into a sentence the editor can act on:

> "That gallery already has a cover image. Clear the current cover first, or reject the competing pending submission."

> "That trending slot is already taken in this gallery. Trending items are capped at five per gallery."

There is one structural detail that looks like a bug and is not. When a club proposes a gallery link, the gallery the link belongs to travels **inside the payload**, not in the proposal's `targetId`. A database check requires that a creation carries no target id, because a row that does not exist yet has no id. Putting the gallery id in `targetId` — which is the obvious thing to do — made every gallery link fail its own constraint.

## What makes the queue pleasant to work with

**Re-submitting supersedes.** If a club proposes a change to the same target twice, the second replaces the first. A reviewer never sees two competing versions of the same edit, and the club's most recent intent is the one being reviewed. This is enforced by a partial unique index rather than by application code.

For _creations_ there is an application-level rule as well, because a creation has no target id and so cannot collide in the index. When a club proposes a new club event, any earlier pending proposal for a new club event is withdrawn. The effect is that a club cannot leave three competing "new gallery" proposals for a reviewer to choose between — while still being able to queue five new images at once, which is normal, because a gallery is uploaded as a batch.

**Every proposal stores a snapshot of the live row as it was at submit time.** The review screen diffs the proposal against that snapshot to show a genuine before-and-after, without re-deriving what "live" meant when the club pressed submit. This is the only reason the review UI can be a diff rather than a raw JSON dump.

**The editor can fix the proposal before approving it.** The review screen has a raw JSON area. This is a deliberate escape hatch — the club used a bad slug, the editor corrects it — and it is safe because of the re-validation above.

**Rejection is non-destructive and asks for a reason.** Rejecting sets the status, the reviewer, the time and a note, and touches nothing else. The live row is untouched. The note is guidance for the resubmission, capped at a thousand characters. But note the limitation: there is no endpoint to list _decided_ submissions, so a club admin cannot see their own history or what the reviewer told them. The submissions screen says so on-screen rather than pretending.

**Submission can be withdrawn,** but only by whoever submitted it and only while it is still pending. Once reviewed the row is history.

## How the public site sees the result

Nothing a club submits is visible until approval, and that is enforced in the queries rather than remembered in a helper. Every public read in the club router filters for published state: `status = 'published'` for galleries, a non-null `publishedAt` for events and announcements.

The comment at the top of the public-read file makes the argument better than it could be made here: an unapproved draft has no published row to find, so there is no code path in that file that can leak one. That is a stronger guarantee than "we remember to check".

**Announcements are the interesting public read.** A club announcement that references a school-wide one appears as its own entry with a link, rather than being merged into it. The reasoning is in the code: they are separate editorial statements — the club's own wording plus a reference to the school's — so collapsing them would hide which words the club chose. A club can therefore amplify a school notice in its own voice, and a reader can see whose words they are.

**Featured media is what the homepage shows.** One cover image per gallery, plus a single trending strip. The five-image trending cap is applied twice on purpose: the database caps trending images per gallery at five, and the homepage query additionally caps the union across all of a club's galleries at five, because the homepage shows one strip rather than one per gallery.

**Images declare what they are for.** Every image in a gallery has a role — `cover`, `banner` or `item` — which is really a declaration of what crop it is composed for, because the same photograph is asked to do three incompatible jobs: represent the gallery in a list, span the top of a gallery page, and sit in a masonry grid. The role is a column rather than something the renderer guesses from context, and the `isCover` boolean is derived from the role so there is one way to say "this is the cover" rather than two that can disagree.

**An approved gallery is open to anyone.** `getGallery` is a `publicProcedure` with no per-viewer check and no club scoping, and that is the intended design rather than an oversight. A gallery only has a row to find once a reviewer has approved it, so **the approval is the access control**. Putting a sign-in prompt in front of it would not hide anything a visitor should not see; it would only stop a parent browsing the photographs from their own kitchen.

The route is `/galleries/:slug`, not `/clubs/:club/galleries/:slug`, because a gallery is global content that happens to have a curator. A gallery with no club attached — a teacher's art show — still needs an address, and a club-scoped path would have to invent a club for it.

**The off-site album link is the most useful thing on a gallery page.** A club's best photographs are usually too many and too large to host here, which is why `gallery` carries `albumUrl` and `albumLabel` — a bare link to a Facebook album or Flickr set rather than a stored copy of someone else's page. It is rendered as visible link text, not an icon, it opens in a new tab with `rel="noopener"`, and it sits _above_ the images rather than below them: putting it last would mean scrolling past twenty images a visitor cannot use to find it.

`listGalleriesForTarget` is the inverse question — "which galleries are of this thing" — and is what an event or achievement page calls to discover it has any photographs at all. It excludes archived galleries even though a link to one may survive, so a withdrawn album stops appearing while the link row is kept in order to be cleared rather than silently orphaned.

## Provisioning a club

There is no seed script. A club's database row and administrator account are created **lazily, the first time credentials are issued** for it.

That is slightly odd but it means the hardcoded registry is genuinely the only place a club is defined. Two admin endpoints will provision on demand, and both copy the id, slug, name and status straight from the constant:

- `adminUsers.create` — an admin picks a club, types a password, and the row and account are created.
- `adminClubs.rotatePassword` — generates a passphrase and, if the account does not exist yet, creates the row and the account in the same call.

Until then, a club with no administrator is still visible in the admin screens, as a synthetic "unprovisioned" row, so the gap is visible rather than silent.

A club admin can rotate their own password from their account screen, and it is delivered as a generated passphrase rather than something they chose.

**Banning a club administrator** sets a flag on the user row and writes an audit entry. The check is enforced in one assertion, which is called by all fifteen submit endpoints. It deliberately is not called by the endpoints that let an admin read their own club, list their galleries, view their own account, rotate their own password, or withdraw their own proposals — none of those is creating or submitting content.

## The screens

**`/club` — the club workspace.** Eight screens behind a layout route that checks the role and loads the admin's own club. Never from a URL parameter: the layout calls the `myClub` endpoint, which derives the club from the session and returns forbidden if the account is not a club administrator.

An overview with the club's gallery and image counts and its pending queue, a three-step "how publishing works" explainer, a **club profile** screen for the description and cover banner, screens for galleries, gallery detail (batch image upload with a per-image role picker, off-site album link, and a picker for linking the gallery to one of the club's own events or achievements), events, achievements, announcements, the full submission queue with withdraw, and an account screen for rotating your own password.

**No club form sends a `clubId`.** The older shape took one from the client and then checked it against the username, which is safe but asks the client for something the server already knows — and the clients got it wrong: the event, announcement and gallery forms all sent `clubId: ""`, so the lookup found nothing and every one of those submissions failed with "You are not the administrator of that club". Every submit endpoint now calls `ownClubScope`, which derives the club from the username and asserts the account may submit, and the field is gone from the request entirely.

**`/cms/clubs` — the review queue.** Pending proposals from both queues, filterable by club, each showing a field-level diff against the captured snapshot, a raw JSON area for corrections, approve and reject buttons, and ban/unban controls for the club's administrator.

**`/admin` — provisioning.** A roll-up of every configured club with its provisioning state, credential issue and rotation, and the audit feed.

**Public pages.** `/galleries/:slug` for a single approved gallery, open to anyone. `/events` for club and school events with their linked galleries, plus club achievements. `/students` shows the club grid with each club's cover banner.

## Sports

There is no sports logic in this codebase.

No table, no schema file, no endpoint, no editable field. The gallery link targets deliberately omit `sport`, with a comment saying sports get their own schema whenever it exists.

Everything sports-related is a hardcoded list in a component:

```
Cricket, Rugby, Athletics      the three with photographs
Swimming, Football, Chess      the "more sports" panel
```

The comment on that list is worth repeating, because it sets the tone for the whole content layer: _"Exactly the sports the design names, and no others. Adding a plausible-looking sport here would be inventing a fact about the college."_

**And that component does not currently render.** It is used only by its own test, because a second, newer students page component is what the route mounts. The practical result is that the live students page shows clubs but no sports, no house system and no prefects call-to-action — while the jump links at the top of the page still point at all three. The same duplication affects the contact and news pages: eighteen production-unreachable files across three page families, each superseded by a CMS-driven version.

So sports are in the same position as houses and prefects — a designed section with no data behind it and no route to it.

**If you were to build it,** the shape the codebase already implies:

_A `sport` table_, modelled on `club` — id, unique slug, name, description, an image, an `active`/`archived` status, timestamps, the branded-id pattern. The `club` table is the obvious template.

_Decide whether sports are even a separate concept._ The existing school-wide `achievement` table already carries `"Sports"` as a category value, which suggests sporting results are already modelled as global achievements with a category. If that is the intent, a `sport` table would be about the _sport_ — its name, its photograph, its season — not its results.

_Decide who authors it._ Every other content type is either CMS-authored or club-authored, and the difference is whether there is a hardcoded administrator for it to be authored by. Sports have no obvious administrator, which argues for CMS authorship and therefore no submission queue at all.

_Add `sport` to the gallery link targets_ if sports become linkable. The comment says this is a one-line change; it would also need adding to the two places that validate link targets, which currently disagree with each other — see below.

_Then wire the last metre._ Give the students page a sports section, and add a CMS block if any of the copy is meant to be editable. The existing `students-activities` block is the template.

## Bugs and gaps

**A gallery link to an achievement could never be approved. — fixed** This was a real bug, and it was three bugs in one. Submitting an `achievement` link passed validation, because the submit handler checked that the target event, person _or achievement_ exists and queried the achievements table. The applier then validated only event and person — the achievement case fell through both branches and the approval failed with "the linked root-level record does not exist", for a record that demonstrably did. A reviewer could approve such a proposal and it could never land. Separately, a third list over in the club's own links screen had all three targets, so the three had drifted independently of each other.

The fix is one shared module, `clubs/link-targets.ts`, that owns the list of resolvable targets and resolves them. All three call sites use it. Adding a target to `GALLERY_LINK_TARGETS` without adding it there is now a runtime error naming the target — which is the failure you want, because a link to something the site cannot render is worse than a rejected submission.

The `exhibition` target is the mirror case and always behaved correctly: it has no table, so the submit handler rejects it up front with a message that explains why.

**Two tables were written and approved but never displayed. — fixed** Club achievements had a submit endpoint, an applier and a review queue entry, but no public read endpoint, because the achievements query read only the school-wide table. Club events had a public read endpoint that **no route called**; the students page fetched school-wide events instead. Both were fully wired except for the last metre, which is the hardest metre to notice is missing.

There is now `listClubAchievements`, and `listClubEvents` has a caller: `/events`. `listClubEvents` also no longer defaults `from` to now — it did, which meant a query could not ask for the past at all, and the default is now applied by the caller so the `limit` is applied _after_ the filter rather than before it.

**Three club-portal forms could never succeed. — fixed** The event, announcement and gallery forms all sent `clubId: ""`. Server-side, `findHardcodedClub("")` finds nothing, so `assertClubAdmin` threw "You are not the administrator of that club" for every submission. Only `submitClubAchievement` worked, because it was the one written to derive the club server-side. All of them now derive it, and no submit endpoint takes a `clubId` at all. See [The screens](#the-screens).

**The club domain did not typecheck. — fixed** Three separate compile errors, all of which broke real functionality rather than just the build:

- `clubs/scope.ts` never imported `club`, so `myClub` — which every club screen calls for its own header — could not compile.
- `clubs/apply.ts` never imported `valibot`, so `parsePayload` and therefore **all ten appliers** were non-compiling, which meant every approval failed.
- `assertLinkTargetExists` was typed as taking the root `Database` handle but is called from inside the approval _transaction_, and `SQLiteAsyncTransaction` is not assignable to it (`batch` is missing). The union now lives in `clubs/db.ts` as `DbLike`.

**A club's name and slug can never change.** The submission schema excludes both, correctly, because other content references them and the comment says they stay CMS-owned. But there is no CMS endpoint to create or edit a club either. The row is created once, lazily, on first credential issuance — or now by `applyClub`, if a banner was approved before anyone had signed in — copying from the TypeScript constant. So "CMS-owned" still means _unreachable_, and the only way to rename a club is to edit the constant and redeploy. Everything else a club would want to change about how it presents itself, it can now change, approval-gated.

The same divergence shows up between two lists: the admin screens enumerate the hardcoded constants, while the public query reads the database. A database row with no matching constant would be publicly visible and invisible to the CMS — and would have no administrator, so nothing could be submitted for it.

**The ban is a column write, not a library call.** The ban endpoint sets a boolean on the user row directly rather than going through Better Auth's ban API, so the only thing that actually enforcing it is the one assertion function, which every submit endpoint must remember to call. That is currently true of all fifteen, and there is no test holding it there.

**The featured-media call sites hardcode one club's slug** in both the homepage and the students page. Harmless with one club; with a second, the homepage would show only photography's images.

**The slug-based club lookup is dead. — fixed** `findHardcodedClubBySlug` had no callers; slug resolution goes through the database, which is right, because the row is the presentation source of truth. Removed.

**The approval applier for gallery items is the most complex function in the codebase** and carries a lint suppression for it. It re-checks gallery ownership, derives the cover flag, and resolves trending rank in a four-way priority. It is readable, but it is the function most likely to break if the trending rules change.

## Where the code is

| Looking for | Go to |
| --- | --- |
| The club registry, and the username convention | `packages/api/src/routers/clubs/config.ts` |
| Public reads, and the "published only" discipline | `packages/api/src/routers/clubs/public.ts` |
| A club admin's own view of their club | `packages/api/src/routers/clubs/scope.ts` |
| The submit endpoints and the `ownClubScope` guard | `packages/api/src/routers/clubs/submissions.ts` |
| The ten appliers and the approval transaction | `packages/api/src/routers/clubs/apply.ts` |
| Which things a gallery link can point at | `packages/api/src/routers/clubs/link-targets.ts` |
| Turning a `fileId` into a URL | `packages/api/src/routers/clubs/file-urls.ts` |
| `Database` or transaction, for approval-path code | `packages/api/src/routers/clubs/db.ts` |
| Payload shapes, shared by submit and approve | `packages/api/src/routers/clubs/payloads.ts` |
| The review queue, ban, credentials, audit | `packages/api/src/routers/admin-clubs.ts` |
| Provisioning a club admin account | `packages/api/src/routers/admin-users.ts` |
| The `club` table | `packages/db/src/schema/clubs.ts` |
| Club events, announcements, achievements | `packages/db/src/schema/clubContent.ts` |
| Galleries, images, links, and the constraints | `packages/db/src/schema/gallery.ts` |
| The two queue tables and their constraints | `packages/db/src/schema/approvals.ts` |
| Roles and the `club` permission | `packages/auth/src/permissions.ts` |
| `/club/*` screens | `apps/web/src/routes/club/` |
| The club banner picker | `apps/web/src/components/club/cover-image-picker.tsx` |
| The review screen | `apps/web/src/routes/cms/clubs.tsx` |
| A public gallery page | `apps/web/src/routes/galleries.$slug.tsx` |
| The public events page | `apps/web/src/routes/events.tsx` |
| Where clubs render on the site | `apps/web/src/routes/students.tsx` |
| The clubs section component | `packages/ui/src/components/students/clubs-societies.tsx` |
| The spec this was built from | `specs/CLUB-ARCHITECTURE/` |
