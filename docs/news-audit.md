# News Page Audit — St. Aloysius' College Web

Audit of the News & Events design mock (`News.dc.html`) and of the site's `/news` route as it stood before this work, followed by what was built.

Companion to `docs/frontend-audit.md` (homepage), `docs/students-audit.md`, `docs/contact-audit.md`, `docs/sign-in-audit.md` and `docs/error-pages-audit.md`. The standards those set — mobile-first StyleX, fluid `clamp()` type, WCAG 2.2 AA, the light-only cream/deep-green palette, 44px minimum targets, no `[CMS: …]` strings in shipped copy, no invented facts — are assumed here rather than restated.

## 0. Baseline

| Area | State before this work |
| --- | --- |
| `/news` route | `comingSoonRoute("News", 55)` — the under-construction page |
| News content on the site | The homepage `News` strip (`components/home/news.tsx`): one featured story + four headlines |
| Story data | A 5-item array **duplicated verbatim** in `routes/index.tsx` and `routes/preview/$versionId.tsx` |
| Events / calendar data | None anywhere in the product |
| Design source | `News.dc.html`, ~120 inline `style` attributes, zero media queries |

Route inventory at the time of writing, so remaining scope stays explicit: `/`, `/about`, `/academics`, `/students`, `/contact`, `/sign-in`, `/cms/*` are built; `/news` is what this change builds; **`/alumni`, `/media`, `/notices` remain `comingSoonRoute` placeholders** and were not in scope.

---

## 1. Responsiveness — blocking in the mock

| # | Issue | Impact |
| --- | --- | --- |
| 1.1 | The story grid is `grid-template-columns: repeat(3, minmax(0,1fr))` with a `40px 32px` gap and **no media query**. | Below ~900px the three tracks are narrower than their own headlines. At 320px each card is ~72px wide. |
| 1.2 | The featured block is `minmax(0,1.5fr) minmax(0,1fr)` with `gap:56px`, also unqueried. | The copy column collapses below the width of a single word well before the phone range. |
| 1.3 | `align-items: end` on the featured grid. | Even at desktop width the copy is pinned to the bottom of a 460px image, leaving a large gap above it whenever the excerpt is short. |
| 1.4 | The events rows are a hard `120px 1fr auto` three-column grid with `gap:40px`. | At 320px the 120px badge and 40px gaps leave ~80px for the event title and the "Details" button. |
| 1.5 | Fixed `padding: 110px 48px 70px` (hero) and `90px 48px` / `110px 48px` (sections). | 96px of horizontal gutter out of a 320px viewport. No vertical compression on a phone or a short landscape viewport. |
| 1.6 | All type in fixed `px`: `72px` h1, `50px`/`44px` h2, `25px` card titles, `10.5–13px` labels. | The 72px h1 overflows a 320px phone and is undersized on a 4K panel. Nothing scales. |
| 1.7 | The category chip row is a `flex-wrap` row of seven chips inside the hero. | It does wrap — but each chip is a ~34px-tall non-control, and the row it wraps into has no row-gap. |
| 1.8 | The image slots are fixed `height:460px` and `height:230px`. | Fixed pixel heights driving photographs: a different crop at every viewport, and no aspect-ratio box. |
| 1.9 | Nothing handled above the `1180px` cap. | Same ribbon-on-a-5K-display problem as frontend-audit 1.7. |

## 2. Accessibility — blocking in the mock (WCAG 2.2 AA)

