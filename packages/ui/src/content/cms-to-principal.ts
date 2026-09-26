import type { ImageSource } from "../components/primitives/media";
import type { CmsBlock } from "./cms-to-home";
import type { PrincipalContent } from "./principal";
import {
  PRINCIPAL_BLOCK_ID,
  PRINCIPAL_DEFAULTS,
  PRINCIPAL_FIELD,
} from "./principal";

/**
 * Resolve the global Principal's Message block.
 *
 * Every page calls this with the same blocks and gets the same content, so the
 * homepage and the About page cannot drift apart. Text fields fall back to the
 * shipped copy with `??`; the link is dropped entirely unless *both* its label
 * and target are present, so clearing one of them cannot leave a link with
 * nothing to say.
 */

interface CmsImageField {
  id: string;
  value?: string;
  aspectRatio?: number;
}

const blockFor = (blocks: CmsBlock[]): CmsBlock | undefined =>
  blocks.find((block) => block.id === PRINCIPAL_BLOCK_ID);

const valueOf = (blocks: CmsBlock[], fieldId: string): string | undefined =>
  blockFor(blocks)?.fields.find((f) => f.id === fieldId)?.value || undefined;

/**
 * `undefined` only when the field is absent from the block entirely, which
 * means the block has never been saved. That is the one case where the shipped
 * default applies; a field the editor has cleared arrives as `""` and is
 * honoured as a deliberate removal.
 */
const rawValueOf = (blocks: CmsBlock[], fieldId: string): string | undefined =>
  blockFor(blocks)?.fields.find((f) => f.id === fieldId)?.value;

const imageOf = (
  blocks: CmsBlock[],
  fieldId: string
): ImageSource | undefined => {
  const field: CmsImageField | undefined = blockFor(blocks)?.fields.find(
    (f) => f.id === fieldId
  );
  const url = field?.value;
  if (!url) {
    return undefined;
  }
  return {
    src: url.startsWith("image:") ? url.slice("image:".length) : url,
    alt: "Portrait of the Principal",
    ...(field.aspectRatio ? { aspectRatio: field.aspectRatio } : {}),
  };
};

const linkOf = (
  blocks: CmsBlock[],
  defaults: PrincipalContent["link"]
): PrincipalContent["link"] => {
  const label = rawValueOf(blocks, PRINCIPAL_FIELD.linkLabel);
  const href = rawValueOf(blocks, PRINCIPAL_FIELD.linkHref);

  if (label === undefined && href === undefined) {
    return defaults;
  }
  return label && href ? { href, label } : undefined;
};

export const blocksToPrincipal = (
  blocks: CmsBlock[],
  defaults: {
    eyebrow: string;
    heading?: string;
    quote: string;
    body: string;
    name?: string;
    role: string;
    link?: { href: string; label: string };
  }
): PrincipalContent => ({
  eyebrow: valueOf(blocks, PRINCIPAL_FIELD.eyebrow) ?? defaults.eyebrow,
  heading: valueOf(blocks, PRINCIPAL_FIELD.heading) ?? defaults.heading,
  quote: valueOf(blocks, PRINCIPAL_FIELD.quote) ?? defaults.quote,
  body: valueOf(blocks, PRINCIPAL_FIELD.body) ?? defaults.body,
  name: valueOf(blocks, PRINCIPAL_FIELD.name) ?? defaults.name,
  role: valueOf(blocks, PRINCIPAL_FIELD.role) ?? defaults.role,
  portrait: imageOf(blocks, PRINCIPAL_FIELD.portrait),
  link: linkOf(blocks, defaults.link),
  hidden: blockFor(blocks)?.hidden ?? false,
});

/** What every page shows before an editor has saved the block. */
export const DEFAULT_PRINCIPAL: PrincipalContent = {
  ...PRINCIPAL_DEFAULTS,
  hidden: false,
};

/**
 * The entry point pages call. Returns the shipped copy when the block has never
 * been saved, so the section is never missing just because the CMS is empty.
 */
export const principalContent = (blocks?: CmsBlock[]): PrincipalContent =>
  blocks?.length
    ? blocksToPrincipal(blocks, PRINCIPAL_DEFAULTS)
    : DEFAULT_PRINCIPAL;
