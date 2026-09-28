# Documentation

## Start here

| Document | What it is |
| --- | --- |
| **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** | The whole system. Read this first — it is current and it explains _why_ things are the way they are. |
| **[`CLUB_SOCIETIES_POSTS.md`](./CLUB_SOCIETIES_POSTS.md)** | Deep dive on the club submission pipeline: how a proposal becomes published content. Current. |
| `../specs/CLUB-ARCHITECTURE/` | The short product and technical spec the club system was built from. Accurate, and the fastest way to understand the approval design. |

## Current, with caveats

| Document | Caveat |
| --- | --- |
| [`infrastructure.md`](./infrastructure.md) | Accurate. Corrected while writing the architecture doc — the schema table listed five tables where there are twenty-four, and the env table listed two variables that do not exist. |

## Historical — read for design reasoning, not for current behaviour

These are past-tense records of work that was done. The reasoning in them is usually still worth having; the route inventories, type names and file paths in them are not current.

| Document | Notes |
| --- | --- |
| `frontend-audit.md` | Pre-CMS audit of the frontend. |
| `sign-in-audit.md` | Sign-in page audit. Several findings are still live — §10.3 (the `BETTER_AUTH_URL` / `trustedOrigins` coupling), §10.4 (stale emitted `.js` shadowing `.tsx`) and the note about `cms-chrome.tsx` having no importers. |
| `news-audit.md`, `contact-audit.md`, `students-audit.md` | All three describe `/students`, `/news`, `/contact`, `/alumni`, `/media` and `/notices` as `comingSoonRoute` placeholders. All six are now real CMS-driven pages. |
| `error-pages-audit.md` | 404 / 500 / under-construction pages. |

## Stale — describes code that does not exist

Each of these carries a banner at the top saying what is wrong. They were kept because deleting documentation loses the reasoning, but nothing in them should be acted on.

| Document | What is wrong |
| --- | --- |
| `staff.md` | The entire student-records, staff, class-assignment and qualification system. Removed in `dd4c45f`. |
| `marking.md` | `schema/marking.ts` and twenty `routers/marking/*` files. Removed in `dd4c45f`. |
| `subjects.md` | `constants/structureVersions/**` and friends. Removed in `dd4c45f`. |
| `middleware.md` | A `site-admin.ts` module that has never existed on this branch. The two middleware files that did exist are now deleted. |
| `auth.md` | Wrong on the env vars, the `databaseHooks`, a `teacher` role, four exported functions, and the permission resources. Right on the cookie prefix, plugin wiring and procedure tiers. |
| `behavior.md` | Wrong on the file-procedure tiers, the `databaseHooks`, and the boot sequence. Right on file deletion order, presigned uploads and the storage key format. |
| `api.md` | Documents a 25-file `routers/staff/` directory, omits four of the five real routers from `appRouter`, and gets the file-upload tiers wrong. |

## Not documented anywhere

Worth knowing if you are about to write it:

- The **test suite** — which parts of the codebase have coverage and which have none. The `ARCHITECTURE.md` "Tests" section covers this.
- **Adding a second club** — the registry constant, what else needs to change. The club deep dive's final section covers it. Note that `index.tsx` and `students.tsx` still hardcode `clubSlug: "photography"` for the featured-media strip, so a second club's images would not reach the homepage until that is parameterised.
- **Adding a sport** — there is no sports data model at all. The club deep dive's "Sports" section covers what exists and what it would take.
