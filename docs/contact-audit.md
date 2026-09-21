# Contact Page Audit — St. Aloysius' College Web

Audit of the Contact design mock (`Contact.dc.html`) and of the site's Contact route as it stood before this work, followed by what was built. Companion to `docs/frontend-audit.md` (homepage), `docs/sign-in-audit.md` and `docs/error-pages-audit.md`; the standards those set — mobile-first StyleX, fluid type, WCAG 2.2 AA, light-only palette, no `[CMS: …]` strings in shipped copy — are assumed here rather than restated.

## 0. Baseline

| Area | State before this work |
| --- | --- |
| `/contact` route | `comingSoonRoute("Contact", 70)` — the under-construction page |
| Contact details anywhere on site | Footer only, and only when the CMS supplies them |
| Enquiry form | None anywhere in the product |
| Design source | `Contact.dc.html` mock, ~120 inline `style` attributes, zero media queries |

Route inventory at the time of writing, so the remaining scope is explicit: `/` , `/about`, `/academics`, `/sign-in`, `/cms/*` are built; `/contact` is what this change builds; **`/students`, `/news`, `/alumni`, `/media`, `/notices` are still `comingSoonRoute` placeholders** and were not in scope.

---

## 1. Responsiveness — blocking in the mock

| # | Issue | Impact |
| --- | --- | --- |
| 1.1 | `grid-template-columns: minmax(0,420px) minmax(0,1fr)` with `gap:80px` and **no media query**. | Below ~1000px the details column and the form are both squeezed; at 320px the form column is ~90px wide. |
| 1.2 | The form's own field grid is a hard `1fr 1fr`. | Name and Email are each under 140px wide on a phone — narrow enough that you cannot read back what you typed. |
| 1.3 | Fixed `padding:52px 48px` on the form card, `100px 48px` on the section, `110px 48px 90px` on the hero. | On a 320px viewport the card is mostly padding; 96px of the 320px width is gutter. |
| 1.4 | All type in fixed `px` (`72px` h1, `38px` h2, `15.5px` values, `11px` labels). | No fluid scaling: the 72px h1 overflows a 320px phone and is undersized on a 4K panel. |
| 1.5 | Map slot is `height:260px` with `position:absolute;inset:0` children. | Fixed height ignores the column width, so the map is a different crop at every viewport. |
| 1.6 | Nothing handled above the `1180px` cap. | Same ribbon-on-a-5K-display problem as the homepage mock (frontend-audit 1.7). |

## 2. Accessibility — blocking in the mock (WCAG 2.2 AA)

| # | Issue | WCAG |
| --- | --- | --- |
| 2.1 | **The submit control is a `<span>`** with `cursor:pointer`. Not focusable, not announced, not operable by keyboard, switch or voice. | 2.1.1, 4.1.2 |
| 2.2 | The form is not a `<form>`. No submit event, no Enter-to-submit, no grouping. | 1.3.1 |
| 2.3 | No validation, no error messages, no `aria-invalid`/`aria-describedby`, no success or failure feedback of any kind. | 3.3.1, 3.3.3, 4.1.3 |
| 2.4 | `<label>` wraps the control, but the visible label text is a `<span>` — fine — while the **required** state is never expressed, visually or programmatically. | 3.3.2 |
| 2.5 | Inputs are `14px`. Under 16px, iOS Safari zooms the viewport on focus and leaves the user pinched into the form. | 1.4.4 (practical) |
| 2.6 | Contact details are `div`/`div` label-value pairs, so the pairing is invisible to assistive tech; the telephone and email are plain text, not `tel:`/`mailto:` links. | 1.3.1, 2.1.1 |
| 2.7 | "VIEW ON MAP" is a `<div>` with `pointer-events:none` over an image slot — it looks like the primary affordance and does nothing. | 4.1.2 |
| 2.8 | No `:focus-visible` anywhere; `outline:none` is set on every input. | 2.4.7, 2.4.11 |
| 2.9 | Breadcrumb is a bare `<div>` of links, not a navigation landmark, and its link is a ~16px-tall target. | 2.4.8, 2.5.8 |
| 2.10 | `[CMS: telephone]`, `[CMS: email]`, `[CMS: office hours]`, `[CMS: routing]` would ship as literal visible text. | 3.1.5 (and simple correctness) |
| 2.11 | `style-hover` attributes again — not a real attribute, so no hover state actually applies. | — |

## 3. Privacy / correctness

| # | Issue |
| --- | --- |
| 3.1 | A form with no endpoint and a fake-looking "SEND MESSAGE" button teaches visitors their enquiry was received when nothing was sent. This is the single most damaging defect in the mock, and the one the implementation refuses to reproduce. |
| 3.2 | No `autocomplete` attributes, so browsers cannot fill name/email. |
| 3.3 | No `maxlength` on any field. |

---

## 4. What was implemented

New files — `packages/ui/src/content/contact.ts`, `packages/ui/src/components/contact/{contact-page,contact-hero,contact-details,contact-form}.tsx`, tests in `contact-page.test.tsx`, and the route `apps/web/src/routes/contact.tsx`. **No backend change was made.**

