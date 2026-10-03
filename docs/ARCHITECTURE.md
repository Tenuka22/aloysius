# Architecture

How the Aloysius site works, and why it works that way.

This is written for a developer joining the project. It assumes you can read TypeScript and React but knows nothing about this codebase. Read it start to finish the first time; after that use the index at the bottom to jump around.

**If you only read one thing**, read [The one big idea](#the-one-big-idea). Every other decision in this codebase falls out of it.

---

## Contents

**Orientation**

- [What this is](#what-this-is)
- [The one big idea](#the-one-big-idea)
- [How the code is laid out](#how-the-code-is-laout)

**The request path**

- [A page loads](#a-page-loads)
- [Talking to the server](#talking-to-the-server)
- [What the server can do](#what-the-server-can-do)
- [Who is allowed to do what](#who-is-allowed-to-do-what)

**The data**

- [How the database is shaped](#how-the-database-is-shaped)
- [Content that belongs to the school](#content-that-belongsto-the-school)
- [Galleries](#galleries)
- [Clubs, societies and sports](#clubs-societies-and-sports)
- [The editor's notebook](#the-editors-notebook)
- [Files and images](#files-and-images)

**The subsystems**

- [The CMS](#the-cms)
- [Clubs and the approval queue](#clubs-and-the-approval-queue)
- [Accounts and roles](#accounts-and-roles)
- [The front end](#the-front-end)
- [Design tokens and components](#design-tokens-and-components)

**Operating it**

- [Building and running](#building-and-running)
- [Environment and secrets](#environment-and-secrets)
- [Deployment](#deployment)
- [Tests](#tests)

**Reference**

- [Known problems](#known-problems)
- [Things that are gone](#things-that-are-gone)
- [Conventions worth keeping](#conventions-worth-keeping)
- [Where things live](#where-things-live)

---

# Orientation

## What this is

A website for St. Aloysius' College in Galle, Sri Lanka. Public pages for prospective families, a news and notices feed, a media gallery, and three signed-in areas: a CMS for editors, an admin area for the site's technical staff, and a per-club workspace for the people who run the societies.

There are two deployable apps and six shared packages:

```
aloysius/
├── apps/
│   ├── web/         the real site
│   └── building/    a "coming soon" placeholder (see below)
│
└── packages/
    ├── api/         the server: every endpoint, and the rules they enforce
    ├── db/          the database schema — 24 tables
    ├── auth/        accounts, roles, and how credentials get created
    ├── storage/     image and file storage (MinIO)
    ├── ui/          the design system and all the page components
    └── config/      one file: shared TypeScript settings
```

`apps/building` is worth understanding early because nothing explains it. It is a tiny static page that sits on the college's main domain saying "our new website is being built". It exists because a _different_ codebase — the admissions portal — shares login cookies between `aloysiuscollege.lk` and `admissions.aloysiuscollege.lk`. Those cookies are refreshed by whatever page the visitor lands on. If nothing lived on the main domain any more, a visitor who started their application on the old admissions site and then clicked through to the main site would arrive with a cookie scoped to the wrong host and appear logged out.

So `apps/building` renders one screen and then quietly rewrites those three cookies on every page view, byte for byte, exactly as the old portal did. It has no dependency on any other package in this repo — it duplicates the crest image and hardcodes the three brand colours — so that it can be built and deployed without the main site.

## The one big idea

**Nobody writes to a content table directly. Ever.**

There are exactly two kinds of author in this system, and neither of them has a direct write path.

**Editors** work on snapshots. When a CMS editor changes a headline, the change lands in a `content_version` row marked as a _draft_. The live page keeps showing the last _published_ snapshot. When the editor publishes, the old published row is retired and a new one is inserted. Nothing is ever overwritten, so "what was on the homepage last Tuesday" is a query rather than a reconstruction.

**Club administrators** work on proposals. The Photography Club's admin cannot edit the gallery table. What they can do is write a JSON proposal into a queue table describing what they want changed. A CMS editor reviews it, can hand-edit the JSON if the club got something wrong, and then approves. Approval is the one code path that writes to the live table — and it does the content write and the status flip in a single database transaction, so a submission can never be applied twice and a half-applied change is not a state the system can be in.

Three separate mechanisms enforce this, deliberately overlapping:

1. **The schema.** Queue tables carry a `status` that starts at `pending`. Live content tables have no `status` at all, or a `publishedAt` timestamp that nothing sets until approval does.
2. **The public queries.** Every read that a visitor can reach filters for published state. `public.ts` opens with a comment explaining that an unapproved draft has no published row to find, so there is no code path in that file that can leak one. That is a stronger statement than "we remember to check".
3. **The appliers.** `apply.ts` is the only module in the codebase that writes to a live content table, and it is only ever called from inside the approval transaction.

The practical effect: "the club changed the cover image" and "the CMS approved the new cover image" are two rows with two timestamps. That separation is what makes the whole thing auditable, and it is why the club admin screens can be simple forms without any of them needing to understand publishing.

There is exactly one deliberate exception. The school-wide `announcement` table has no submission path at all, because the person reviewing the queue _is_ the person who wrote the announcement. A second gate in front of that would be ceremony, not safety.

## How the code is laid out

The dependency graph is almost a line, with one deliberate fork:

```
apps/web ──┬─→ ui        (rendering, tokens, page content constants)
           ├─→ api       (the server's router, imported directly)
           ├─→ auth
           ├─→ db
           └─→ storage

api ──┬─→ auth
      ├─→ db
      └─→ storage   (types only)

auth ──→ db
ui    ──→ nothing
```

Two packages have no workspace dependencies at all: `ui` and `building`. `ui` not depending on `api` or `db` is what lets the design system be reasoned about as a design system rather than as a view layer with a database attached.

**`api`, `auth`, `db` and `storage` ship raw TypeScript.** Their `package.json` points `types` at a built `.d.ts` in `dist/` but `default` at the `.ts` source, so the bundler compiles them directly and there is no build step for the libraries. Only `apps/web` ever runs `tsc -b` on them, which is why the root `postinstall` script does it.

**Path aliases are resolved twice**, which is worth knowing when something will not resolve. `@aloysius/ui/*` works through TypeScript's `paths` in `apps/web/tsconfig.json` _and_ through the package's own `exports` map. Vite is configured to read the tsconfig paths, so the two agree — but a subpath that exists in one and not the other will behave confusingly.

---

# The request path

## A page loads

There is no `server.ts`. The server is three route handlers plus a module of singletons that runs once when the process starts.

```
apps/web/src/services.ts
  createDb(env)                 ← opens the libSQL connection
  createConfiguredAuth(env, db) ← the Better Auth instance
  createStorage(env)            ← the MinIO client
  ensureServerBootstrap()       ← seeds/re-secures the CMS editor account
```

`ensureServerBootstrap` is a memoised promise. Memoised so two requests arriving together cannot both try to create the account. And it **clears itself on failure**, so a transient database error does not get cached as a permanent "already bootstrapped" — the next request retries. It runs before every oRPC request and on every Better Auth request.

Then, per request, `createContext` assembles what every handler needs:

```ts
{
  (db, storage, auth, session);
}
```

`session` comes from `auth.api.getSession({ headers: req.headers })` — one call, memoised inside Better Auth for the request.

**There are three HTTP handlers, all mounted as TanStack Start server routes:**

| Path | What it does |
| --- | --- |
| `/api/rpc/*` | the oRPC router, plus an OpenAPI reference UI at `/api/rpc/api-reference` |
| `/api/auth/*` | Better Auth passthrough (sign-in, session, admin plugin endpoints) |
| `/api/files/*` | streams one stored file |

`/api/rpc` is a single splat route that tries the RPC handler first and falls through to the OpenAPI handler. Both attempts build their own context, so a request that falls through does the session lookup twice. Harmless, slightly wasteful, and the kind of thing worth knowing before someone tries to "fix" it and breaks the reference UI.

## Talking to the server

The oRPC router is **isomorphic** — the same object serves both sides.

On the server, a component calls go through `createRouterClient`, which invokes the procedure directly. No serialisation, no HTTP hop, no second process. An SSR query is a function call.

In the browser, the same calls go over `fetch` to `/api/rpc` with `credentials: "include"` and a retry plugin.

The client module exports two things:

- `client` — the imperative client. Used for `getSession`, admin mutations, history reads, file presigning, and the SSE stream. Deliberately uncached.
- `orpc` — a TanStack Query integration. Gives every procedure a `queryOptions()` and a cache key, so `orpc.clubs.listClubs.queryOptions()` is both the query identity and the thing you pass to `invalidateQueries`.

There is **no hand-written query-key file**, which is unusual and worth appreciating: because the client is generated from the router, a cache key can never drift from the endpoint it names.

## What the server can do

Everything is an oRPC procedure, and procedures come in five tiers. The tier is part of the definition, so authorisation is visible at the point of declaration rather than buried in a handler:

| Tier | Requires |
| --- | --- |
| `publicProcedure` | nothing — no session needed |
| `protectedProcedure` | any signed-in user |
| `adminProcedure` | role is exactly `admin` |
| `cmsProcedure` | role is `admin` or `cms` |
| `requireClubPermission(action)` | the `club` permission via Better Auth's access control |

The last one is the odd one out: it asks Better Auth whether the caller's _role_ grants `club:submit`, rather than checking a hardcoded role name. That means permissions are data, defined in one table in `packages/auth`, and a new role with the right grant passes every club endpoint without any endpoint changing.

Note that the tiers are not cumulative. `adminProcedure` is built from `publicProcedure`, not from `protectedProcedure`, and re-implements the session check itself. Slightly redundant, but it means each tier is one readable line rather than a chain you have to follow.

**The router is one plain object**, composed from individually-built procedures:

```ts
export const appRouter = {
  healthCheck,
  getSession,
  privateData, // three loose procedures
  cms,
  files,
  adminUsers,
  adminClubs,
  clubs, // five sub-routers
};
```

Five sub-routers, 101 procedures total:

| Router | Procedures | What it's for |
| --- | --- | --- |
| `cms` | 55 | the block editor: read, save draft, publish, watch, history |
| `clubs` | 28 | public club content reads, the club admin's own view, 15 submit endpoints |
| `adminClubs` | 14 | the review queue, ban/unban, credential rotation, audit feed |
| `files` | 4 | issue an upload path on this app, register, list, delete |
| `adminUsers` | 4 | list accounts and clubs (provisioning moved to `adminClubs.rotatePassword`, which creates the account when there is none) |

## Who is allowed to do what

Four roles, and only three permissions to go around:

| Role         | Grants                                                       |
| ------------ | ------------------------------------------------------------ |
| `admin`      | everything (Better Auth bypasses permission checks entirely) |
| `cms`        | `cms:edit`, `cms:publish`                                    |
| `club-admin` | `club:read`, `club:submit`                                   |
| `user`       | `club:read`                                                  |

The three permissions are `file` (create/list/delete), `cms` (edit/publish), and `club` (read/submit). A plain `user` deliberately does **not** get `club:submit`.

**Route protection is done in the layout routes, not in middleware.** Each of the three signed-in areas has a layout route with a `beforeLoad` that fetches the session and redirects if the role is wrong. This is worth flagging because `apps/web/src/middleware/` contains two files that look like they do this job and do not — they have no importers. See [Known problems](#known-problems).

`beforeLoad` is the right place for this in TanStack Start: it runs on the server before child loaders and before render, so a protected screen never leaks its data to a client that should not have it.

The sign-in route is more careful than the others. It returns the same generic error for a wrong password and a nonexistent username, so the form cannot be used to enumerate accounts. Its post-login redirect is validated to reject anything that is not a same-origin path, closing an open-redirect hole.

---

# The data

24 tables in libSQL (a SQLite fork) accessed through Drizzle ORM. Remote in production, a local file in development.

## How the database is shaped

**Every table's id is a branded type**, not a string. `GalleryId` is not assignable from a bare `string`, and a `GalleryId` cannot be passed where a `ClubId` is expected — the compiler catches it. This matters more than usual here, because ids travel through a lot of generic inference between the router builder and the database layer, which is exactly the situation where a plain `string` quietly becomes interchangeable with every other string.

The brand is keyed by a plain string rather than a `unique symbol` for a specific reason: symbol-keyed brands break `tsc -b` composite builds once the type flows through enough generic machinery. The comment in `schema/brand.ts` says so, having been learned the hard way.

**Validation is Valibot, everywhere, and it is shared.** Drizzle can generate select and insert schemas from the table definitions, and the codebase uses that. But the important pattern is in the club submissions: the schema that validates a request on the way in is _the same schema_ re-used to parse the stored JSON on the way out at approval time. A payload that was valid when submitted cannot be applied in a shape the tables do not expect, and an editor's hand-edited JSON is validated before it can reach a live row.

`schema/primitives.ts` holds the field formats that would otherwise be reinvented — email, Sri Lankan phone (which normalises `07XXXXXXXX` to `+947XXXXXXXX`), national identity card, ISO date, postal code, strong password. Only two of them are still imported. The rest are leftovers from the student records system that was removed; see [Things that are gone](#things-that-are-gone).

**Timestamps** are stored as integer milliseconds and defaulted in SQL with `unixepoch('subsecond')`, so a row has a creation time even if the application never sets one.

## Content that belongs to the school

Six tables hold content that is the school's own rather than any club's:

`person`, `event`, `achievement`, `announcement`, and the two that the announcements/news features are built on. Each has a `publishedAt` timestamp and no status column — the timestamp is the gate. Nothing is public until it is set, and only an approval sets it.

`achievement` is the school's record of what the _school_ has done. It has a `category` and a unique index on `(category, title)`. A club's own results live in a completely separate table, and the comment explaining why is worth repeating here because it is the kind of decision that gets quietly reversed later:

> Merging them would mean either a club editing school-level copy, or a global achievement quietly being attributed to whichever club logged it last.

`announcement` is the school-wide notice. It carries `audience` (all, students, staff, parents, alumni), `severity` (info, important, urgent) and `isPinned`. Notice how club announcements do _not_ have those three columns — a club cannot pin a notice to the top of the school's strip, and the public feed substitutes `null` for them.

## Galleries

Galleries are the only place where global content and club curation overlap, and the design is deliberate enough to be worth understanding.

A gallery is site-level — addressable from the homepage and any page. But it carries an `ownerClubId`, which records _which club may curate it_. The Photography Club curates the photo galleries. A gallery with no owner is CMS-authored, typically something a teacher runs, and **no club may edit it** — the ownership check fails rather than silently allowing any club admin to claim it.

Galleries come in three kinds, and each kind gets its own detail table:

```
gallery  ──┬─→ photo_gallery    (shotOn, location, camera, lens, exposure)
           ├─→ art_gallery      (medium, artist, venue, year)
           └─→ digital_gallery  (format, durationSeconds, posterImageId)
```

Table-per-subtype rather than nullable columns on one table, so kind-specific fields are typed instead of shoe-horned. The submission applier dispatches with an `if / else if` chain rather than a `switch` specifically so that adding a fourth kind becomes a compile error at that line.

**The image role system is the most interesting part.** Every image in a gallery is doing one of three jobs, and the jobs need incompatible crops:

| Role     | Where it appears                               | Crop |
| -------- | ---------------------------------------------- | ---- |
| `cover`  | the tile that represents the gallery in a list | 3:2  |
| `banner` | full-width at the top of a gallery page        | 16:9 |
| `item`   | one tile in a masonry grid among its peers     | 1:1  |

Without a declared role the renderer has to guess from context, and the same upload crops three different ways depending on which screen it lands on. So the role is a column.

And `isCover` — a boolean that says "this is the cover" — is **not** independent. It is derived from `imageRole` every time an item is written. There is one way to say "this is the cover", not two that can disagree. A database check constraint backs that up in case anything ever writes the boolean directly.

The rest of the gallery constraints are all in the database rather than in application code, because two approved submissions can race (each is a separate reviewer action) and application-level checks have a window between them:

- at most one cover per gallery
- at most one banner per gallery
- at most five trending images per gallery, ranked 1–5, with a unique index on the rank and a range check
- a trending image must have a rank; a non-trending image must not

"Trending" is how an image reaches the homepage. A club can _propose_ promoting its own photograph, but the flag is not written until a reviewer approves — so a club cannot put its own shot on the homepage.

`gallery_link` attaches a gallery to a person, an event, an achievement, an exhibition, **or one of the club's own `clubEvent` / `clubAchievement` records**. It is deliberately **polymorphic with no foreign key** on the target id. The alternative — one link table per target — means a migration and a new API branch every time a new thing becomes linkable, and the user-facing question ("show me the events in this gallery") is answered by one indexed lookup. The trade-off is that the database cannot stop a dangling target, so the API validates the target exists at both ends.

The club-owned targets are separate values rather than extensions of `event` and `achievement` because `club_event` and `club_achievement` are separate tables with separate ownership. Before they existed, a club could propose an event, photograph it, and had nowhere to point the photographs — the natural link could not be expressed at all.

`LINK_TARGET_RESOLVERS` in `clubs/link-targets.ts` is the single map that the submit handler, the approval applier and the club's own link screen all read. Adding a value to `GALLERY_LINK_TARGETS` without a resolver there is a runtime error naming the target, which is the intended failure mode: a link to something the site cannot render is worse than a rejected submission.

Note that `sport` is deliberately _absent_ from the link targets, with a comment saying sports get their own schema. That schema does not exist. See [Known problems](#known-problems).

## Clubs, societies and sports

A club is a registry record the CMS creates, not something a club creates for itself. It has a slug, a name, a description, two images, and an `active`/`archived` status.

**The identity model is unusual and deliberate.** Each club has exactly one administrator, and their Better Auth username _is_ the club's identity: the slug plus `-admin`. So the Photography Club's administrator is `photography-admin`, and that username is the join key between an authenticated session and a club. It is hardcoded in a typed constant in the API.

This is worth understanding because of what it prevents. The club a submission is for is derived from the session on **every request** and never read from a client parameter. There is no `?club=` anywhere in the club endpoints, and — as of the banner work — no `clubId` in any submit endpoint either. Every submit handler calls `ownClubScope`, which resolves the club from the username and asserts the account may submit, so there is no field a client can get wrong. (There was: the event, announcement and gallery forms all sent `clubId: ""` and every submission from them failed.)

The registry constant decides _who may write_. The database row decides _what the club is called_. Both exist because a club can edit its own description and images but not its own name or slug — the name is referenced by other content.

The two images are the **cover banner** across the top of the club section and the **section background** behind it. They are edited on `/club/profile` and go through the ordinary club queue as target `"club"`, so a banner is approval-gated like everything else. Their payload fields are _nullable_ rather than merely optional: `undefined` is "leave this alone" and `null` is "take the banner down", and without that distinction a club could add a banner but never change or remove one.

There is no membership model, no member list, and no role hierarchy inside a club. One account.

**Events hold no images of their own beyond a cover.** Everything else about an event is a gallery attached to it, which is why `/events` is built entirely out of resolved links and why `listGalleriesForTarget` exists. An event with no linked gallery is legitimate — the cross-country run did not need a gallery to have happened — so the page renders one without photographs rather than treating the empty state as a fault.

**Approved galleries are public.** `getGallery` is a `publicProcedure` with no per-viewer check: a gallery only has a row to find once a reviewer approved it, so the approval _is_ the access control. The route is `/galleries/:slug` rather than a club-scoped path because a gallery is global content that happens to have a curator — one with no club attached still needs an address.

**Sports do not exist in this system yet.** Not as a table, not as a schema, not as an API, not as an editable field. There are hardcoded strings in a component that no route currently mounts, and a jump link on the students page pointing at a section that does not render. The full picture, including what building it would involve, is in the [club deep dive](./CLUB_SOCIETIES_POSTS.md).

**Societies and clubs are the same thing.** The database comment says "a club or society"; the UI section is called "Clubs & Societies". There are eight society names hardcoded as a fallback list, and they are not rows in the `club` table.

## The editor's notebook

One table, `content_version`, backs the entire CMS, and it is worth understanding because the design is doing more work than it looks like.

Each row is one change to one block on one page:

| Column | Meaning |
| --- | --- |
| `page` | which page — `homepage`, `about`, `principal`, `news`, `notices`, `contact`, `alumni`, `media`, `students` |
| `blockId` | which region — `hero`, `heritage`, `life`, … |
| `action` | `created`, `draft`, `edit`, `publish`, `hide`, `show`, `delete` |
| `snapshot` | JSON: the block's hidden flag and all its field values |
| `published` | is this the version currently live? |
| `authorId` | who made the change |

One row per block per change, so a page's state is the newest published row for each of its block ids.

**Publishing inserts; it does not overwrite.** When an editor publishes, the current published rows for that page are flipped to `published = false`, _new_ rows with `action = 'publish'` are inserted carrying the draft snapshots, and the draft rows are deleted. History is therefore complete by construction — you are not reconstructing the past from deltas, you are reading it. Restoring an old version is copying a snapshot forward.

The `snapshot` column holds the whole block, not a diff. That makes rows bigger than a normalised design would need and makes every read trivially correct.

## Files and images

Uploads never pass through the application server. The flow is:

1. Client asks for an upload URL, stating the filename, content type and size.
2. Server mints a key like `admin/<uuid>.jpg` and returns a presigned MinIO URL valid for five minutes.
3. Client `PUT`s the bytes **straight to MinIO**. The server never sees them.
4. Client confirms, and the server writes a `files` row.

Files are then served from `/api/files/<key>` with a one-year immutable cache header, no authentication — the keys are UUIDs, and the reasoning is that a unguessable URL for a photograph on a public school website is the right trade.

Deletion goes the other way round: the database row is deleted **first**, then the storage object is removed on a best-effort basis. If the storage cleanup fails, the system logs it and moves on, because the reverse order would leave a database row pointing at bytes that no longer exist.

**There is no MIME allowlist anywhere in this path.** Size is capped at 10 MB on the presign step; the confirm step has no cap at all. See [Known problems](#known-problems).

---

# The subsystems

## The CMS

The CMS is the largest subsystem and the least obvious, so it is worth walking through slowly.

**Content is modelled as blocks of fields.** A block is one editable region of a page — the hero, the heritage section, the news feed. A field is one control inside it. In the editor's terms:

```
PageBlock  { id, name, type, status, summary, fields: BlockField[] }
BlockField { id, label, kind, value?, hint?, wide?, options?, aspectRatio? }
```

`type` is descriptive of layout (Hero, Card grid, Mosaic, Feed, …) and `status` is one of `published`, `draft`, `scheduled`, `auto`, `global`. Two of those are worth knowing: `auto` means the block fills itself from another screen (the news feed on the homepage pulls from the news page's data), and `global` means a change lands on more than one page — the Principal's Message is the only one.

`kind` decides which control the editor renders: text, textarea, rich text, image, read-only, or select.

**There are two directions of mapping, and they use different shapes on purpose.**

_Registry → editor._ The block definitions in `packages/ui/src/content/cms.ts` are the source of truth for what controls exist. The editor renders one control per field, keyed by field id.

_API → component._ When the site renders, it gets a much narrower shape back: just the block id, whether it is hidden, and the field values. No `kind`, no `label` — that is editor-only metadata that has no business on a public page. A per-page resolver flattens that into a typed props object where **every single prop is optional**, so a missing value degrades rather than crashes.

**Every image field declares its aspect ratio**, resolved through a lookup keyed by field id. That is why the hero is always 16:9 and a news card is always 16:10 — the crop is data attached to the field, not a decision each component makes.

**Two opposite fallback behaviours, both intentional.** Homepage text uses `??`, so clearing a field hides the section rather than resurrecting the shipped default. But the About page's archival photographs and the Principal's Message use "absent only" semantics, so clearing them falls back to the original image — because, in those two cases, the bug that prompted the code was an empty page. There is a test pinning the Principal behaviour specifically.

**Rich text is deliberately fenced.** The editor is Tiptap with a narrowed schema: no code blocks, headings limited to levels 2–4, links forced to open in a new tab with `rel="noopener noreferrer"` and an `https` default protocol, plus one custom node for pull quotes. The narrowing exists so an editor cannot produce markup the site's typography has no style for. It stores HTML rather than ProseMirror JSON.

Because the only HTML in the system comes from that editor, it still gets sanitised on every render — and the sanitiser is hand-written, 359 lines, no DOM. It maintains an allowlist of nineteen tags, drops five dangerous ones along with their contents, rebuilds attributes from scratch so only `href` survives, and checks URL protocols **after stripping control characters** so a `java\0script:` payload cannot slip past a naive check. It is documented as idempotent, which is what allows the renderer to sanitise unconditionally without worrying about double-processing.

**Version history is a paginated diff.** The server groups publish rows by timestamp — one publish operation writes several rows that share a timestamp — and returns field-level before/after values against the previous group. The client feeds a popover and a full-screen dialog from a shared cache so paging one keeps the other in sync.

**Real-time is a single in-process publisher.** Saving a draft publishes an event on a `<page>-updated` channel; the editor's `watch` endpoint is a generator subscribing to it. Two details: it is in-memory, so it only works with a single server instance; and exactly one editor screen subscribes. Two editors on the same page will not see each other's changes. Both look like oversights rather than decisions, and the resume window is sixty seconds.

## Clubs and the approval queue

The most intricate subsystem, and the one the spec in `specs/CLUB-ARCHITECTURE` was written for. Covered in full in the [club deep dive](./CLUB_SOCIETIES_POSTS.md); the shape in one paragraph:

Fifteen `submit*` endpoints. Every one of them writes **only** to a queue table. None of them touches a content table. Two queues exist — one for club-scoped content, one for global content a club is allowed to propose — and they differ in scope, not in mechanics.

A club admin cannot touch another club's content, cannot touch the global announcement set at all, and can only _create_ — never update or delete — the school-wide `person`, `event` and `achievement` records.

Two things make the queue pleasant to work with. Re-submitting supersedes: a second proposal for the same target replaces the first, so a reviewer never sees two competing versions and the club's most recent intent is the one reviewed. And every proposal stores a snapshot of the live row as it was at submit time, so the review screen can show a genuine before-and-after diff without re-deriving what "live" meant when the club pressed submit.

The review screen lets an editor edit the proposal's JSON before approving. That is a deliberate escape hatch — the club got the slug wrong, the editor fixes the slug — and it is safe because the payload is re-validated against the same schema at approval time.

## Accounts and roles

Built on Better Auth, with username-and-password only. No OAuth, no email delivery.

**The `user` table carries three fields the platform does not know about:** `role`, `banned`, and `banReason` / `banExpires`. The role is declared as an additional field with `input: false`, so a client cannot set a role through the auth API at all.

**The username rule is overridden, and it is load-bearing.** Better Auth's default validator rejects hyphens — and it enforces that at sign-in. Every club admin username is hyphenated by construction. Leaving the default in place would mean the club admin accounts were created happily and then could never sign in, with nothing in the database to explain why. That happened once; the rule now lives in one file with a comment explaining it.

**Credential creation takes two deliberately different routes**, and the asymmetry is the interesting part:

- Club admin credentials go through Better Auth's own `createUser` API. The comment is emphatic: _"Deliberately not a direct insert. `createUser` is the same code path sign-in uses, so the account gets the same password hasher, the same credential-row shape and the same schema transforms. A hand-rolled insert skips all three, and the failure is silent and deferred."_

- The CMS editor account is written straight to the database. Because the env validation layer patches the `Response` constructor to scan response bodies for leaked secrets, and Better Auth's API endpoints construct `Response` objects internally — calling them during request handling trips the secret scanner. So the one privileged bootstrap path bypasses the HTTP layer entirely.

Both synthetic email addresses are derived from the username, so a taken username is always also a taken address, which turns duplicate detection into one error rather than a second lookup.

**The CMS editor account is re-secured on every boot.** Its role is re-asserted (so it cannot drift if someone edited the row by hand) and its password is re-rotated to match the environment variable. This is the reason a `CMS_PASSWORD` change takes effect without a manual step.

**Passwords are generated as passphrases**, not random strings: four words from a curated list plus two digits, hyphen-separated. The rationale is in the file and is the best argument for the design in the repo — the previous generator produced 76 characters of hex, and the comment observes that an admin who cannot retype their password from a sticky note ends up calling the site admin instead, which is a worse outcome than a slightly smaller search space _because the recovery path is the real attack surface_.

The word list has editorial constraints: three to eight letters, concrete nouns, no homophone neighbours, nothing differing only by a stripped `e`, and nothing that would be awkward on paper in a school. Words are drawn without replacement, and the random number generator uses rejection sampling rather than a modulo, both with the reason inline.

## The front end

TanStack Start with server-side rendering. About forty routes in three signed-in areas plus the public pages.

**Public pages** fetch through Suspense so the queries resolve during SSR. The server-side oRPC client calls the procedures directly, so an SSR query is a function call rather than a network round trip.

**The three signed-in areas each have a layout route** that guards the role and renders a shared workspace shell — a sidebar, a topbar, an account footer, and a mobile drawer built on a native `<dialog>` so focus containment and Escape come for free from the platform.

**Data fetching splits three ways,** and the split is a deliberate choice rather than inconsistency:

| Pattern | Where | Why |
| --- | --- | --- |
| `useSuspenseQuery` + explicit `Suspense` | public pages, CMS editors | resolve during SSR; no client-side waterfall |
| `useQuery` + explicit pending branch | admin and club screens | authenticated, not SEO-relevant, want to control the loading state |
| the imperative client | session checks, admin mutations, history, file presigning, SSE | must not be cached or prefetched |

**Cache invalidation is entirely prefix-based.** After a mutation, the screen invalidates the query object for the procedures it knows are affected. There are no hand-written keys, so an invalidation cannot name a cache entry that does not exist.

**One interesting detail in the homepage:** it measures the combined height of the header and the notice bar with a `ResizeObserver` and writes it to a CSS custom property, so the hero can be exactly `100svh - header`. That is the right way to do it — the alternative is a magic number that breaks the moment the notice bar wraps to two lines on a narrow screen.

**The root route** emits JSON-LD structured data, a theme colour, and Open Graph tags. Its error component shows a digest or the error name but never the message, so a stack trace or a database string cannot leak into a visitor's browser.

## Design tokens and components

StyleX, not Tailwind — despite three Tailwind classes having survived into the codebase, which is its own small finding.

**One global stylesheet, everything else StyleX.** The stylesheet declares a layer order with the reset first and StyleX's output in layers above it, so unlayered CSS can never win a specificity fight. It handles the font loading (self-hosted, one woff2 per unicode subset, no CDN), a single global focus ring, Sinhala and Tamil fallbacks, safe-area insets, reduced-motion and forced-colors handling, and print styles.

**Tokens come in two kinds, and the distinction is deliberate.** The raw brand colours — deep green, cream, gold, crimson — are compile-time constants. Every semantic name — `surface`, `onInverse`, `accentHover`, `borderStrong` — is a CSS custom property. So a component never references a hex value, and retheming means changing variables.

**The site is light-only.** `inverse` does not mean dark mode; it means the deep-green band that alternates down the page.

Alongside colour there are namespaces for font (two families, a fluid `clamp()` type scale, six weights, six tracking steps), space (a fluid scale plus semantic values like `gutter` and `measure`), radius, shadow, motion durations, and a named z-index scale so nobody invents `z-index: 9999`.

Breakpoints are a single token object of media-query strings, including bounded bands like `mdToXl` — those exist as a documented workaround for StyleX's non-deterministic atomic-rule emission order.

**The primitives are few and opinionated:** a `Section` with a tone, a `Container`, `Heading`, `Lead`, `Eyebrow`, `Stack`; a `Media` component; `ButtonLink` and `ArrowLink`; a `Reveal` scroll-entrance wrapper; and two screen-reader utilities.

Three decisions in there are worth protecting, and they are the kind of thing that looks like over-engineering until you have shipped the alternative:

**`Media` reserves its box even when it has no image.** A branded hatched placeholder occupies exactly the same space as the real image, so the layout does not shift when content arrives. One prop marks the LCP image as high priority, and it is the only image allowed to skip lazy loading.

**`Reveal` hides things client-side only, in a layout effect.** The SSR output is always the final, visible state. That means no hydration mismatch, correct output for crawlers and for anyone without JavaScript, and no flash of missing content above the fold. It feature-detects both `matchMedia` and `IntersectionObserver` and bails to _visible_ if either is missing — the animation is the enhancement, never the content.

**`SkipLink` uses `:focus`, not `:focus-visible`.** A keyboard user needs to see it the instant they tab; there is no mouse-user case for it being hidden.

---

# Operating it

## Building and running

Bun workspaces with Nx for task orchestration. The root scripts all fan out through Nx, so adding a package gets the same targets for free.

```
bun install          # also builds packages/api types and generates env files
bun run dev          # docker compose up the infrastructure, migrate, then run every app
bun run dev:web      # just the site
bun run build
bun run check-types
bun run test
bun run check        # lint (Ultracite)
bun run fix          # lint and format
```

Nx infers every target from the workspace `package.json` scripts — there is no `plugins` array in `nx.json` and no per-project configuration. Cache inputs deliberately exclude generated files, the route tree, and test files.

One gap: `sharedGlobals` is empty, so editing a root-level file — the lint config, or the shared TypeScript base — does not invalidate any cached task. If you change those, run the tasks with the cache cleared.

**Linting is entirely delegated.** There is no local rule configuration at all; `oxlint.config.ts` extends the Ultracite preset, and `oxfmt.config.ts` is a re-export of Ultracite's formatter config. All policy therefore lives in the Ultracite version pin, and a minor bump changes the whole lint surface. Worth knowing before you spend an afternoon on a rule you cannot turn off.

**There is no CI.** No workflow files, no pipeline configuration of any kind. The only automated gate is a pre-commit hook running lint-staged, which formats staged files and does nothing else. Type checking and tests are manual. If that is not intentional it is the highest-value thing to add.

## Environment and secrets

Configuration is defined in a schema file per package and code-generated into a typed module at install time, by a tool called Varlock. Bun's own `.env` loading is disabled in `bunfig.toml` so there is exactly one source.

The schema is the documentation. Each variable carries a type, a default where sensible, a length constraint, and annotations for whether it is public (safe to ship to the browser) or sensitive. A wrong type or a too-short secret fails at startup with a useful message rather than at 3am when a request needs it.

The site's package and the database package both have schemas; the database one imports three keys from the site's rather than duplicating them, so the database URL is defined in exactly one place.

Twelve variables in total: node environment, auth URL and secret, database URL and token, the CMS editor's username and password, and six for object storage.

## Deployment

Two Dockerfiles and two compose files. The production compose file has four services: the site, the database, object storage, and the placeholder app. The dev compose file has the two backing services only, and hardcodes every credential and port.

Both backing services have health checks, and the site waits for both to be healthy before starting. The database health check is a shell trick — the image ships no `curl` or `wget`, so it tests the TCP port with bash's `/dev/tcp`.

The site image is a two-stage build: a Bun builder that installs, type-checks and bundles, then a Node slim runner that copies the whole workspace across. The copy is necessary because the SSR output imports from the workspace packages at runtime.

That Dockerfile is the weaker of the two. The placeholder's is a careful three-stage build with a pinned Bun version, a manifest-only dependency layer, a non-root user, and a Dockerfile-level health check. The site's floats its Bun tag, copies the entire context with no layer strategy, and runs as root.

## Tests

Nine test files across the monorepo, and the distribution matters more than the count.

**What is tested properly:** credential creation, end to end against a real temporary database — the assertion that matters is not "a row exists" but "these exact credentials are accepted by the same endpoint a person types into". The passphrase generator's statistical properties. The rich-text sanitiser. The principal-message fallback semantics. Several page components' accessibility structure.

**What is not tested at all: the entire server.** The API package has a `test` script and a Vitest config and zero test files. Nothing covers any of the hundred and one procedures, none of the ten content appliers, and not the approval transaction — which is the single most consequential piece of logic in the codebase. The database-bootstrap-and-rotate-every-boot path is untested too, and it can rotate a live password.

A reader picking this up would reasonably assume the server is covered. It is not, and the two success criteria written into the club spec — that a club admin cannot target another club, and that a banned one is refused everywhere — have no executable assertion. Both would be cheap to add, because the guard they test is one function.

The database test harness is unusually good, incidentally: it creates a real on-disk temporary database with the full schema pushed, rather than mocking. That is why the auth tests are meaningful, and why the test timeout is fifteen seconds.

---

# Reference

## Known problems

Ordered roughly by how likely they are to bite. Entries marked **fixed** were found and corrected while writing this document; they are kept because the reasoning behind each fix is the part worth not re-deriving.

**A gallery link to an achievement could never be approved. — fixed** Submitting one passed validation, because the submit handler checked that the target event, person _or achievement_ exists. The applier then checked only event and person, so the achievement branch fell through and the approval failed with "the linked record does not exist" — for a record that demonstrably did. A third list, in the club's own links screen, had all three. The three had drifted independently.

The fix is one shared module, `clubs/link-targets.ts`, that decides which targets are resolvable and resolves them. The submit handler, the applier and the screen all call it. Adding a target to the link-target enum without adding it there is now a runtime error naming the target, which is the failure you want: a link to something the site cannot render is worse than a rejected submission.

**Two tables were written and approved but never displayed. — fixed** Club achievements had a submit endpoint, an applier, and a review queue entry, but no public read endpoint — the achievements query read only the school-wide table. Club events had a public read endpoint that **no route called**; the students page fetched the school-wide events table instead. Both were fully wired except for the last metre, which is the hardest metre to notice is missing.

There is now a `listClubAchievements` procedure, and `listClubEvents` has a caller: `/events`, which merges club and school events into one date-ordered list and shows each club event's linked galleries. `listClubEvents` also stopped defaulting its `from` filter to now — it could not previously ask for the past at all, and the default now lives with the caller so the `limit` applies after the filter.

**The club domain did not typecheck. — fixed** Three errors, each of which broke functionality rather than merely the build. `clubs/scope.ts` never imported `club`, so `myClub` — called by every club screen for its own header — could not compile. `clubs/apply.ts` never imported `valibot`, so `parsePayload` and therefore all ten appliers were non-compiling, meaning every approval failed. And `assertLinkTargetExists` was typed as taking the root `Database` handle while being called from inside the approval transaction, which is not assignable to it; the union is now `DbLike` in `clubs/db.ts`.

**Three club-portal forms could never succeed. — fixed** The event, announcement and gallery forms all sent `clubId: ""`, which resolved to no club, so every submission from them was rejected with "You are not the administrator of that club". Only `submitClubAchievement` worked, because it was the one written to derive the club server-side. All submit endpoints now derive it, and none of them accepts a `clubId`.

**A club's cover banner was unreachable. — fixed** The `club` row had `coverImageId` and `backgroundImageId`, and a `club` submission target existed, but nothing could set them: there was no CMS endpoint and no club-portal screen, and the payload's image fields were optional-but-not-nullable so a banner could never be removed. There is now a `/club/profile` screen, the fields are nullable, and `applyClub` inserts the registry row from the hardcoded constant if it is missing — otherwise an approved banner could be written to zero rows and still be marked approved.

**Sports, houses and prefects do not render.** There is no sports data model at all — no table, no schema, no endpoint, no editable field. The components that render them are used only by their own tests, because a second, CMS-era students page component is what the route actually mounts. The jump links on the students page still point at all three sections. The same duplication exists for the contact and news pages: eighteen production-unreachable files across three page families.

**The media page never queries galleries. — partly fixed** It renders a gallery _count_ from CMS content and the words "will be displayed here once published". There are now two real pages that do show galleries — `/galleries/:slug` for one approved gallery and `/events` for the galleries linked to each event — but `/media` still calls no gallery read endpoint, so there is no browsable index of every gallery on the site.

**Three Tailwind classes in a StyleX codebase. — fixed** Three divs used `className="mt-4"` in files that have no Tailwind, so they had no margin at all. The package already had the right answer — a `FieldStack` component whose comment explains that it exists _because_ `className` is how Tailwind-shaped habits get into a StyleX codebase. The three call sites now use it.

**A user row could end up with a null role. — fixed** The `user.role` column had no default, while the auth config declared `defaultValue: "user"`. Better Auth applies its default on the paths that go through it; a direct insert does not. And a null role is indistinguishable from no role to `requireRole`, which reads `session.user.role ?? ""` — so a user created outside the auth API was locked out of everything, silently. The column now defaults to `"user"` too, and a test asserts it.

**Five permission factories that could never work. — fixed** Five exported helpers checked permissions on resources that do not exist — student, mark, exam, staff, assignment. Any endpoint built from them could only ever return forbidden. They were vestiges of the removed records system, and are now deleted rather than left as a trap, with a note recording why.

**A club's name and slug can never be changed.** The submission schema excludes both, on the grounds that they are "CMS-owned" because other content references them. But there is no CMS endpoint to create or edit a club either. The row is created once, lazily, when credentials are first issued, copying values from a TypeScript constant. So "CMS-owned" currently means unreachable, and the only way to rename a club is to edit the constant and redeploy. The same divergence shows up as an inconsistency between two lists: the admin screen enumerates the hardcoded constants while the public query reads the table, so a row with no matching constant would be publicly visible and invisible to the CMS.

**A ban is a column write, not a Better Auth call.** The ban endpoint sets a boolean on the user row directly rather than going through the auth library's ban API. The only thing that actually stops a banned club admin is one assertion function. Six procedures deliberately do not call it — reading your own club, listing your galleries, listing your submissions, viewing your account, rotating your own password, withdrawing your own proposals. That is defensible, since none of those is creating or submitting content, but it means the ban is load-bearing on every one of the fifteen submit endpoints remembering to call that function.

**Two file endpoints are more permissive than documented.** Both the presign and the confirm step require any signed-in user, not an admin — so a `club-admin` can upload. More importantly there is no MIME allowlist on the presign step and no size cap at all on the confirm step, which registers a row pointing at an object that may not exist and may be any size. The storage layer validates nothing.

**Uploads are never verified to have happened.** The confirm endpoint writes a database row from a client-supplied key without checking the object is in storage.

**The students page and homepage hardcode one club's slug** when requesting featured media. Harmless with one club; with a second, the homepage shows only photography's images.

**Stale build output in the UI package will kill the entire stylesheet. — fixed, but read this before it happens again** Ninety-six emitted `.js` files sit beside the TypeScript sources in `packages/ui/src`, each carrying a duplicate of its source's lint suppressions. They are gitignored, so they do not show up in review, and they are the residue of someone running `tsc -b` in a package that is not set up for it.

The web app's bundler is configured to resolve `.ts` and `.tsx` before `.js`, specifically so an emitted artifact cannot shadow the file it was emitted from. That is the right setting, and it is also what exposes the problem: with it in place, StyleX can no longer bind the `defineConsts` token files, and every media query in the app compiles to a CSS variable used as a nested selector — `var(--x78sftw){.xtg1n5j.xtg1n5j{grid-column:span 2}}` — which is not valid CSS. LightningCSS rejects the stylesheet and the dev server returns a 500 for the whole file.

The symptom is unhelpful: the page renders with 200 and no styling, and the only error is a StyleX overlay reading _"Invalid empty selector"_ with a line number into a virtual file. The actual count was 130 malformed rules, and every one of the app's responsive rules was among them.

The fix is to delete the artifacts, not to relax the resolution order. With `.ts`-first in place and the emitted files gone, the same stylesheet compiles to 43 working media queries and no malformed rules. A leftover `tsconfig.tsbuildinfo` in `packages/ui` is what regenerates them, so it goes too.

Worth knowing if this resurfaces: `externalPackages: []` on the StyleX plugin does _not_ help, because the plugin always runs its own dependency scan. And the `defineVars` tokens — colour, font, space — are unaffected, because emitting a `var(--x)` as a _value_ is what they are for. Only `defineConsts` breaks, which is why the failure looked like a responsive-layout problem rather than a token-resolution one.

**The production build was broken. — fixed** `site-footer.tsx` imported `Facebook`, `Instagram` and `Youtube` from `lucide-react`, and the installed `lucide-react` 1.45.0 does not export them — brand icons were removed from the library. Because `check-types` for the web app runs a full `vite build` before `tsc --noEmit`, this failed the type check. The three marks are now inlined as small SVG components rather than substituted with generic lucide icons, because a camera icon for Instagram would be a different claim than the link makes.

**Ports used to collide; they no longer do. — fixed** Both applications used to default to 4001, and the root dev script runs every app at once, so one always failed to bind. The scheme is now: containers on even ports, dev servers on odd, so a local dev server and a running stack can coexist.

|             | Dev  | Container |
| ----------- | ---- | --------- |
| Site        | 4001 | 4000      |
| Placeholder | 4003 | 4002      |

`BETTER_AUTH_URL` is derived into `trustedOrigins`, so it has to match whichever port is actually bound — miss that and sign-out fails with `INVALID_ORIGIN` while sign-in still appears to work, which is a confusing pair of symptoms worth recognising.

**Dead files with no importers. — fixed** Two middleware files that looked like they provided route protection and did not, a router-link component that was also internally broken, a superseded CMS chrome file of six hundred lines, an unused CMS list screen and profile screen, a pre-design-system navbar, and a "coming soon" route helper every one of whose six pages is now real. All deleted. The under-construction page was kept: it has no production caller either, but it is a tested status-page primitive whose two siblings are in use.

**Orphaned data directories. — fixed** A 270 KB LMDB database from the removed local-file storage backend, and a local SQLite file that nothing referenced — three different documents each claimed a different path for the latter, and none of those paths was the one the code used. Both deleted, along with a schema comment that still described the storage key as "LMDB in dev".

**A production log line printed a username. — fixed** Both lines in the credential bootstrap printed the username, at creation and at rotation. The rotation one fired on _every_ server boot, so it was noise as well as a small disclosure. Removed, with a note explaining why there is deliberately no log there and what replaces the observability.

**One duplicated context construction** in the RPC handler when a request falls through to the OpenAPI route.

## Things that are gone

The repository has been through a large removal. Staff records, student records, class assignments, subject allocation, exam types, grade scales, mark entry and marking workflows were all deleted in one commit, and the teacher credentials moved to a separate project.

What survives of that domain: two schema files referenced only by stale build artifacts, a handful of unused permission factories, a few validation helpers for Sri Lankan phone and identity-card formats, and a large amount of documentation.

The documentation is the worst of it. **Six files in `docs/` describe code that does not exist and, in most cases, never existed on this branch** — an entire staffing guide, a marking guide, a subject-structure guide, an auth guide describing a `teacher` role and env vars that were never committed, a behaviour guide, and a middleware guide describing a file that is not on disk. The infrastructure guide lists five database tables where there are twenty-four, and the readme is still the scaffold's original: it documents an import of a component that does not exist, the wrong port, two of four compose services, and a database mount that the compose file does not create.

If you are new to this project, **do not trust `docs/` except `CLUB_SOCIETIES_POSTS.md` and this file.** The `*-audit.md` files are past-tense records of design work and are worth reading for the reasoning, but their route inventories are out of date.

## Conventions worth keeping

The best thing about this codebase is that comments explain _decisions_, not mechanics. Almost every surprising-looking choice turns out to be load-bearing rather than accidental, and the comment saying so is why. A sample of the reasoning you will find if you go looking:

- Why galleries are global but one club curates them, and why that is the only global-scope table a club touches.
- Why a withdrawn submission is exempt from the check that a reviewed one records who reviewed it — because otherwise withdrawal would require naming the submitter as the reviewer of their own proposal, "a lie in the audit trail".
- Why a pending-proposal uniqueness rule does not prevent a club from queueing five gallery images at once. (SQLite treats nulls as distinct in a unique index, and every creation has no target id.)
- Why a competition result is stored as text rather than a date. (Competitions are logged weeks late, and "2026 Inter-house" is a real value a date field rejects.)
- Why the club-to-administrator binding is a username match, and what that prevents.
- Why `isCover` is derived from the image role rather than being set independently.
- Why a club's own result cannot become a school achievement, in either direction.
- Why the off-site album field is a bare URL rather than a stored embed. (The publisher changes, the terms change, and a stored copy of someone else's page is both stale and theirs.)

A recurring theme is **honesty as a rendering rule.** Where the college has not published a fact, the field is optional and the component renders an honest empty state rather than a placeholder:

- A club with no description shows an empty card, not a `[CMS: description]` marker.
- A house with no published roster promotes its _colour name_ to the heading, so colour is never the only thing identifying it.
- The prefects call-to-action renders **no button at all** when it has no destination. The design shipped `href="#"`; the comment says an honest section beats a dead control.
- The sports list contains exactly the three sports the design names, with a comment noting that adding a plausible-looking fourth would be inventing a fact about the college.

The accessibility work is similarly deliberate rather than incidental: filter chips are real buttons with `aria-pressed` and never a dead filter; result counts live in permanently-mounted live regions; the tablist in the anthem component implements the full arrow-key pattern; every button variant has a 44-pixel minimum target; motion is disabled for reduced-motion preferences _and_ for coarse pointers; and the decorative status illustrations set `animationName: none` under reduced motion, because a clamped infinite animation still ends on an arbitrary frame.

The one security-sensitive piece — the rich-text sanitiser — is genuinely excellent, and worth reading as a model.

## Where things live

A map for when you know what you want and need to find it.

**The server**

| Looking for | Go to |
| --- | --- |
| The router, all its procedures | `packages/api/src/routers/` |
| Who may call what | `packages/api/src/index.ts` — the five procedure tiers |
| Public club and content reads | `packages/api/src/routers/clubs/public.ts` |
| The club admin's own view | `packages/api/src/routers/clubs/scope.ts` |
| The submit endpoints | `packages/api/src/routers/clubs/submissions.ts` |
| The approval logic | `packages/api/src/routers/clubs/apply.ts` |
| Request and proposal payload shapes | `packages/api/src/routers/clubs/payloads.ts` |
| The hardcoded club registry | `packages/api/src/routers/clubs/config.ts` |
| Which things a gallery can link to | `packages/api/src/routers/clubs/link-targets.ts` |
| Turning a `fileId` into a URL | `packages/api/src/routers/clubs/file-urls.ts` |
| The CMS, the block editor endpoints | `packages/api/src/routers/cms/index.ts` |
| Uploads | `packages/api/src/routers/files/` |
| Credential rotation, ban, review queue | `packages/api/src/routers/admin-clubs.ts` |

**The data**

| Looking for | Go to |
| --- | --- |
| Every table, column, index, constraint | `packages/db/src/schema/` — one file per domain |
| Shared field formats | `packages/db/src/schema/primitives.ts` |
| How ids are branded | `packages/db/src/schema/brand.ts` |
| Migration history | `packages/db/src/migrations/` |
| Database connection | `packages/db/src/index.ts` |
| Test database harness | `packages/db/src/testing.ts` |

**Accounts**

| Looking for                      | Go to                              |
| -------------------------------- | ---------------------------------- |
| Roles and permissions            | `packages/auth/src/permissions.ts` |
| The auth instance and plugins    | `packages/auth/src/index.ts`       |
| Credential creation and rotation | `packages/auth/src/admin.ts`       |
| The username rule                | `packages/auth/src/username.ts`    |
| Passphrase generation            | `packages/auth/src/passphrase.ts`  |

**The front end**

| Looking for | Go to |
| --- | --- |
| Routes, and which guard protects each | `apps/web/src/routes/` |
| A public gallery page | `apps/web/src/routes/galleries.$slug.tsx` |
| The public events page | `apps/web/src/routes/events.tsx` |
| The club banner picker | `apps/web/src/components/club/cover-image-picker.tsx` |
| The browser auth client | `apps/web/src/lib/auth-client.ts` |
| The oRPC client and query setup | `apps/web/src/utils/orpc.ts` |
| Server singletons and bootstrap | `apps/web/src/services.ts` |
| Per-request context | `apps/web/src/context.ts` |
| Colour, type, space, motion, z-index tokens | `packages/ui/src/tokens/` |
| Page components | `packages/ui/src/components/` |
| CMS block definitions | `packages/ui/src/content/cms.ts` |
| CMS-to-props resolvers | `packages/ui/src/content/cms-to-*.ts` |
| Shipped copy and fallback content | `packages/ui/src/content/*.ts` |
| The rich-text sanitiser | `packages/ui/src/lib/sanitize-rich-text.ts` |
| The block editor UI | `packages/ui/src/components/cms/homepage-editor.tsx` |
| Shared admin UI kit | `packages/ui/src/components/cms/cms-primitives.tsx` |

**Also worth reading**

- `specs/CLUB-ARCHITECTURE/` — the short product and technical spec for the club system. Accurate, and the fastest way to understand the approval design.
- `docs/CLUB_SOCIETIES_POSTS.md` — the deep dive on clubs, including what a sports implementation would need.
- `AGENTS.md` — the lint and code standards, which are the Ultracite preset.
