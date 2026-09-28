import {
  aspectRatioNames,
  aspectRatios,
} from "@aloysius/ui/tokens/aspect-ratios";

/**
 * What each image in a gallery is for, and therefore what it is cropped to.
 *
 * The three roles are the crop, not a label. The same photograph is asked to
 * represent a gallery in a listing, span the top of a gallery page, and sit in a
 * masonry grid among its peers, and those need three different shapes. The role
 * is a column in the database for the same reason it is a map here: declared once,
 * read by both the uploader and the renderer.
 *
 * ## The ratios come from `tokens/aspect-ratios.ts`
 *
 * They used to be restated as the strings "3:2 landscape", "16:9 wide" and
 * "1:1 square" in the gallery screen, with a comment admitting they duplicated
 * the token file. That is the failure the token file exists to prevent: the CMS
 * says `aspectRatios.hero` and the club portal said "16:9", and nothing would have
 * told anyone when one of them changed. Referencing the tokens means a ratio
 * change propagates on its own.
 *
 * The mapping is not one-to-one with the token names, and deliberately so:
 * - `cover` is a landscape tile, so `mosaicTile` (3:2) rather than
 *   `galleryThumb`, which is the square *grid* tile.
 * - `banner` is the full-width strip, which is exactly what `hero` is.
 * - `item` is the square grid tile, which is exactly what `galleryThumb` is.
 */
export type ImageRole = "item" | "cover" | "banner";

export const IMAGE_ROLE_RATIO: Record<ImageRole, number> = {
  banner: aspectRatios.hero,
  cover: aspectRatios.mosaicTile,
  item: aspectRatios.galleryThumb,
};

/**
 * The words shown next to a role in a picker or a hint.
 *
 * A bare number ("1.78") is not something a photographer can act on, so the name
 * comes from `aspectRatioNames` beside the number it describes. The reason clause
 * is what makes it actionable: a club told "3:2 — landscape tile" can compose for
 * it, and one told "3:2" has to guess where it will be cropped.
 */
export const IMAGE_ROLE_CROP: Record<ImageRole, string> = {
  banner: `${aspectRatioNames.hero} — full-width banner`,
  cover: `${aspectRatioNames.mosaicTile} — landscape tile`,
  item: `${aspectRatioNames.galleryThumb} — square grid tile`,
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
