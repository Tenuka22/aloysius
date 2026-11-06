import type { ImageSource } from "../components/primitives/media";
import type { TimelineEntry } from "../content/about";
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
  heading?: string;
  tagline?: string;
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
  defaults: { heading: string; tagline: string }
): AboutHeaderProps => ({
  heading:
    fieldValue(blocks, "about-header", "about-heading") ?? defaults.heading,
  tagline:
    fieldValue(blocks, "about-header", "about-tagline") ?? defaults.tagline,
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
});
