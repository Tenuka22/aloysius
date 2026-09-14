# Frontend Audit — St. Aloysius' College Web

Audit of the homepage design mock (`Homepage.dc.html`) and the current `apps/web` frontend, performed before the production build-out.

## 0. Baseline

| Area | State before this work |
| --- | --- |
| `apps/web` route tree | One route (`/`) rendering `HelloWorld` |
| Design system | None. Colours hard-coded per file (`apps/building/src/App.tsx`) |
| Theming | `color-scheme: light` forced in `index.css`; no dark mode |
| Typography | `system-ui` only in web; Poppins/Libre Baskerville in `building` |
| Icons | None |
| Animation | `motion` + `lenis` installed, only `lenis` used |
| Responsive strategy | None |

So the audit below is mostly of the **mock**, which is what the production markup had to be derived from.

---

## 1. Responsiveness — blocking

| # | Issue | Impact |
| --- | --- | --- |
| 1.1 | Every layout uses fixed multi-column `grid-template-columns` (`repeat(4,…)`, `1fr 380px`, `340px 1fr`, `2px 1fr 440px`) with **no media queries at all**. | Below ~900px every section overflows horizontally. Unusable on all 24 target breakpoints under 1024px. |
| 1.2 | Horizontal padding is a fixed `48px` on every section, including the 78px-tall header. | On a 320px viewport that is 30% of the screen. Content column collapses to ~224px. |
| 1.3 | Header nav is a single flex row of 8 links + CTA, `margin-left:auto`, no wrap, no drawer. | Nav overflows the viewport below ~1100px. No mobile navigation exists. |
| 1.4 | Type is set in fixed `px` (`58px`, `54px`, `52px`, `44px`, `32px` headings). Only the hero uses `clamp()`. | No fluid scaling; headings clip or dominate on small and ultra-wide screens alike. |
| 1.5 | Bento grid (`student life`) uses `grid-auto-rows:128px` with `span 3` items. | Fixed row height ignores content and aspect ratio; breaks on every non-desktop width. |
| 1.6 | `height:92vh` on the hero. | `vh` is wrong on mobile browsers with collapsing URL bars — causes the classic iOS jump. Needs `svh`/`dvh`. |
| 1.7 | Nothing above 1180px `max-width` is handled. | On 2560/3840/5120/7680 displays the page is a narrow ribbon with vast empty margins and no scale-up. |

## 2. Accessibility — blocking (WCAG 2.2 AA)

| # | Issue | WCAG |
| --- | --- | --- |
| 2.1 | Section labels use `data-screen-label`, not landmarks/headings. No `<main>`, no skip link. | 1.3.1, 2.4.1 |
| 2.2 | The header logo `<a>` has duplicate `style` attributes and nav links carry a non-standard `style-hover` attribute — **hover styling never applies in a browser**, and there is no `:focus-visible` state anywhere in the document. | 2.4.7 |
| 2.3 | Decorative crest `<img alt="">` is fine, but the notice strip's status dot is a bare `<span>` with colour as the only meaning carrier. | 1.4.1 |
| 2.4 | `#FFB203` gold on `#013405` green, and gold on `#FFF8E7` cream (footer/links) — gold-on-cream is ~1.9:1. | 1.4.3 |
| 2.5 | Social links are `<span>` elements, not links/buttons: not focusable, not announced. | 4.1.2 |
| 2.6 | "Category chips" on the achievement wall look interactive (hover style) but are `<span>`s with no role, no state. | 4.1.2 |
| 2.7 | Achievement/news cards wrap a whole block in `<a>` with no accessible name distinct from the visible text and no `:focus` outline. | 2.4.4 |
| 2.8 | No `prefers-reduced-motion` handling, while Lenis smooth-scroll is globally enabled in the app. Lenis also hijacks keyboard paging. | 2.3.3, 2.1.1 |
| 2.9 | Heading order: `h1` then several `h2`s is fine, but card titles are styled `div`s — no programmatic structure. | 1.3.1 |
| 2.10 | Target sizes: nav links are 13.5px text with `padding:6px 0` → ~26px tall. | 2.5.8 (24×24 min, marginal) |

## 3. Performance / Core Web Vitals

| # | Issue |
| --- | --- |
| 3.1 | Google Fonts loaded from `fonts.googleapis.com` with `preconnect` but no `preload`/`display=swap` discipline in the real app → render-blocking + FOIT, plus a third-party RTT on every visit. Self-hosting is strictly better here. |
| 3.2 | Two font families × 5 weights × italic requested. Massive unused-glyph payload. |
| 3.3 | Hero background image has no dimensions, no `fetchpriority`, no `srcset` → guaranteed LCP + CLS penalty. |
| 3.4 | Every other image slot is unsized → cumulative layout shift across ~15 images. |
| 3.5 | Full-bleed crest watermarks are 640px-tall PNGs at 6-7% opacity — decoded at full cost for a near-invisible effect. |
| 3.6 | No `loading="lazy"` / `decoding="async"` anywhere. |
| 3.7 | ~1,100 inline `style` attributes: uncacheable, unminifiable, and defeats the atomic-CSS pipeline the repo already uses (StyleX). |

## 4. Correctness / markup

