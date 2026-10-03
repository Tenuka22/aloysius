import { ratioSpec } from "@aloysius/ui/tokens/aspect-ratios";
import type { AspectRatioKey } from "@aloysius/ui/tokens/aspect-ratios";

/**
 * What each image in a gallery is for, and therefore what it is cropped to.
 *
 * The three roles are the crop, not a label. The same photograph is asked to
 * represent a gallery in a listing, span the top of a gallery page, and sit in a
 * grid among its peers, and those need three different shapes. The role is a
 * column in the database for the same reason it is a map here: declared once,
 * read by both the uploader and the renderer.
 *
 * ## Why the roles map to ratio *keys*
 *
 * They map to `AspectRatioKey` and not to `number`, because the uploader needs
 * the key. The key is what carries the ratio, the name shown in the crop dialog
 * and the minimum-width warning together; handing over `aspectRatios.cover` as a
 * bare number would leave the picker looking the other two up separately, which
 * is how a hint ends up describing a different ratio from the one being cropped
 * to.
 *
 * The mapping is not one-to-one with the token names, and deliberately so:
 * - `cover` is a landscape tile, so `mosaicTile` (3:2) rather than
 *   `galleryThumb`, which is the square *grid* tile.
 * - `banner` is the full-width strip, which is exactly what `hero` is.
 * - `item` is the square grid tile, which is exactly what `galleryThumb` is.
 */
export type ImageRole = "item" | "cover" | "banner";

export const IMAGE_ROLE_RATIO: Record<ImageRole, AspectRatioKey> = {
  banner: "hero",
  cover: "mosaicTile",
  item: "galleryThumb",
};

/**
 * The same mapping as a number, for the read-only frames that render an image
 * already in a gallery.
 *
 * `ratioSpec` rather than indexing `aspectRatios` directly, so a role added
 * without a matching token fails here rather than rendering at `NaN`.
 */
export const IMAGE_ROLE_FRAME: Record<ImageRole, number> = {
  banner: ratioSpec(IMAGE_ROLE_RATIO.banner).ratio,
  cover: ratioSpec(IMAGE_ROLE_RATIO.cover).ratio,
  item: ratioSpec(IMAGE_ROLE_RATIO.item).ratio,
};

/**
 * The words shown next to a role in a picker or a hint.
 *
 * Built from `aspectRatioNames` rather than restated. A bare number ("1.78") is
 * not something a photographer can act on, and the reason clause is what makes
 * it actionable: a club told "3:2 — landscape tile" can compose for it, and one
 * told "3:2" has to guess where it will be cropped.
 */
export const IMAGE_ROLE_CROP: Record<ImageRole, string> = {
  banner: "full-width banner",
  cover: "landscape tile",
  item: "square grid tile",
};

/** Tone for the role pill in a list, so a cover is findable at a glance. */
export const IMAGE_ROLE_TONE: Record<
  ImageRole,
  "neutral" | "positive" | "warning"
> = {
  banner: "warning",
  cover: "positive",
  item: "neutral",
};

/** The role each option in the batch uploader's picker should offer. */
export const IMAGE_ROLE_OPTIONS: readonly {
  label: string;
  value: ImageRole;
}[] = [
  { label: "Gallery image", value: "item" },
  { label: "Cover (shown in listings)", value: "cover" },
  { label: "Banner (across the top)", value: "banner" },
];
