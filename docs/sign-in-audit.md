# Sign-in / Auth UI Audit — St. Aloysius' College Web

Audit of the sign-in design mock (`Login.dc.html`) and the shipped `apps/web/src/routes/sign-in.tsx`, performed before rebuilding the route.

This is the companion to [`frontend-audit.md`](./frontend-audit.md), which covered the homepage. That work built the token layer, the primitives and the responsive strategy; §10 of it listed the remaining routes as out of scope. The sign-in route is the first of those to be brought up to the same bar.

## 0. Baseline

| Area | State before this work |
| --- | --- |
| Route | `apps/web/src/routes/sign-in.tsx`, 122 lines, self-contained |
| Design system use | **None.** Zero token imports, despite `packages/ui/src/tokens/` existing |
| Colours | Hard-coded `#ccc`, `#0b4619`, `#b3261e`, `#fff` — none are brand colours |
| Typography | `fontFamily: "system-ui, sans-serif"` — bypasses the self-hosted brand fonts |
| Layout | `minHeight: 80vh`, single centred column, `maxWidth: 320px` |
| Responsive strategy | None. No breakpoint is referenced |
| Brand | None. Nothing identifies the page as St. Aloysius' |

The route is a functional stub: it authenticates correctly, and that logic is sound. Everything around it is placeholder.

---

## 1. Responsiveness — blocking

| # | Issue | Impact |
| --- | --- | --- |
| 1.1 | `minHeight: 80vh` on the page wrapper. | `vh` is the wrong unit on mobile browsers with collapsing URL bars (the classic iOS jump the homepage audit already flagged at §1.6). At 80% it also leaves an unexplained 20% gap below the fold on every device. |
| 1.2 | `maxWidth: 320px` on the form, with **no page padding at all**. | On a 320px viewport the form spans edge-to-edge with zero gutter — inputs touch both screen edges. On a 3840px display it is a 320px ribbon in a void. |
| 1.3 | No breakpoint is used anywhere, so the 320px column is what renders on a 27" iMac, a smart board and a kiosk alike. | Fails the adaptive-layout requirement outright: one layout for a 24× range of widths. |
| 1.4 | Fixed `rem` type with no `clamp()`. | No fluid scaling; the design system's fluid scale (`font.size*`) is sitting unused two packages away. |
| 1.5 | No landscape-phone handling. | At 430×260 (phone landscape) a vertically centred form with a heading is already near the viewport height; any error message pushes the submit button off-screen with no scroll affordance. |
| 1.6 | No safe-area handling. | `index.css` sets up `viewport-fit=cover` insets for notched phones and foldables; this route opts out of them by not using `Container`. |

## 2. Accessibility — blocking (WCAG 2.2 AA)

| # | Issue | WCAG |
| --- | --- | --- |
| 2.1 | No `<main>` landmark and no `<h1>`-bearing document structure beyond a bare `h1` inside a `div` soup. The page has **no landmark at all**. | 1.3.1, 2.4.1 |
| 2.2 | The error `<p>` is rendered conditionally with **no live region and no programmatic association** to the form. A screen-reader user submits, the form fails, and nothing is announced. | 4.1.3, 3.3.1 |
| 2.3 | The error is not linked to either input via `aria-describedby`, and no `aria-invalid` is set. | 3.3.1 |
| 2.4 | **No `:focus-visible` style anywhere.** Inputs and the button rely on the UA default, which on `#0b4619` is near-invisible. | 2.4.7, 2.4.11 |
| 2.5 | Submit button height is `0.6rem` padding + 1rem text ≈ 35px, and inputs ≈ 33px. Below the 44px target the rest of the app enforces. | 2.5.8 |
| 2.6 | `#ccc` input borders on white are ~1.6:1 against the background — the field boundary is not a visible non-text contrast. | 1.4.11 |
| 2.7 | No password reveal control. Forcing blind entry of a password on a phone keyboard is a known accessibility and error-rate problem. | 3.3.2 (best practice) |
| 2.8 | Loading state changes only the button label. No `aria-busy`, so the transition is silent to assistive tech. | 4.1.3 |
| 2.9 | `disabled` on the submit button removes it from the tab order mid-interaction, moving focus unpredictably. | 2.4.3 |
| 2.10 | No `lang`-aware typography for Sinhala/Tamil, same gap as the homepage (§4.5). | 3.1.2 |

