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

  /**
   * Heritage architectural detail - the offset, smaller image in the heritage
   * pair. Shallower than `heritagePhoto` so the two read as a deliberate
   * primary/secondary pairing rather than two mismatched crops.
   */
  heritageDetail: 3 / 2,

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
 * The conventional `N:M` name for each ratio, for use in UI copy.
 *
 * Declared here, next to the number it describes, rather than derived from it.
 * Recovering "3:2" from `1.5` by arithmetic works for exactly the fractions in
 * `aspectRatios` and silently degrades to "1.500" for anything else — and a crop
 * hint that says "1.500" is worse than no hint. Keeping the string beside the
 * number is also what stops a hint from disagreeing with the ratio it is
 * describing.
 */
export const aspectRatioNames: Record<AspectRatioKey, string> = {
  hero: "16:9",
  heritagePhoto: "4:3",
  heritageDetail: "3:2",
  principalPortrait: "4:5",
  newsCard: "16:10",
  galleryThumb: "1:1",
  mosaicTile: "3:2",
  achievementCard: "3:2",
  alumniPhoto: "3:2",
};

/**
 * Human-readable labels for each ratio, used in the upload UI to tell the
 * editor what crop is expected.
 */
export const aspectRatioLabels: Record<AspectRatioKey, string> = {
  hero: "16 : 9 — Hero / full-width banner",
  heritagePhoto: "4 : 3 — Heritage photograph",
  heritageDetail: "3 : 2 — Heritage architectural detail",
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
  heritageDetail: 1200,
  principalPortrait: 800,
  newsCard: 800,
  galleryThumb: 600,
  mosaicTile: 800,
  achievementCard: 800,
  alumniPhoto: 800,
};

/**
 * Everything the uploader needs to know about one ratio, in one lookup.
 *
 * The three maps above are separate on purpose — the number, the name and the
 * minimum width are different kinds of fact — but every consumer wants all three
 * at once, and reading them in parallel at each call site is how a hint ends up
 * describing a different ratio from the one being enforced. `ratioSpec` is the
 * single read that keeps them together.
 */
export const ratioSpec = (key: AspectRatioKey) => ({
  key,
  ratio: aspectRatios[key],
  name: aspectRatioNames[key],
  label: aspectRatioLabels[key],
  minWidth: aspectRatioMinWidth[key],
});
