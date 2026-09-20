# Students Page Audit — St. Aloysius' College Web

Audit of the Student Life design mock (`Students.dc.html`) and of the site's `/students` route as it stood before this work, followed by what was built.

Companion to `docs/frontend-audit.md` (homepage), `docs/contact-audit.md`, `docs/sign-in-audit.md` and `docs/error-pages-audit.md`. The standards those set — mobile-first StyleX, fluid `clamp()` type, WCAG 2.2 AA, the light-only cream/deep-green palette, 44px minimum targets, no `[CMS: …]` strings in shipped copy, no invented facts — are assumed here rather than restated.

## 0. Baseline

| Area | State before this work |
| --- | --- |
| `/students` route | `comingSoonRoute("Student Life", 35)` — the under-construction page |
| Student-life content on the site | The homepage `StudentLife` bento (`components/home/student-life.tsx`): four photo tiles and three flat colour panels, all label-only |
| Sports / clubs / houses data | None anywhere in the product |
| Design source | `Students.dc.html`, ~90 inline `style` attributes, zero media queries |

Route inventory at the time of writing, so remaining scope stays explicit: `/`, `/about`, `/academics`, `/contact`, `/sign-in`, `/cms/*` are built; `/students` is what this change builds; **`/news`, `/alumni`, `/media`, `/notices` remain `comingSoonRoute` placeholders** and were not in scope.

---

## 1. Responsiveness — blocking in the mock

| # | Issue | Impact |
| --- | --- | --- |
| 1.1 | The sports bento is `grid-template-columns: repeat(6, …)` with `grid-auto-rows: 128px` and `span 4 / span 3` items, and **no media query**. | Below ~1024px the six-column track floor exceeds the viewport and the section scrolls horizontally. At 320px the cricket tile is ~145px wide. |
| 1.2 | `grid-auto-rows: 128px` is a fixed row height driving a _photograph_. | Aspect ratio is whatever the span arithmetic produces at that width — a different crop at every viewport, and the tile cannot grow when the label wraps. |
| 1.3 | Clubs grid is a hard `repeat(4, minmax(0,1fr))` for 8 items. | Each cell is ~56px wide at 320px; "Choir & Eastern Band" wraps to one character per line. |
| 1.4 | Houses grid is a hard `repeat(4, minmax(0,1fr))` with `padding: 44px 24px`. | Same collapse; at 320px the padding alone exceeds the cell's content box. |
| 1.5 | Fixed `padding: 130px 48px 110px` (hero), `120px 48px` (each section), `100px 48px` (CTA). | 96px of a 320px viewport is gutter. No vertical compression on a phone or on a short landscape viewport. |
| 1.6 | All type in fixed `px`: `76px` h1, `54px` h2, `28px` house name, `17px` intro, `10–13px` labels. | The 76px h1 overflows a 320px phone; the same 76px is undersized on a 4K panel. Nothing scales. |
| 1.7 | The prefects CTA row is `display:flex; justify-content:space-between` with `flex-wrap:wrap` but no `align-items` switch. | Once it wraps, the button is stranded against the right edge instead of sitting flush under the copy. |
| 1.8 | Nothing handled above the `1180px` cap. | Same ribbon-on-a-5K-display problem as frontend-audit 1.7. |
| 1.9 | Sticky header is `height: 78px` with eight nav links in a no-wrap flex row. | Pre-existing mock defect, already solved by `SiteHeader`; noted so the mock's header is not re-derived. |

## 2. Accessibility — blocking in the mock (WCAG 2.2 AA)

| # | Issue | WCAG |
| --- | --- | --- |
| 2.1 | Sport names, club names and house names are styled `div`s, not headings. The page has one `h1` and two `h2`s and **no structure at all below them** across 16 named items. | 1.3.1 |
| 2.2 | The sport-name captions sit on `pointer-events:none` overlays above image slots. They read as labels for a control that does not exist; nothing in the bento is focusable or operable. | 4.1.2 |
| 2.3 | The four house swatches are bare `<div>`s coloured by `background`, with the name replaced by `[CMS: house name]`. **Colour is the only carrier of the house's identity.** | 1.4.1 |
| 2.4 | `#3B5BA5` (fourth house) and `#A51919` on `#FFF8E7`, and `rgba(1,52,5,0.45)` placeholder ink, are used for text-sized content without contrast checking. | 1.4.3 |
| 2.5 | "Meet the Prefects →" links to `href="#"`. A primary call to action that navigates nowhere. | 2.4.4 |
| 2.6 | The breadcrumb is a bare `<div>` of links, not a navigation landmark, and its link is a ~15px-tall target. | 2.4.8, 2.5.8 |
| 2.7 | No `<main>`, no skip link, no landmarks — sections carry `data-screen-label`, which is not exposed to assistive tech. | 1.3.1, 2.4.1 |
| 2.8 | `style-hover` is not a real HTML attribute, so **no hover state applies anywhere**, and there is no `:focus-visible` state in the document. | 2.4.7, 2.4.11 |
| 2.9 | `[CMS: intro]`, `[CMS: description]`, `[CMS: house name]`, `HOUSE COLOURS [CMS]`, `[CMS]` would all ship as literal visible text. | 3.1.5 (and plain correctness) |
| 2.10 | The clubs grid is eight sibling `div`s, not a list, so assistive tech cannot announce "8 items" or navigate between them. | 1.3.1 |
| 2.11 | Nav links are `13.5px` text with `padding: 6px 0` → ~26px tall targets. | 2.5.8 |

