/**
 * Consistent aspect ratios for all media in the CMS and site.
 *
 * Every ratio is expressed as `width / height` (a single number) so it can be
 * used directly in CSS `aspect-ratio`, `<Image>` `aspectRatio`, or cropper
 * constraints.
 */
export const aspectRatios = {
  /** Hero banner / full-width background image or video. */
  hero: 16 / 9,

  /** Heritage archival photograph (landscape). */
  heritagePhoto: 4 / 3,

  /** Principal portrait (portrait orientation). */
  principalPortrait: 4 / 5,

  /** News card thumbnail (landscape, tight crop). */
  newsCard: 16 / 10,

  /** Gallery thumbnail grid (square). */
  galleryThumb: 1,

  /** Student life mosaic tile (landscape). */
  mosaicTile: 3 / 2,

  /** Achievement card (landscape). */
  achievementCard: 3 / 2,

  /** Alumni section image (landscape). */
  alumniPhoto: 3 / 2,
} as const;

/** All ratio keys for iteration. */
export type AspectRatioKey = keyof typeof aspectRatios;

/**
 * Human-readable labels for each ratio, used in the upload UI to tell the
 * editor what crop is expected.
 */
export const aspectRatioLabels: Record<AspectRatioKey, string> = {
  hero: "16 : 9 — Hero / full-width banner",
  heritagePhoto: "4 : 3 — Heritage photograph",
  principalPortrait: "4 : 5 — Portrait",
  newsCard: "16 : 10 — News card",
  galleryThumb: "1 : 1 — Square thumbnail",
  mosaicTile: "3 : 2 — Mosaic tile",
  achievementCard: "3 : 2 — Achievement card",
  alumniPhoto: "3 : 2 — Alumni image",
};

/**
 * Recommended minimum width (in pixels) for each ratio. Uploads narrower than
 * this trigger a warning in the crop UI.
 */
export const aspectRatioMinWidth: Record<AspectRatioKey, number> = {
  hero: 2400,
  heritagePhoto: 1200,
  principalPortrait: 800,
  newsCard: 800,
  galleryThumb: 600,
  mosaicTile: 800,
  achievementCard: 800,
  alumniPhoto: 800,
};
