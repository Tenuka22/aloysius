import * as stylex from "@stylexjs/stylex";

/**
 * Mobile-first media queries. Every value is a `min-width` so styles compose by
 * addition and the 320px base case is what renders when nothing matches.
 *
 * The device-width list we target (320/360/375/390/414/430/480/576/640/768/820/
 * 834/1024/1280/1366/1440/1536/1600/1728/1920/2560/3840/5120/7680) is deliberately
 * NOT one breakpoint each - that produces unmaintainable CSS. Layout changes happen
 * at these eight structural points; everything between them is covered by fluid
 * `clamp()` type and `minmax()` grids.
 */
export const bp = stylex.defineConsts({
  /** Large phones - 430px class devices. */
  sm: "@media (min-width: 26.75rem)",
  /** Small tablets / foldables unfolded - 640px. */
  md: "@media (min-width: 40rem)",
  /** Tablets portrait - 768px (iPad Mini, iPad, Android tablets). */
  lg: "@media (min-width: 48rem)",
  /** Tablets landscape / small laptops - 1024px (iPad Pro, Chromebooks). */
  xl: "@media (min-width: 64rem)",
  /** Laptops - 1280px. */
  xxl: "@media (min-width: 80rem)",
  /** Desktops - 1536px. */
  xxxl: "@media (min-width: 96rem)",
  /** Large desktop / iMac - 1920px. */
  wide: "@media (min-width: 120rem)",
  /** 4K, 5K, 8K and ultra-wide. */
  ultra: "@media (min-width: 160rem)",

  /**
   * Bounded bands.
   *
   * StyleX de-duplicates atomic classes across the whole app, so the emission
   * order of two overlapping `min-width` rules for the *same* property is
   * decided by whichever component happened to use that value first - not by
   * breakpoint size. Where one property is set at two breakpoints, use a bounded
   * band for the smaller one so only ever one rule matches and order is
   * irrelevant.
   */
  mdOnly: "@media (min-width: 40rem) and (max-width: 47.999rem)",
  mdToXl: "@media (min-width: 40rem) and (max-width: 63.999rem)",
  lgToXl: "@media (min-width: 48rem) and (max-width: 63.999rem)",

  /** Pointer capability, not screen size - hover-capable devices only. */
  hover: "@media (hover: hover) and (pointer: fine)",
  /** Coarse pointers: touch displays, kiosks, smart boards, TVs. */
  touch: "@media (hover: none), (pointer: coarse)",
  /** Users who asked the OS to reduce motion. */
  reducedMotion: "@media (prefers-reduced-motion: reduce)",
  /** High-DPI / retina displays. */
  retina: "@media (min-resolution: 2dppx)",
  /** Short viewports - phone landscape, where tall heroes must collapse. */
  short: "@media (max-height: 34rem) and (orientation: landscape)",
});