## 3. Security / correctness

| # | Issue |
| --- | --- |
| 3.1 | `handleSubmit` is `async` and passed straight to `onSubmit`. A rejected promise from `authClient` is unhandled: a network failure leaves `isSubmitting` stuck `true` **forever**, with the button permanently disabled and no error shown. There is no `try/catch` and no `finally`. This is the one real bug in the file. |
| 3.2 | `signInError.message` is rendered verbatim. Auth-server messages can distinguish "no such user" from "wrong password", which is a username-enumeration vector on a school portal. |
| 3.3 | The mock hard-codes `value="aloysian2026"` into the password input. If transcribed literally it ships a real-looking credential in the markup. |
| 3.4 | No `noValidate` + no custom validation, so the UA's native bubble is the only error surface for `required` — unstyled, untranslatable, and it disappears on blur. |

## 4. Performance

| # | Issue |
| --- | --- |
| 4.1 | `fontFamily: "system-ui"` means this route renders in a different typeface from every other route — a visible font swap on navigation, and the brand fonts are loaded anyway by the root document. |
| 4.2 | The mock requests Google Fonts from `fonts.googleapis.com` with two families × 5 weights × italic. Same finding as homepage audit §3.1/§3.2 — the app already self-hosts two variable files, so the mock's font block must not be carried over. |
| 4.3 | The mock's brand panel uses a 560px-tall crest PNG at 7% opacity plus two infinite CSS animations (`om-pulse`, `om-drift`) that run forever, off-screen, with no `prefers-reduced-motion` guard. Continuous compositing for a near-invisible effect. |

## 5. Mock-specific findings (`Login.dc.html`)

| # | Issue |
| --- | --- |
| 5.1 | Same `style-hover` / `style-focus` pseudo-attributes as the homepage mock — **these are not real HTML and do nothing in a browser.** Every hover and focus state in the mock is non-functional. |
| 5.2 | `SIGN IN` is a `<span onClick>`. Not focusable, not keyboard-operable, not announced as a button, and **does not submit the form**. Same for the role tabs and the password toggle. |
| 5.3 | The two panels are `flex:1 1 480px` / `flex:1 1 520px` with fixed `52px 56px` and `64px 48px` padding and **no media queries**. Below ~1000px they stack but keep desktop padding; at 320px the form panel's 48px side padding eats 30% of the screen. |
| 5.4 | "Keep me signed in" is a `<span>` with a `✓` glyph — not a checkbox, no `checked` state exposed, not in the tab order. |
| 5.5 | "Session expires in 30 days" is stated next to a control that does not set session length, and contradicts "Keep me signed in" being toggleable. |
| 5.6 | Google / Microsoft buttons are shown, but **no social provider is configured** in `packages/auth/src/index.ts` — only `username()`, `admin()` and `multiSession()`. These buttons cannot work without a backend change. |
| 5.7 | The STUDENT / PARENT / STAFF tabs change only copy and the identity-field label; all three post the same credential to the same endpoint. There are no student or parent accounts in the schema. |
| 5.8 | `[CMS]` literals appear in the three stat marks, as in the homepage mock (§4.3) — placeholder text that would ship. |
| 5.9 | Gold `#FFB203` on cream `#FFF8E7` is used for links; ~1.9:1. Already resolved in the token layer (`accentOnSurface` is crimson), but the mock must not be copied literally. |
| 5.10 | Password input has `padding-right:74px` to clear the SHOW/HIDE control, hard-coded to the English string width. "HIDE" in another language overlaps the text. |

---

## 6. Decisions taken

Two parts of the mock were **deliberately not built**, because they promise authentication that does not exist and I was instructed not to touch the backend:

