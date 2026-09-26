/**
 * The Principal's message — one content source, every page.
 *
 * This is the site's only *global* block: the message and the portrait are the
 * same person wherever they appear, so they are edited once in the CMS (at
 * `/cms/principal`) and read by every page that shows the section. The
 * alternative — a copy of the block per page — is how the homepage and the
 * About page ended up with two near-identical components and two editable
 * copies of the same sentence.
 *
 * `PrincipalContent` is what pages accept. `blocksToPrincipal` (in
 * `cms-to-principal.ts`) turns CMS blocks into one of these, so a page never
 * reads block ids itself.
 */

import type { ImageSource } from "../components/primitives/media";

/** The CMS block id, and the only one in the global registry. */
export const PRINCIPAL_BLOCK_ID = "principal";

/** The `page` key the global block is stored under. */
export const PRINCIPAL_PAGE_KEY = "principal";

/** Field ids, referenced by the CMS registry and the resolver. */
export const PRINCIPAL_FIELD = {
  eyebrow: "principal-eyebrow",
  heading: "principal-heading",
  /** Short pull quote. Plain text; the homepage sets this in a blockquote. */
  quote: "principal-quote",
  /** Full message. Rich text HTML from the CMS editor; the About page sets this. */
  body: "principal-body",
  name: "principal-name",
  role: "principal-role",
  portrait: "principal-portrait",
  linkLabel: "principal-link-label",
  linkHref: "principal-link-href",
} as const;

export interface PrincipalContent {
  eyebrow: string;
  /** Optional. The About page sets its message beneath this. */
  heading?: string;
  /**
   * The one-line pull quote. Plain text, set in a display-serif blockquote on
   * the homepage, so it is deliberately not the same field as `body` - a long
   * message at that size is a wall, and an editor should be able to write both
   * without one ruining the other.
   */
  quote: string;
  /**
   * The full message, as rich text HTML produced by the CMS editor. Rendered
   * only after `sanitizeRichText`, never with the stored value directly.
   */
  body: string;
  /**
   * Optional on purpose. Rendering a placeholder name for a real person is
   * worse than naming the office alone.
   */
  name?: string;
  role: string;
  portrait?: ImageSource;
  /** Optional trailing call to action. */
  link?: { href: string; label: string };
  /** Editor visibility, from the block's `hidden` flag. */
  hidden: boolean;
}

/** The shipped copy. Every field is editable in the CMS. */
export const PRINCIPAL_DEFAULTS = {
  eyebrow: "From the principal",
  heading: "A Word from the Principal",
  quote:
    "Every Aloysian carries forward a tradition of faith, discipline and excellence - certa viriliter.",
  body: "<p>Every Aloysian carries forward a tradition of faith, discipline and excellence — <em>certa viriliter</em>.</p><p>It is a tradition handed to us by the generations who came before, and one we are trusted to hand on. The Chapel, the classroom, the playing field and the society room each ask the same thing of us: to give our best, and to do it for others.</p>",
  name: undefined,
  role: "Principal, St. Aloysius' College",
  link: { href: "/about#principal", label: "Read the full message" },
} as const satisfies Omit<PrincipalContent, "portrait" | "hidden">;