| # | Issue |
| --- | --- |
| 4.1 | Duplicate `style` attribute on the header brand link — second one is silently dropped. |
| 4.2 | `z-index:-1` on the principal portrait frame with no stacking context → the frame renders behind the section background, not behind the image. |
| 4.3 | `[CMS: …]` placeholders are inline in copy strings; they would ship to production as literal text. |
| 4.4 | The sticky header has no scrolled state and no backdrop, so cream content slides under a hard green bar with no separation. |
| 4.5 | No `<html lang>`-aware typography for Sinhala/Tamil, on a Sri Lankan trilingual school site. |
| 4.6 | No dark mode. *Resolved as a product decision rather than a defect:* the site is **light-only**. The cream/deep-green palette is the brand, and inverting it produced a page that no longer read as St. Aloysius'. There is no dark theme and no theme switch. |

## 5. SEO

| # | Issue |
| --- | --- |
| 5.1 | No Open Graph / Twitter card meta. |
| 5.2 | No canonical URL. |
| 5.3 | No structured data — a school homepage should emit `EducationalOrganization` JSON-LD. |
| 5.4 | Single `h1` present (good) but section headings are stylistic, not semantic. |

---

## 6. Defects found during implementation

These were found by driving the built site in a real browser (Playwright), not by reading the code, and all four were silent - the page looked plausible in a screenshot while being broken.

| # | Defect | Cause | Fix |
| --- | --- | --- | --- |
| 6.1 | Every image rendered at its intrinsic size; the 640px crest blew the header out to ~870px at a 320px viewport. | The reset in `index.css` was **unlayered**, and unlayered CSS beats every `@layer`. `img { height: auto }` therefore overrode every StyleX height in the app. | Declared the layer order explicitly and moved the reset into a `reset` layer below StyleX's `priority1..9`. |
| 6.2 | With `prefers-reduced-motion: reduce`, whole sections rendered blank. | `motion`'s `initial={{opacity: 0}}` is serialised into the SSR HTML as an inline style. On the client the reduced-motion branch rendered a plain `<div>`, and React does not reconcile that inline style away during hydration - so the content stayed at `opacity: 0` forever. | Replaced the library reveal with an `IntersectionObserver` reveal that applies its hidden state **client-side only**, in a layout effect. SSR output is always the final visible state. |
| 6.3 | Theme switching threw `InvalidCharacterError` on every hydration. | `stylex.props(theme).className` returns a _space-separated list_; `classList.add`/`remove` reject tokens containing whitespace. | `themeClassNames()` returns a split array; callers spread it. |
| 6.4 | The footer rendered 2 columns at 1440px instead of 4. | StyleX de-duplicates atomic classes globally, so the emission order of two overlapping `min-width` rules for the same property depends on which component used that value first - not on breakpoint size. The `40rem` rule was emitted after the `64rem` one and won. | Bounded bands (`mdToXl` etc.) wherever one property is set at two breakpoints, so only one rule can ever match. |

## 7. Platform constraints worth knowing

- **StyleX rewrites media queries to range syntax** (`@media (width >= 40rem)`). That is Chrome 104+, Firefox 102+, Safari 16.4+. Older Safari (iOS 15-16.3) falls back to the un-queried base styles - which, because the build is mobile-first, means those users get the phone layout rather than a broken one. This is not configurable in StyleX 0.19.
- **`bun x vite build` without `NODE_ENV=production`** emits a bundle compiled against the _development_ JSX runtime, and the server then dies with `jsxDEV is not a function`. Pre-existing, unrelated to this work, but it means the production build must be run with `NODE_ENV=production`.

## 8. What was implemented

1. **Design-token layer** (`packages/ui/src/tokens/`) — StyleX `defineVars` for the brand palette, fluid type scale, spacing, radii, shadows, motion durations, and z-index; `defineConsts` for the breakpoint set. A single light theme - `color-scheme: light` is declared so browsers do not auto-darken controls.
2. **Mobile-first rebuild** of every section: single-column at 320px, progressively enhanced with `minmax()`/`auto-fit` fluid grids, container queries on cards, and a max content width that scales up to 4K+ instead of stopping at 1180px.
3. **Fluid typography** — every size is `clamp()`; no fixed `px` type remains.
4. **Accessible navigation** — landmarks, skip link, a focus-trapped mobile drawer, `:focus-visible` rings on every interactive element, real `<button>`/`<a>` elements for chips and social links, 44px minimum targets.
5. **Performance** — self-hosted variable fonts (2 files), every image sized with `aspect-ratio` + `loading`/`decoding`/`fetchpriority`, zero inline styles.
6. **Motion** — `motion` scroll reveals that fully disable under `prefers-reduced-motion`; Lenis gated on the same query.
7. **SEO** — OG/Twitter meta, canonical, and `EducationalOrganization` JSON-LD.

## 9. Verification

Driven with Playwright against the production build:

- **Zero horizontal overflow** at all 22 target widths from 320px to 3840px.
- **Zero console/page errors** on load and hydration.
- **No interactive target below 24x24** (everything is on a 44px grid).
- **Every `<img>` has an `alt`**.
- **Keyboard**: the skip link is the first Tab stop; the drawer opens with focus moved inside, stays contained, and Escape closes it and restores focus.
- **Light-only enforced**: under an emulated `prefers-color-scheme: dark` the body
  still renders cream (`#fff8e7`), and the built CSS contains zero
  `prefers-color-scheme` rules.
- Section-by-section visual checks at 390px, 768px and 1440px.

## 10. Known gaps / out of scope

- Content is still placeholder-driven: every section takes typed props with defaults, ready for the CMS. **No backend changes were made.**
- Only the homepage was built. `About`, `News`, `Admissions` in the mock remain unimplemented routes.
- Real photography is required; image slots render a branded placeholder until sources are supplied.
