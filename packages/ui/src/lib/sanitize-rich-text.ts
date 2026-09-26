/**
 * Allowlist sanitiser for editor-authored rich text.
 *
 * Rich text is stored as HTML and has to be rendered on the public site, so the
 * stored value cannot be trusted: the CMS accepts it from an editor, and the
 * value round-trips through the database and the real-time channel.
 * `dangerouslySetInnerHTML` is therefore only ever fed the output of this
 * function — see `components/principal/principal-message.tsx`.
 *
 * Deliberately dependency-free and DOM-free. The site is server-rendered, so
 * anything built on `DOMParser` or `innerHTML` would have to behave differently
 * in Node and the browser; tokenising the string gives one implementation with
 * one behaviour in both.
 *
 * The policy is a small allowlist of formatting tags. Anything not on it is
 * unwrapped (its text is kept, its tag is dropped) rather than deleted, so a
 * paste from a word processor degrades to readable text instead of vanishing.
 * `script`, `style` and `iframe` are the exception: their *contents* are
 * dropped too, because keeping them would leak code or stylesheet text onto the
 * page as visible copy.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "h2",
  "h3",
  "h4",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "figure",
  "figcaption",
]);

/** Tags whose children must go too, not just their tags. */
const DROP_CONTENT_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
]);

/** Tags that never have a closing tag. */
const VOID_TAGS = new Set(["br", "hr"]);

/**
 * `b` and `i` are emitted as `strong` and `em`. They mean the same thing and
 * carry the same semantics; the short forms only exist because word processors
 * produce them.
 */
const TAG_ALIASES: Record<string, string> = { b: "strong", i: "em" };

/**
 * Tags that implicitly close when they open, so a paste like `<p>a<p>b` still
 * nests the way a reader expects. Without this the stack can end up crossed and
 * the output has stray open tags.
 */
const IMPLICITLY_CLOSED: Record<string, readonly string[]> = {
  li: ["li"],
  p: ["p"],
  h2: ["p", "h2", "h3", "h4"],
  h3: ["p", "h2", "h3", "h4"],
  h4: ["p", "h2", "h3", "h4"],
  blockquote: ["p", "blockquote"],
  figure: ["p", "figure"],
  figcaption: ["p", "figcaption"],
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D",
};