| # | Issue | WCAG |
| --- | --- | --- |
| 2.1 | **The category filters are `<span onClick>`.** Not focusable, no role, no `aria-pressed`, unreachable by keyboard, switch or voice control. The page's primary interaction is inoperable. | 2.1.1, 4.1.2 |
| 2.2 | **The pagination controls are `<span>`s too**, and the "next" control's entire content is a bare `→` glyph — no accessible name at all. The current page is marked by background colour only, with no `aria-current`. | 2.4.4, 4.1.2, 1.4.1 |
| 2.3 | Card titles are styled `div`s. The grid of six stories contributes **no headings at all** below the page's `h1`/`h2`s. | 1.3.1 |
| 2.4 | No `<main>`, no skip link, no landmarks — sections carry `data-screen-label`, which is not exposed to assistive tech. | 1.3.1, 2.4.1 |
| 2.5 | The breadcrumb is a bare `<div>` of links, not a navigation landmark, and its link is a ~15px-tall target. | 2.4.8, 2.5.8 |
| 2.6 | Filtering replaces the grid with no live-region announcement. A screen-reader user pressing a filter gets silence. | 4.1.3 |
| 2.7 | `style-hover` is not a real HTML attribute, so **no hover state applies anywhere**, and there is no `:focus-visible` state in the document. | 2.4.7, 2.4.11 |
| 2.8 | `#FFB203` gold is used for text on the cream surface (~1.9:1), and `rgba(1,52,5,0.45)` meta ink is used at 10.5px. | 1.4.3 |
| 2.9 | The featured block has three separate links to the same destination (image, headline, "Read the Story"), two of which have no distinct accessible name. | 2.4.4 |
| 2.10 | "Read the Story", "Details" and "1/2/3" are non-descriptive link and control names when read out of context in a links list. | 2.4.4 |
| 2.11 | Nav links are `13.5px` text with `padding: 6px 0` → ~26px tall targets. | 2.5.8 |
| 2.12 | The filter control sits in the hero and mutates a grid two sections below it — off-screen on a phone when pressed. | 3.2.2 |

## 3. Correctness and content honesty

| # | Issue |
| --- | --- |
| 3.1 | **The filter is structurally broken.** Seven fixed chips (`ALL` + six categories) are offered against six stories that carry one category each — so five of the seven filters render a grid of exactly one card, and the mock has **no empty state at all** for a filter that matches nothing. |
| 3.2 | **Pagination is decorative.** Three page numbers and a "next" arrow are drawn unconditionally, over a single hard-coded page of six items. None of them do anything. |
| 3.3 | Every date is the literal string `[CMS: date]`, and every event badge is `[dd]` / `[MON]`. These would ship as visible text. |
| 3.4 | Every headline ends in `[CMS]`, and the featured excerpt is `Short excerpt of the featured story. [CMS: excerpt]`. |
| 3.5 | Every story, every "Details" button, the "Read the Story" link and the "College Calendar" link are `href="#"` — controls that navigate nowhere. |
| 3.6 | The mock's `ACHIEVEMENTS` category does not exist in the product's `NewsCategory` union. |
| 3.7 | The college has published no events calendar. Three `[CMS]` placeholder rows must not become three invented events. |

## 4. Performance / Core Web Vitals

| # | Issue |
| --- | --- |
| 4.1 | Seven unsized image slots (one 460px hero + six 230px cards) → cumulative layout shift across the whole page. |
| 4.2 | No `loading`/`decoding`/`fetchpriority` on any slot; the featured image is the LCP element and is not prioritised. |
| 4.3 | ~120 inline `style` attributes: uncacheable, unminifiable, and bypasses the atomic-CSS pipeline the repo already uses. |
| 4.4 | Google Fonts requested per-page from `fonts.googleapis.com` — already solved by the app's self-hosted variable fonts; the mock's `<link>`s must not be carried over. |
| 4.5 | The story list is re-declared per page rather than shared, so the homepage and the archive can drift. |

---

## 5. What was built

### Structure

| File | Role |
| --- | --- |
| `packages/ui/src/content/news.ts` | All copy, the `NewsStory` / `CollegeEvent` types, the canonical story list, and `formatEventDate` |
| `packages/ui/src/components/news/news-hero.tsx` | Breadcrumb landmark, `h1`, intro |
| `packages/ui/src/components/news/featured-story.tsx` | The lead story |
| `packages/ui/src/components/news/news-archive.tsx` | Filter, grid, pagination, empty states |
| `packages/ui/src/components/news/upcoming-events.tsx` | The calendar strip |
| `packages/ui/src/components/news/news-page.tsx` | Composition: skip link, header, `<main>`, footer |
| `apps/web/src/routes/news.tsx` | Route, page metadata, role-gated nav items |

### Responsiveness