## 3. Content honesty

| # | Issue |
| --- | --- |
| 3.1 | Every house name is `[CMS: house name]` and every house label is `HOUSE COLOURS [CMS]`. The roster is genuinely unpublished — so the implementation must not invent four house names to fill the grid. |
| 3.2 | Every club carries `[CMS: description]`. Eight real club names, zero real descriptions. |
| 3.3 | "MORE SPORTS — Swimming • Football • Chess • more [CMS]" mixes real data with a marker in one string. |
| 3.4 | The "Meet the Prefects" destination does not exist as a route. Shipping the button anyway would be the same defect as contact-audit 3.1 (a control that teaches the visitor something happened when nothing did). |

## 4. Performance / Core Web Vitals

| # | Issue |
| --- | --- |
| 4.1 | Four unsized image slots in the bento → cumulative layout shift, compounded by the fixed `128px` rows. |
| 4.2 | No `loading`/`decoding`/`fetchpriority` on any slot. |
| 4.3 | The 640px-tall crest watermark is painted at 7% opacity behind the hero and decoded at full cost. |
| 4.4 | ~90 inline `style` attributes: uncacheable, unminifiable, and bypasses the atomic-CSS pipeline the repo already uses. |
| 4.5 | Google Fonts requested per-page from `fonts.googleapis.com` — already solved by the app's self-hosted variable fonts; the mock's `<link>`s must not be carried over. |

---

## 5. What was built

`packages/ui/src/content/students.ts` + `packages/ui/src/components/students/`, rendered by `apps/web/src/routes/students.tsx`.

| Mock section | Implementation | Key change |
| --- | --- | --- |
| Hero | `students-hero.tsx` | Fluid `size4xl` title, breadcrumb promoted to a `<nav>`, four jump links as 44px targets, crest watermark suppressed below 40rem |
| Sports bento | `sports-grid.tsx` | Rebuilt as a stack → 2 columns at 40rem → the 6-column mosaic only at 64rem. Rows are `minmax(10rem, auto)`; photographs sit in `Media` with a reserved `aspect-ratio` box, so CLS is 0 and a wrapped label can never clip |
| Clubs & societies | `clubs-societies.tsx` | A real `<ul>` on `auto-fit / minmax(min(100%, 15rem), 1fr)`; club names are `h3`. Hairlines drawn by a 1px grid gap over a gold background so they never double up at any column count |
| House system | `house-system.tsx` | `<ul>` of four cards. **The swatch is `aria-hidden` decoration; the colour name is real text**, so colour is never the sole carrier (2.3). A published house name renders as the `h3`; until the college publishes one, the colour name carries the card and no name is invented (3.1) |
| Prefects CTA | `prefects-cta.tsx` | Copy and action share a row from 40rem and stack flush-left below it. **The button renders only when an `href` is supplied** — the default is no button rather than a dead `#` link (2.5, 3.4) |

Content rules followed from `content/academics.ts`: every string is a typed constant carrying real copy; facts with no public source (club descriptions, house names) are **optional fields**, so the page degrades to an honest empty state rather than to a placeholder or an invention. The sports list is exactly the set the mock itself names — nothing was added to it.

## 6. Verification

`packages/ui/src/components/students/students-page.test.tsx` covers:

- the `main` landmark and skip-link target,
- exactly one `h1` with every section heading below it an `h2`,
- every jump link resolving to an id that exists in the document,
- `Students` marked `aria-current="page"` in the primary nav,
- all four houses announced by a text label, with a published name preferred over the colour name and no name invented when the roster omits one,
- club descriptions rendering only when supplied,
- the prefects CTA rendering no link at all unless an `href` is passed.

## 7. Known gaps / out of scope

- Photography: the four sports tiles render the branded `Media` placeholder until sources are supplied. The boxes are already reserved, so wiring real images in cannot shift the layout.
- House names, club descriptions and the prefects destination are unpublished and remain optional props awaiting the CMS.
- **No backend changes were made.** The page is static and takes all content as typed props with defaults.