const ENTITY_PATTERN = /&(?<body>#x[0-9a-f]+|#\d+|[a-z]+);/giu;

const MAX_CODE_POINT = 0x10_ff_ff;
const SURROGATE_START = 0xd8_00;
const SURROGATE_END = 0xdf_ff;

/**
 * Normalise the entities already in the stored string to their characters, so
 * that escaping the text afterwards cannot double-encode them: `&amp;` has to
 * become `&` and then be re-escaped back to `&amp;`, not `&amp;amp;`.
 */
const decodeEntities = (input: string): string =>
  input.replace(ENTITY_PATTERN, (match, ...args) => {
    const groups = args.at(-1) as { body?: string } | undefined;
    const body = groups?.body ?? "";
    if (!body.startsWith("#")) {
      return NAMED_ENTITIES[body.toLowerCase()] ?? match;
    }
    const isHex = body[1] === "x" || body[1] === "X";
    const radix = isHex ? 16 : 10;
    const code = Number.parseInt(isHex ? body.slice(2) : body.slice(1), radix);
    // Reject NaN, control characters, out-of-range code points and lone
    // surrogates; any of them produces a string React cannot render.
    if (
      !Number.isFinite(code) ||
      code < 0x20 ||
      code > MAX_CODE_POINT ||
      (code >= SURROGATE_START && code <= SURROGATE_END)
    ) {
      return match;
    }
    return String.fromCodePoint(code);
  });

const escapeText = (input: string): string =>
  decodeEntities(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

// eslint-disable-next-line no-control-regex -- matching control characters is the point: they are stripped from hrefs
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/gu;
const SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/u;
const RELATIVE_PATH_PATTERN = /^[a-z\d._~%!$&'()*+,;=@/-]+$/iu;

/**
 * Only same-tab, non-executable destinations. `javascript:`, `data:` and
 * `vbscript:` are rejected outright rather than pattern-matched against a
 * blocklist, because they can be obfuscated with embedded control characters
 * (`java\0script:`) that a naive check lets through.
 */
const safeHref = (raw: string): string | undefined => {
  const href = decodeEntities(raw).trim().replaceAll(CONTROL_CHARACTERS, "");
  if (!href) {
    return undefined;
  }
  const lowered = href.toLowerCase();
  // Protocol-relative URLs inherit the page's scheme, which is allowed, but a
  // bare `//host` is left ambiguous rather than silently trusted.
  if (lowered.startsWith("/") && !lowered.startsWith("//")) {
    return href;
  }
  if (lowered.startsWith("#") || lowered.startsWith("?")) {
    return href;
  }
  const scheme = SCHEME_PATTERN.exec(lowered)?.[0];
  if (scheme) {
    return scheme === "http:" || scheme === "https:" || scheme === "mailto:"
      ? href
      : undefined;
  }
  // No scheme: a relative path. Reject anything that is not plainly one.
  return RELATIVE_PATH_PATTERN.test(href) ? href : undefined;
};

const ATTRIBUTE_PATTERN =
  /(?<name>[a-z-]+)\s*=\s*(?:"(?<double>[^"]*)"|'(?<single>[^']*)'|(?<bare>[^\s"'=<>`]+))/giu;

/**
 * Rebuild one tag's attributes from scratch. Nothing from the input is copied
 * through: only `href` is considered, and only on `<a>`, so `class`, `style`,
 * `onerror` and every other event handler are dropped by construction.
 */
const sanitizeAttributes = (tag: string, raw: string): string => {
  if (tag !== "a") {
    return "";
  }
  let href: string | undefined;
  for (const match of raw.matchAll(ATTRIBUTE_PATTERN)) {
    if (match.groups?.name?.toLowerCase() === "href") {
      const { double, single, bare } = match.groups;
      href = double ?? single ?? bare;
    }
  }
  const safe = href === undefined ? undefined : safeHref(href);
  // A link with no usable target would still be focusable and would still read
  // as a link, so the caller unwraps the anchor entirely.
  return safe === undefined ? "" : ` href="${escapeText(safe)}"`;
};

const TOKEN_PATTERN =
  /<!--[\s\S]*?-->|<\/?(?<name>[a-z][a-z\d-]*)(?<attrs>(?:[^>"']|"[^"]*"|'[^']*')*)>/giu;

/** Mutable state threaded through the token handlers. */
interface SanitizeState {
  out: string[];
  open: string[];
  /** Name of the element whose contents are being discarded, if any. */
  skipTag?: string;
  skipDepth: number;
}

/** Close every open tag from `from` upwards, innermost first. */
const closeDownTo = (state: SanitizeState, from: number) => {
  for (let i = state.open.length - 1; i >= from; i -= 1) {
    const tag = state.open[i];
    if (tag !== undefined) {
      state.out.push(`</${tag}>`);
    }
  }
  state.open.length = from;
};

const openTag = (state: SanitizeState, tag: string, attributes: string) => {
  for (const implicit of IMPLICITLY_CLOSED[tag] ?? []) {
    const at = state.open.lastIndexOf(implicit);
    if (at !== -1) {
      closeDownTo(state, at);
    }
  }
  state.out.push(`<${tag}${attributes}>`);
  state.open.push(tag);
};

const closeTag = (state: SanitizeState, tag: string) => {
  const at = state.open.lastIndexOf(tag);
  if (at !== -1) {
    closeDownTo(state, at);
  }
};

/**
 * Handle one matched token, appending to `state.out`. The cursor is advanced by
 * the caller.
 */
/**
 * Track nesting inside a dropped-content element, returning `true` while still
 * inside it. Split out of `handleToken` so neither carries the other's
 * branches.
 */
const trackSkipped = (
  state: SanitizeState,
  name: string | undefined,
  isClosing: boolean
): boolean => {
  if (state.skipTag === undefined || name !== state.skipTag) {
    return state.skipTag !== undefined;
  }
  if (!isClosing) {
    state.skipDepth += 1;
    return true;
  }
  state.skipDepth -= 1;
  if (state.skipDepth === 0) {
    state.skipTag = undefined;
  }
  return true;
};

/**
 * Handle one matched token, appending to `state.out`. The cursor is advanced by
 * the caller.
 */
const handleToken = (state: SanitizeState, match: RegExpMatchArray) => {
  const [text = ""] = match;
  const isClosing = text.startsWith("</");
  const name = match.groups?.name?.toLowerCase();

  // Comments carry no name and are removed outright.
  if (text.startsWith("<!--")) {
    return;
  }

  if (name === undefined) {
    return;
  }

  if (state.skipTag !== undefined) {
    trackSkipped(state, name, isClosing);
    return;
  }

  if (DROP_CONTENT_TAGS.has(name)) {
    if (!isClosing && !VOID_TAGS.has(name) && !text.endsWith("/>")) {
      state.skipTag = name;
      state.skipDepth = 1;
    }
    return;
  }

  if (!ALLOWED_TAGS.has(name)) {
    // Unknown tag: drop the tag, keep whatever it wrapped.
    return;
  }

  const tag = TAG_ALIASES[name] ?? name;

  if (isClosing) {
    closeTag(state, tag);
    return;
  }

  const attributes = sanitizeAttributes(tag, match.groups?.attrs ?? "");
  if (tag === "a" && !attributes) {
    // No usable target. Emitting nothing unwraps the anchor, so the reader does
    // not get a focusable element that looks like a link and goes nowhere.
    return;
  }
  if (VOID_TAGS.has(tag)) {
    state.out.push(`<${tag} />`);
    return;
  }
  openTag(state, tag, attributes);
};

/**
 * Reduce editor HTML to the allowlist above. Idempotent: sanitising an already
 * sanitised string returns it unchanged, which is what lets the public renderer
 * sanitise unconditionally without caring where the value came from.
 */
export const sanitizeRichText = (input: string): string => {
  if (!input) {
    return "";
  }

  const state: SanitizeState = { out: [], open: [], skipDepth: 0 };
  let cursor = 0;

  for (const match of input.matchAll(TOKEN_PATTERN)) {
    const [token = ""] = match;
    /*
     * The text between the previous token and this one is emitted only when we
     * were not inside a dropped element at the *previous* token. Testing it
     * here rather than after `handleToken` is what stops a `<script>` body from
     * leaking: the text before `</script>` is flushed by this line, and the flag
     * is set by the line that saw `<script>`.
     */
    if (state.skipTag === undefined) {
      state.out.push(escapeText(input.slice(cursor, match.index ?? 0)));
    }
    /*
     * Advanced even when nothing is emitted, or the discarded text would still
     * be pending and a later emit would flush it onto the page.
     */
    cursor = (match.index ?? 0) + token.length;
    handleToken(state, match);
  }

  if (state.skipTag === undefined) {
    state.out.push(escapeText(input.slice(cursor)));
  }
  closeDownTo(state, 0);
  return state.out.join("");
};
