import type { ImageSource } from "../components/primitives/media";
import type { CmsBlock } from "./cms-to-home";

const fieldValue = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string
): string | undefined =>
  blocks.find((b) => b.id === blockId)?.fields.find((f) => f.id === fieldId)
    ?.value;

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
  const url = fieldValue(blocks, blockId, fieldId);
  return url ? { ...fallback, src: url } : fallback;
};

export interface AboutImages {
  founder1Image: ImageSource;
  founder2Image: ImageSource;
  history1Image: ImageSource;
  history2Image: ImageSource;
  history3Image: ImageSource;
  history4Image: ImageSource;
  anthemImage: ImageSource;
}

/**
 * Convert CMS blocks into the image overrides the About page's sections
 * accept. Only images are editable here; every other string on the page is
 * real, published prose from `content/about.ts`.
 */
export const blocksToAboutImages = (
  blocks: CmsBlock[],
  defaults: {
    founder1: ImageSource;
    founder2: ImageSource;
    history1: ImageSource;
    history2: ImageSource;
    history3: ImageSource;
    history4: ImageSource;
    anthem: ImageSource;
  }
): AboutImages => ({
  founder1Image: imageOrDefault(
    blocks,
    "founders",
    "founder1-image",
    defaults.founder1
  ),
  founder2Image: imageOrDefault(
    blocks,
    "founders",
    "founder2-image",
    defaults.founder2
  ),
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
});