- **Google / Microsoft sign-in (§5.6)** — omitted. No social provider is configured. Rendering the buttons would produce two dead controls on the primary auth screen.
- **STUDENT / PARENT / STAFF role tabs (§5.7)** — omitted. They are cosmetic in the mock, but shipping them tells a parent an account exists for them. A student entering an admission number would get a generic failure. The single credential field matches what `username()` actually accepts.

Both are additive and the layout leaves room for them; they should land in the same commit as the backend support. Everything else in the mock was built.

`rememberMe` is real — better-auth's `signIn.username` accepts it as a client option, so the checkbox sets session length without any server change. The mock's fixed "30 days" claim (§5.5) was replaced with copy that reflects what the checkbox actually does.

## 7. What was implemented

1. **`packages/ui/src/components/auth/sign-in-page.tsx`** — a presentational, fully typed component built entirely on the existing token layer. No new colours, sizes or spacing values were introduced.
2. **Mobile-first split layout** — one column at 320px with the brand panel as a compact banner above the form; the two-panel split engages at `xl` (1024px) and the content block re-centres and caps on ultra-wide.
3. **Fluid everything** — `clamp()` type from the shared scale, `space.gutter` padding, no fixed widths, `100dvh` with a `100vh` fallback via `stylex.firstThatWorks`.
4. **Accessible form** — `<main>` landmark, associated `<label>`s, `role="alert"` + `aria-live` error that is wired to both inputs with `aria-describedby` and `aria-invalid`, a real `<button>` password toggle with `aria-pressed`, a native checkbox for remember-me, 44px minimum targets, `:focus-visible` rings on every control.
5. **Fixed the stuck-spinner bug (§3.1)** — the submit handler now has `try/catch/finally`, so a thrown network error clears the loading state and surfaces a message instead of bricking the form.
6. **Generic failure copy (§3.2)** — one message for every credential failure, so the screen cannot be used to enumerate usernames.
7. **Motion** — the brand panel's ambient animations are gated on `prefers-reduced-motion`, matching the rest of the app.
8. **SEO** — `noindex, follow` on the route. A sign-in screen must never rank.

## 8. Defects found while driving the built page

Both were found in a real browser (Playwright, dev server at `:4001`), not by reading the code, and both were invisible to typecheck, lint and the unit tests.

| # | Defect | Cause | Fix |
| --- | --- | --- | --- |
| 8.1 | The brand lockup rendered as `ST. ALOYSIUS' COLLEGEGALLE • SRI LANKA` — the two wordmark lines ran together, and at 390px the result wrapped mid-phrase. | Both lines were inline `<span>`s. `margin: 0` and `lineHeight` do nothing for stacking on an inline box, so they simply flowed together. | `display: block` on both. |
| 8.2 | The "Forgot?" link measured 46×16 — below the 24×24 WCAG 2.2 SC 2.5.8 floor, and short of the 44px grid §7.4 claimed. | It was a bare `<a>` in a baseline-aligned row, sized only by its 11px text. | `inline-flex` + `minHeight: 2.75rem`, row switched to `align-items: center`, with a negative block-end margin so the taller target does not open a gap above the input. |

The remember-me checkbox also measures 18×18, which is **not** a defect: its wrapping `<label for>` is the hit area and measures 338×44.

## 9. Verification

Driven against the dev server at six widths (320, 390, 768, 1024, 1440, 2560):

- **Zero horizontal overflow** at every width.
- **Zero console and page errors** on load and hydration.
- **No control inside `<main>` below 24×24** after 8.2 (the 38 undersized buttons the sweep reports are the TanStack devtools overlay, outside `main`).
- **Tab order**: crest link → username → Forgot? → password → SHOW → remember-me → SIGN IN. No traps.
- **Password reveal** flips the input between `password` and `text`.
- Unit tests: 27/27 in `@aloysius/ui`, 6 of them new.
- Production build succeeds under `NODE_ENV=production`; the emitted CSS carries the `dvh`/`vh` fallback pair.

## 10. Connecting sign-in / sign-out to the CMS

