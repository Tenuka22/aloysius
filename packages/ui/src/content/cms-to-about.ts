import type { ImageSource } from "../components/primitives/media";
import type { AnthemStanza, TimelineEntry } from "../content/about";
import type { CmsBlock } from "./cms-to-home";

const fieldValue = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string
): string | undefined =>
  blocks.find((b) => b.id === blockId)?.fields.find((f) => f.id === fieldId)
    ?.value;

interface CmsImageField {
  id: string;
  value?: string;
  aspectRatio?: number;
}

const imageField = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string
): CmsImageField | undefined => {
  const block = blocks.find((candidate) => candidate.id === blockId);
  return block?.fields.find((candidate) => candidate.id === fieldId);
};

/**
 * An optional image field: `undefined` when the editor has not set one.
 *
 * The counterpart to `imageOrDefault` below, for the fields that have no
 * shipped photograph to fall back to - the page header's hero image, where an
 * empty value means "no image", not "the default image".
 */
const imageSource = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string,
  alt: string
): ImageSource | undefined => {
  const field = imageField(blocks, blockId, fieldId);
  const url = field?.value;
  if (!url) {
    return undefined;
  }
  return {
    src: url.startsWith("image:") ? url.slice("image:".length) : url,
    alt,
    ...(field?.aspectRatio ? { aspectRatio: field.aspectRatio } : {}),
  };
};

/**
 * Resolve an editable image field against a real default.
 *
 * Unlike the homepage's text fields (which fall back to an empty section), an
 * empty override here must fall back to the archival photo the page ships
 * with, not a blank placeholder - `||`, not `??`, so an editor who clears the
 * field back to an empty string gets the default back rather than a hole in
 * the page.
 */
const imageOrDefault = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string,
  fallback: ImageSource
): ImageSource => {
  const field = imageField(blocks, blockId, fieldId);
  const url = field?.value;
  return url
    ? {
        ...fallback,
        src: url.startsWith("image:") ? url.slice("image:".length) : url,
        ...(field.aspectRatio ? { aspectRatio: field.aspectRatio } : {}),
      }
    : fallback;
};

export interface AboutHeaderProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
}

/**
 * The About page's own header.
 *
 * Separate from `blocksToAboutText`, which only ever carried the history
 * section's heading. The hero title and tagline were the rest of what an editor
 * could not change about this page.
 */
export const blocksToAboutHeader = (
  blocks: CmsBlock[],
  defaults: { eyebrow: string; heading: string; tagline: string }
): AboutHeaderProps => ({
  eyebrow:
    fieldValue(blocks, "about-header", "about-eyebrow") ?? defaults.eyebrow,
  heading:
    fieldValue(blocks, "about-header", "about-heading") ?? defaults.heading,
  tagline:
    fieldValue(blocks, "about-header", "about-tagline") ?? defaults.tagline,
  heroImage: imageSource(
    blocks,
    "about-header",
    "about-hero-image",
    "St. Aloysius' College, Galle"
  ),
});

export interface AboutTextContent {
  historyHeading?: string;
  visionStatement?: string;
  missionStatement?: string;
}

export interface AboutImages {
  history1Image: ImageSource;
  history2Image: ImageSource;
  history3Image: ImageSource;
  history4Image: ImageSource;
  anthemImage: ImageSource;
  anthemSinhalaImage: ImageSource;
}

/**
 * Convert CMS blocks into text overrides the About page's sections accept.
 * Falls back to the hardcoded defaults from `content/about.ts` when the CMS
 * field is empty.
 */
export const blocksToAboutText = (
  blocks: CmsBlock[],
  defaults: {
    historyHeading: string;
    visionStatement: string;
    missionStatement: string;
  }
): AboutTextContent => ({
  historyHeading:
    fieldValue(blocks, "history", "history-heading") ?? defaults.historyHeading,
  visionStatement:
    fieldValue(blocks, "about-statements", "about-vision") ??
    defaults.visionStatement,
  missionStatement:
    fieldValue(blocks, "about-statements", "about-mission") ??
    defaults.missionStatement,
});

/**
 * Merge the history timeline's per-entry title/body CMS fields over the
 * static defaults. `year` is never editable - it is the timeline's own
 * identity, not prose - only `title` and `body` can be overridden per entry.
 */
export const blocksToAboutTimeline = (
  blocks: CmsBlock[],
  defaults: readonly TimelineEntry[]
): TimelineEntry[] =>
  defaults.map((entry, index) => {
    const n = index + 1;
    return {
      ...entry,
      title: fieldValue(blocks, "history", `history-${n}-title`) ?? entry.title,
      body: fieldValue(blocks, "history", `history-${n}-body`) ?? entry.body,
    };
  });

/**
 * Parse the Sinhala anthem lyrics textarea into stanzas: a blank line
 * separates stanzas, a newline separates lines within one. Empty or unset
 * renders no Sinhala lyrics (the tab still shows, with its portrait image
 * and an empty state), rather than inventing stanzas that do not exist yet.
 */
export const blocksToAnthemSinhalaStanzas = (
  blocks: CmsBlock[]
): readonly AnthemStanza[] => {
  const raw = fieldValue(blocks, "anthem", "anthem-sinhala-lyrics")?.trim();
  if (!raw) {
    return [];
  }
  return raw
    .split(/\n\s*\n/u)
    .map((stanza) =>
      stanza
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    )
    .filter((lines) => lines.length > 0)
    .map((lines, index) => ({ id: index + 1, lines }));
};

/**
 * Convert CMS blocks into the image overrides the About page's sections
 * accept. Only images are editable here; every other string on the page is
 * real, published prose from `content/about.ts`.
 */
export const blocksToAboutImages = (
  blocks: CmsBlock[],
  defaults: {
    history1: ImageSource;
    history2: ImageSource;
    history3: ImageSource;
    history4: ImageSource;
    anthem: ImageSource;
    anthemSinhala: ImageSource;
  }
): AboutImages => ({
  history1Image: imageOrDefault(
    blocks,
    "history",
    "history-1-image",
    defaults.history1
  ),
  history2Image: imageOrDefault(
    blocks,
    "history",
    "history-2-image",
    defaults.history2
  ),
  history3Image: imageOrDefault(
    blocks,
    "history",
    "history-3-image",
    defaults.history3
  ),
  history4Image: imageOrDefault(
    blocks,
    "history",
    "history-4-image",
    defaults.history4
  ),
  anthemImage: imageOrDefault(
    blocks,
    "anthem",
    "anthem-image",
    defaults.anthem
  ),
  anthemSinhalaImage: imageOrDefault(
    blocks,
    "anthem",
    "anthem-sinhala-image",
    defaults.anthemSinhala
  ),
});
