# Error & Status Pages — Audit and Build

Audit of the `ErrorPages.dc.html` mock (404 / Under Construction / 500) and the production implementation derived from it. Companion to `frontend-audit.md`; the same conventions and token system apply. **No backend files were changed.**

---

## 1. Audit of the mock

### 1.1 Responsiveness — blocking

| # | Issue | Impact |
| --- | --- | --- |
| 1.1 | Not one media query in the document. | Every rule below is unconditional at all 24 target widths. |
| 1.2 | `padding:88px 48px` on all three panels. | 96px of the 320px viewport is gutter — a 30% tax on the smallest supported phone. |
| 1.3 | `gap:76px` between artwork and copy, with `flex:0 1 330px` + `flex:1 1 430px`. | Minimum content width is 330 + 76 + 430 = 836px. Below that the flex items wrap but keep the 76px gap, pushing the fold well past the viewport. |
| 1.4 | Artwork fixed at `width:290px;height:290px` inside a `min-height:330px` box. | 91% of a 320px screen; on a 5K panel it is a postage stamp. |
| 1.5 | `min-height:100vh`. | `vh` resolves to the _large_ viewport on iOS Safari and Chrome Android, so the actions sit below the fold while the URL bar is visible. |
| 1.6 | No handling of landscape phones (`max-height` ~360px). | 290px of artwork + 88px padding leaves nothing for the CTA. |
| 1.7 | Some type is `clamp()`, most is fixed px (`16.5px`, `12.5px`, `11px`, `10.5px`). | No fluid scaling; 10.5px is below the practical legibility floor on a 4K TV at viewing distance. |
| 1.8 | Nothing above the implicit `max-width:1060px`. | On 2560/3840/5120/7680 the content is a narrow ribbon centred in empty green. |
| 1.9 | Crest watermark at `right:-150px;bottom:-190px` with no `overflow` containment on the flex parent. | Relies on the section's `overflow:hidden`; the outer `<section>` has it but the footer row does not, so on some widths the document gains horizontal scroll. |

### 1.2 Accessibility — blocking (WCAG 2.2 AA)

| # | Issue | SC |
| --- | --- | --- |
| 2.1 | `style-hover="…"` is not an HTML attribute. **Every hover state in the mock is dead.** There is no `:focus-visible` anywhere either. | 2.4.7, 2.4.11 |
| 2.2 | No `<main>`, no landmarks, no skip link. Three `<section>`s labelled only by `data-screen-label`. | 1.3.1, 2.4.1 |
| 2.3 | Three `<h1>`s in one document, and the `404`/`500`/`Coming Soon` display strings are plain `<div>`s — the status code is visually enormous but invisible to assistive tech. | 1.3.1, 2.4.6 |
| 2.4 | Decorative SVGs are not `aria-hidden` and are focusable in legacy engines — they add dead tab stops and are announced as unlabelled graphics. | 1.1.1, 2.4.3 |
| 2.5 | The 500 screen's status dot carries meaning by colour alone. | 1.4.1 |
| 2.6 | `animation:om-pulse … infinite`, `om-blink`, `om-gear`, `om-bar` and `om-dash` all run forever with **no `prefers-reduced-motion` handling**. Nine simultaneous infinite animations, one of them a blinking dot. | 2.2.2, 2.3.1 |
| 2.7 | Link targets: chips are `padding:9px 16px` on a ~12px font ≈ 30px tall. | 2.5.8 (24px min; 44px is the real-world target) |
| 2.8 | `#FFB203` gold on `#013405` is 8.6:1 (fine), but `rgba(255,248,231,0.5)` footer text on green is ~4.2:1 — under AA for body size. | 1.4.3 |
| 2.9 | The "build progress" bar is a `<div>` animating 14%→72% forever. It has no role, no value, and communicates nothing — pure distraction. | 1.3.1, 2.2.2 |

### 1.3 Correctness, SEO and content

| # | Issue |
| --- | --- |
| 3.1 | Unresolved CMS placeholders shipped in the markup: `[CMS: %]`, `[CMS: error id]`, `[CMS: timestamp]`. |
| 3.2 | Nothing sets the HTTP status. As a static page this is a **soft 404** — the URL gets indexed and dead links stay alive in search results. |
| 3.3 | No `<title>`, `description` or `robots` per screen; all three share one document head. |
| 3.4 | The error reference is presented as decoration rather than as a selectable value support can be read back. |
| 3.5 | Recovery is five inline links. No header, no nav, no search, no footer contact details — on the one page where the visitor is already lost. |
| 3.6 | Fonts loaded from `fonts.googleapis.com` at render time; the production site self-hosts. A third-party stylesheet on the error page is the request most likely to fail when the site is already failing. |
| 3.7 | `<link rel="preconnect">` without the matching `fonts.gstatic.com` origin, so it saves nothing. |