- Story grid: 1 column → 2 at `40rem` → 3 at `64rem`, all tracks `minmax(0, 1fr)` so a long headline can never force overflow.
- Featured block: single column to `64rem`, then `1.5fr / 1fr`, with `align-items: center` replacing the mock's `end`.
- Event rows: `auto / 1fr` on a phone with the action dropping to its own full-width line, becoming `7.5rem / 1fr / auto` at `48rem`.
- Every fixed `px` padding replaced by the fluid `space.section` / `space.gutter` steps; every fixed `px` font size by the `clamp()` scale.
- Image boxes are `aspect-ratio: 3/2` via the shared `Media` primitive, not fixed heights.

### Accessibility

- Filters are real `<button>`s with `aria-pressed`, inside a `<fieldset>` whose visually-hidden `<legend>` names the group. 44px minimum height.
- Pagination is a labelled `<nav>` of buttons with `aria-label="Page N"` and `aria-current="page"`; the next control is labelled and is genuinely `disabled` on the last page.
- Card titles are `h3`s under the section `h2`; the page has exactly one `h1`.
- An `<output aria-live="polite">` announces "Showing N of M stories, page X of Y" after every filter or page change.
- Changing page moves focus to the results container, so a keyboard user is not stranded at the bottom of a grid that silently replaced itself.
- The featured block is one focus stop: the image link is `aria-hidden` and removed from the tab order, and "Read the story" carries a visually-hidden `: <headline>` suffix.
- `<main>`, a skip link, and a breadcrumb `<nav>` — matching the other built pages.
- The filter now lives with the archive it controls, not in the hero (mock issue 2.12).

### Correctness and honesty

- **Categories are derived from the stories present**, so a filter that matches nothing can no longer be offered (3.1).
- **Pagination renders only when there is a second page** (3.2), and the current page is clamped when a filter shrinks the result set below it.
- Two distinct empty states: "No stories published yet" (nothing in the archive) and "No stories in this category yet" (filter matched nothing).
- No `[CMS: …]`, `[dd]` or `[MON]` strings anywhere — a test asserts the rendered page contains none.
- Dates are optional: a story without a recorded date renders without one rather than with a guessed one, and an event whose date will not parse is dropped rather than rendered as "NaN".
- `"Achievements"` was added to the `NewsCategory` union (3.6).
- `COLLEGE_EVENTS` is empty and the section renders its empty state — no invented events (3.7).
- "Details" appears only when an event has a real destination; no `href="#"` ships.
- The duplicated story arrays in `routes/index.tsx` and `routes/preview/$versionId.tsx` were replaced by imports of `NEWS_STORIES` / `FEATURED_STORY`, so the homepage and the archive cannot drift (4.5).

### Performance

- The featured image is marked `priority` (eager, `fetchpriority="high"`); every other image is `loading="lazy" decoding="async"`, via the shared `Media` primitive.
- All boxes reserved by `aspect-ratio`, so CLS from the seven image slots is 0.
- Filtering and pagination are client state over data already in the document — no round trip, and the server-rendered HTML contains the full first page for crawlers and no-JS visitors.
- Zero inline `style` attributes; all styling goes through StyleX's atomic pipeline.

### Verification

- 18 new tests in `packages/ui/src/components/news/news-page.test.tsx`; the UI suite is 62 passing.
- `tsc --noEmit` clean for `packages/ui` and `apps/web`; `ultracite` clean on all new files; `vite build` succeeds.
- **Known pre-existing failure, not introduced here and not fixed here:** `bun run build` in `apps/web` runs `tsc -b ../../packages/api` first, which fails with `packages/api/src/index.ts(89,11): TS2769` — the `"teacher"` role is not in the `better-auth` role union. Verified present on a clean tree with this work stashed. It is backend code and was left untouched.

---

## 6. Not in scope

- `/alumni`, `/media`, `/notices` remain `comingSoonRoute` placeholders.
- Individual story pages: every story still links to `/news` because no story route exists. When one is added, only `content/news.ts` changes.
- Wiring stories and events to the CMS. The components are already prop-driven and default to the static content, so the route is the only place that needs to change.
- The `packages/api` role-union type error above.