1. **Layout.** One column at 320px. The details list splits into two columns only between 40rem and 64rem (a bounded band — `bp.mdToXl`, per frontend-audit 6.4), where the page is still single-column and four short rows would otherwise strand space. Details and form share a row from 64rem (`minmax(0, 24rem) minmax(0, 1fr)`, widening at 80rem) — both tracks `minmax(0, …)` so a long email address can never push the grid past the viewport. The form's own field grid stays one column until 40rem.
2. **Type and rhythm.** Every size is a `clamp()` token; the card's padding is `clamp(1.25rem, 0.9rem + 2vw, 3rem)`; section rhythm and gutters are the shared `space.section`/`space.gutter` tokens, so 320px → 7680px is continuous.
3. **The form is a real form.** `<form>` + `<button type="submit">`, Enter-to-submit, `noValidate` with validation in code (native bubbles are inconsistently announced and cannot be styled to contrast), per-field errors wired with `aria-invalid` + `aria-describedby`, focus moved to the first failing field on submit, one permanently-mounted `<output aria-live="polite">` for the outcome, 44px targets, 16px-minimum input text, `autocomplete` and `maxLength` on every field.
4. **Honest submit path.** `ContactForm` takes an optional `onSubmit(values) => Promise<void>`. The route does **not** pass one, because no enquiry endpoint exists and no backend work was in scope. A valid submit therefore says, in the live region, that the message was _not_ sent and points the visitor at the office details beside it. Wiring the page up later is one prop. Sent / failed / not-connected are three distinct messages, and a failure keeps the typed text so it can be retried.
5. **Details as data.** `<dl>` with icons, `tel:` (digits-only href — spaces and brackets are invalid and some Android dialers drop the call) and `mailto:` links. Address, telephone, email, office hours, map URL and map image are all optional props; anything the CMS has not supplied is **omitted**, never rendered as an empty row or a placeholder string. The map badge is a real external link when a URL exists and a plain, non-interactive caption when it does not.
6. **Hero.** The shortest hero on the site — Contact is a task page, so the form is reachable without scrolling on a 1366×768 laptop. Crest watermark is suppressed below 40rem where it would sit behind the title. Breadcrumb is a `<nav aria-label="Breadcrumb">` with a 24px (44px on coarse pointers) target.
7. **Motion.** The only animation is the submit spinner, which slows to 2.4s under `prefers-reduced-motion` rather than stopping — a stopped spinner stops meaning "working".

### 4.8 Second pass on the form card

Reviewed on screen, the first build was correct but generic — a hairline card, four flat boxes, an asterisk on every label, and filler placeholders. Rebuilt:

- **Masthead.** Deep-green gradient band inside the card carrying eyebrow + serif heading + intro, closed by a 3px gold rule, with an oversized outline glyph bled off the corner (not painted below 40rem).
- **Floating labels.** The label starts inside the field and moves to a small caps line at its head on focus or content. It is never removed and never replaced by the placeholder, so the accessible name is stable and SC 3.3.2 holds — the failure mode of the pattern this resembles. Driven from React state because StyleX emits no sibling selectors (`:focus ~ label`).
- **Placeholders are worked examples, not labels.** They render empty until the field takes focus, and the copy is real — `Nimal Perera`, `nimal.perera@gmail.com`, `Admissions enquiry — Grade 6 entry` — instead of "Your name" / "Your message".
- **Asterisks removed** in favour of one "All fields are required." line; `required` and `aria-invalid` still carry the state programmatically.
- Field icons tint gold-crimson on focus and crimson when invalid; controls have an inset well shadow; the message field shows a character counter past 75% of its cap (`aria-hidden`, so it cannot talk over the error text).
- **Submit is gold**, the brand's primary action colour — deep green competed with the masthead above it — on its own band above a rule.
- The details column was lifted to match: eyebrow + serif `h2`, icon chips giving every row a common left edge, gold hover underline on `tel:`/`mailto:` links, framed map.

## 5. Verification

- `packages/ui` unit tests: 35 passing, 13 of them new — landmark and skip-link wiring, exactly one `h1` with both section headings as `h2`, `aria-current` on the nav, unsupplied details omitted, `tel:`/`mailto:` hrefs, map badge link vs. caption, empty-field errors with focus moved to the first one, `aria-describedby` pointing at the real error text, incomplete email rejected, successful submit clearing the fields and announcing in the live region, failure preserving the input, and the no-endpoint path never claiming success.
- `tsc --noEmit` clean in `packages/ui` and `apps/web`.
- `ultracite fix` clean on every new file.

## 6. Known gaps

- **No browser-driven check this round.** The homepage work was verified at 22 widths with Playwright; Playwright is not a dependency of this repo and adding it was out of scope, so the responsive behaviour above is asserted from the code and the unit tests, not from screenshots. Worth re-running the frontend-audit §9 sweep over `/contact` when a browser harness is next available.
- **No enquiry endpoint.** By design here — see §4.4. Until one exists the form tells the truth instead of pretending.
- **No CMS fields for the office details.** The props exist and the footer's `FooterContact` covers the same ground; connecting them needs a CMS schema addition, which is backend work and was excluded.
- **No map.** A static map image or an embedded map needs a provider decision (and, for an embed, a third-party script and its privacy implications).
- `/students`, `/news`, `/alumni`, `/media` and `/notices` remain under-construction placeholders.