---

## 2. What was built

| File | Purpose |
| --- | --- |
| `packages/ui/src/components/status/status-page.tsx` | Shared shell: header, layout, actions, chip row. |
| `packages/ui/src/components/status/status-illustration.tsx` | The three inline SVG artworks and their motion. |
| `packages/ui/src/components/status/not-found-page.tsx` | 404. |
| `packages/ui/src/components/status/under-construction-page.tsx` | Coming soon. |
| `packages/ui/src/components/status/server-error-page.tsx` | 500. |
| `packages/ui/src/components/status/status-pages.test.tsx` | 10 tests covering headings, landmarks, recovery links and the progress indicator. |
| `apps/web/src/routes/__root.tsx` | `notFoundComponent` + `errorComponent` wiring. |
| `apps/web/src/routes/-coming-soon.tsx` | Route factory (the `-` prefix keeps it out of route generation). |
| `apps/web/src/routes/{about,academics,students,news,alumni,media,contact,notices}.tsx` | The eight header nav targets that previously 404'd. |
| `apps/web/src/index.css` | `<progress>` fill, the one rule StyleX cannot express. |

### 2.1 Resolutions

**Responsive.** Mobile-first throughout, using the existing `bp` scale. One column to 64rem, artwork beside copy above it. Gutters are `space.gutter` (20px → 64px fluid), type is the token `clamp()` scale, the artwork is `min(100%, clamp(11rem, 46vw, 22rem))`, the column caps at `space.content` and re-widens to `space.contentWide` at `bp.ultra` so 4K/5K/8K panels are used rather than letterboxed. Both grid tracks are `minmax(0, …)`, so nothing can force horizontal scroll. `100svh` replaces `100vh`, and `min-block-size` rather than `block-size` means content longer than the viewport scrolls instead of clipping. On landscape phones (`bp.short`) the artwork is removed entirely so the actions stay above the fold.

**Accessibility.** One `<h1>` per screen, and the status code is _in_ it ("Error 404 — we couldn't find that page"); the giant numeral is `aria-hidden` decoration. `<main id="main-content" tabIndex={-1}>` with the shared `SkipLink`. Artwork is `aria-hidden` + `focusable="false"`. Suggestions are a real `<nav>` + `<ul>` so the count is announced. All interactive targets are ≥44px. Hover states are real CSS and the global `:focus-visible` ring applies. Every animation is switched off — `animationName: none`, not merely shortened — under `bp.reducedMotion`, and the blinking status dot is paired with the word "Reference" so colour is never the sole carrier.

**Semantics and SEO.** 404 goes through the router's `notFoundComponent`, so the response carries a real 404. The coming-soon routes return 200 with `noindex, follow` and a per-section `<title>` and description. The build indicator is a native `<progress>` with a real value — or absent when the value is unknown — instead of a bar animating forever.

**Resilience.** The 500 screen renders from the error boundary and reads no loader data, query client or router context, since any of those may be what failed. Its reference id comes from `error.digest` (falling back to `error.name`); the error _message_ is never shown, as it can leak internals. The timestamp is only rendered when the server supplies one — defaulting to `new Date()` during render is a genuine hydration mismatch that makes React discard the server HTML for that subtree. The reference block is `user-select: text` and `overflow-wrap: anywhere` so a support agent can be read a long id on a phone.

**Recovery.** All three screens carry the site header — an error page without navigation is a dead end, and the header menu is the fastest way out. There is deliberately **no footer**: it is a second, longer set of links below the fold that pushes the screen past one viewport and buries the message. The two actions plus the "try instead" shortcuts are the recovery path, and contact is one of them. `SiteHeader` is presentational and holds no data, so it is safe inside an error boundary.

**One screen on desktop.** From `bp.xl` (64rem) the shell is pinned to exactly `100svh`, so the page itself never scrolls and the whole composition reads as a single screen. `<main>` gets `min-block-size: 0` — a flex child otherwise refuses to shrink below its content and would restore the page scrollbar — and `overflow-y: auto`, so an unusually short desktop window (a 1280×600 split screen) scrolls _inside_ that region rather than clipping the actions. Below 64rem the shell stays `min-block-size: 100svh` and grows with its content, which is what phones need.

### 2.2 Verification

- `apps/web` production build: passes.
- `@aloysius/ui` type-check: passes.
- `oxlint` on all new files: clean.
- `@aloysius/ui` tests: 10 new, all passing.

### 2.3 Follow-ups (not done, needs a decision)

- The coming-soon percentages are hard-coded per route. They should come from the CMS once a "section publish state" field exists — that is a backend change and was deliberately not made.
- `reference` currently degrades to `error.name` when there is no `digest`. A real correlation id needs the server to generate and log one; the prop is already in place for it.