This section was written against the pre-`12ee508` CMS, when `/cms` was a single ungated route. **Most of it was superseded before it landed**, and what follows records both what shipped and what did not, because the difference is the useful part.

| Piece | Status |
| --- | --- |
| Session read on the server | **Shipped.** `apps/web/src/lib/session.ts` - a `createServerFn` returning a projection (`name`, `role`, `canAccessCms`), never the raw better-auth session, whose token and IP fields have no business reaching the client. |
| `/cms` guard | **Not shipped - superseded.** `routes/cms.tsx` no longer exists; the CMS is a routed shell and `routes/cms/route.tsx` already guards on `role === "admin" \|\| role === "cms"`. The version written here was admin-only and would have locked out the seeded `cms` editor. |
| Sign-out | **Not shipped - superseded.** The dead button was fixed in `cms-chrome.tsx`, which nothing imports any more. The live sidebar is `packages/ui/src/components/shell.tsx`, whose `onSignOut` prop `AdminShell` already wires to `authClient.signOut()`. Reverted. |
| Post-sign-in destination | **Shipped.** `/cms` by default, or the `redirect` param, sanitised. |
| Already-signed-in users | **Shipped.** Anyone the CMS would admit - `admin` or `cms` - is bounced off `/sign-in` to their destination. |

The lesson worth keeping: this work was built on a checkout 22 commits behind `origin/master`, and two of seven commits turned out to be redundant or actively wrong against the newer code. Rebase before designing a guard, not after.

### Defects found while wiring this

| # | Defect | Cause | Fix |
| --- | --- | --- | --- |
| 10.1 | `?redirect=https://evil.example` was followed verbatim - a genuine **open redirect** on the sign-in screen. | `safeDestination` was applied in `validateSearch`, but the raw value is what reached `beforeLoad`'s `redirect({ to })`. | Sanitise at both points of navigation, not in the search schema. External and protocol-relative targets now collapse to `/cms`. |
| 10.2 | Every visit to `/sign-in` cost an extra redirect hop and left a redundant `?redirect=/cms` in the address bar. | `validateSearch` emitted the param unconditionally, so the router normalised the URL first. | Drop the param when absent or already the default. |
| 10.3 | Browser sign-out returned **403 `INVALID_ORIGIN`**, so the button appeared to work while the session stayed alive. | `BETTER_AUTH_URL` in `apps/web/.env` was `:3001`; the dev server binds `:4001` (`vite.config.ts`). `trustedOrigins` is derived from that URL. Sign-_in_ is not origin-guarded the same way, which is why only sign-out failed. | Pointed the local `.env` at `:4001`. Environment config only - untracked, and no backend code changed. |
| 10.4 | 34 stale compiled `.js` files sat beside the `.tsx` sources in `packages/ui/src`. Vite resolves extensionless imports `.js` **before** `.tsx`, so `import "./cms-chrome"` loaded a build artifact instead of the source. | Leftover `tsc` output; gitignored (`.gitignore:64`) and untracked. | Deleted. Worth knowing: any future stale build in that tree silently shadows the real component. |

### Verified end to end

Driven in a real browser, 8/8 assertions, three consecutive runs:

Re-run against the current routed CMS after rebasing onto `origin/master`, for **both** seeded roles. 11/11:

signed-out `/cms` is blocked; `admin` and `cms` each sign in and reach `/cms`; a signed-in user of either role is bounced off `/sign-in` to the CMS; sign-out from the live `AdminShell` control leaves the CMS; `/cms` is blocked again afterwards; zero console or page errors for either role.

The role pair matters: the guard originally checked `admin` only, which stranded the `cms` editor on the sign-in screen after a _successful_ sign-in. That is what `canAccessCms` fixes.

## 11. Known gaps

- Social sign-in and role tabs, per §6 — blocked on backend.
- "Forgot password?" links to the contact page rather than a reset flow; no password-reset endpoint exists.
- The brand panel's photograph slot renders the branded `Media` placeholder until real campus photography is supplied, same as the homepage.
