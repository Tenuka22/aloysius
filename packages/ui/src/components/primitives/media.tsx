import * as stylex from "@stylexjs/stylex";
import type { ImgHTMLAttributes } from "react";

import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";

const styles = stylex.create({
  frame: {
    position: "relative",
    display: "block",
    width: "100%",
    overflow: "hidden",
    backgroundColor: color.placeholder,
    // Reserving the box with aspect-ratio is what keeps CLS at 0 for the ~15
    // images on this page.
    isolation: "isolate",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    transitionProperty: "transform",
    transitionDuration: motionToken.slow,
    transitionTimingFunction: motionToken.ease,
  },
  zoom: {
    transform: {
      default: "scale(1)",
      [bp.hover]: {
        default: "scale(1)",
        ":hover": "scale(1.04)",
      },
    },
  },

  ratio1x1: { aspectRatio: "1 / 1" },
  ratio4x3: { aspectRatio: "4 / 3" },
  ratio3x2: { aspectRatio: "3 / 2" },
  ratio16x9: { aspectRatio: "16 / 9" },
  ratio3x4: { aspectRatio: "3 / 4" },
  ratio4x5: { aspectRatio: "4 / 5" },
  fill: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    aspectRatio: "auto",
  },

  placeholder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    padding: space.sm,
    backgroundImage: `repeating-linear-gradient(135deg, ${color.placeholder} 0 10px, transparent 10px 20px)`,
    borderWidth: space.px,
    borderStyle: "dashed",
    borderColor: color.border,
  },
  /**
   * Used where a placeholder sits behind other content (the hero background):
   * the hatching and caption would show through the scrim.
   */
  placeholderBare: {
    width: "100%",
    height: "100%",
    backgroundColor: color.placeholder,
  },
  placeholderText: {
    margin: 0,
    maxWidth: "24ch",
    fontSize: font.sizeXs,
    fontWeight: font.weightSemibold,
    letterSpacing: font.trackingWide,
    textAlign: "center",
    textTransform: "uppercase",
    color: color.placeholderInk,
  },
});

const RATIOS = {
  "1:1": styles.ratio1x1,
  "4:3": styles.ratio4x3,
  "3:2": styles.ratio3x2,
  "16:9": styles.ratio16x9,
  "3:4": styles.ratio3x4,
  "4:5": styles.ratio4x5,
} as const;

export type Ratio = keyof typeof RATIOS;

/**
 * Either a named preset above or a raw `width / height` number taken straight
 * from `tokens/aspect-ratios.ts`. Numbers are preferred for new call sites:
 * they keep the component and the token file from drifting apart, and a token
 * that changes propagates on its own.
 */
export type RatioProp = Ratio | number;

export interface ImageSource {
  src: string;
  /** Comma-separated `srcset` for high-DPI and art direction. */
  srcSet?: string;
  /** Layout width hint so the browser can pick before CSS is parsed. */
  sizes?: string;
  alt: string;
  width?: number;
  height?: number;
  /** Width divided by height, used to reserve the image box. */
  aspectRatio?: number;
}

/**
 * Responsive image with a reserved box.
 *
 * - `priority` marks the LCP image: eager + `fetchpriority="high"`, and it is the
 *   only image on the page allowed to opt out of lazy loading.
 * - Everything else is `loading="lazy" decoding="async"`.
 * - When no source is supplied yet (content is still pending from the CMS) a
 *   branded placeholder occupies exactly the same box, so wiring real photos in
 *   later cannot shift the layout.
 */
const resolveAspectRatio = (
  source: ImageSource | undefined,
  fill: boolean,
  aspectRatio: number | undefined
): number | undefined => {
  if (fill) {
    return undefined;
  }
  const intrinsicAspectRatio =
    source?.width && source.height ? source.width / source.height : undefined;
  const resolved = aspectRatio ?? source?.aspectRatio ?? intrinsicAspectRatio;
  if (
    typeof resolved === "number" &&
    Number.isFinite(resolved) &&
    resolved > 0
  ) {
    return resolved;
  }
  return undefined;
};

/**
 * Typed as `ImgHTMLAttributes` so the literal unions on `decoding`, `loading`
 * and `fetchPriority` are checked at the call site rather than widening to
 * `string` and failing when spread onto the `<img>`.
 */
const getImageProps = (
  source: ImageSource,
  priority: boolean
): ImgHTMLAttributes<HTMLImageElement> => ({
  decoding: priority ? "sync" : "async",
  fetchPriority: priority ? "high" : "auto",
  height: source.height,
  loading: priority ? "eager" : "lazy",
  sizes: source.sizes,
  src: source.src,
  srcSet: source.srcSet,
  width: source.width,
});

const getPlaceholderProps = (placeholder: string) =>
  placeholder ? styles.placeholder : styles.placeholderBare;

export const Media = ({
  source,
  placeholder,
  ratio = "4:3",
  fill = false,
  zoom = false,
  priority = false,
  style,
  aspectRatio,
}: {
  source?: ImageSource;
  /** Empty string renders a plain tint with no caption. */
  placeholder: string;
  /**
   * A `aspectRatios` token, or one of the named presets. Presets compile to a
   * StyleX class; a token resolves to the same `aspect-ratio` inline value, so
   * the reserved box is identical either way.
   */
  ratio?: RatioProp;
  fill?: boolean;
  zoom?: boolean;
  priority?: boolean;
  style?: stylex.StyleXStyles;
  /** Overrides the preset ratio when an image carries its own dimensions. */
  aspectRatio?: number;
}) => {
  const preset = typeof ratio === "string" ? RATIOS[ratio] : undefined;
  const resolvedAspectRatio = resolveAspectRatio(
    source,
    fill,
    aspectRatio ?? (typeof ratio === "number" ? ratio : undefined)
  );
  const hasAspectRatio = resolvedAspectRatio !== undefined;

  return (
    <div
      style={hasAspectRatio ? { aspectRatio: resolvedAspectRatio } : undefined}
      {...stylex.props(styles.frame, fill ? styles.fill : preset, style)}
    >
      {source ? (
        <img
          alt={source.alt}
          {...getImageProps(source, priority)}
          {...stylex.props(styles.image, zoom && styles.zoom)}
        />
      ) : (
        <div
          aria-hidden="true"
          {...stylex.props(getPlaceholderProps(placeholder))}
        >
          {placeholder ? (
            <p {...stylex.props(styles.placeholderText)}>{placeholder}</p>
          ) : null}
        </div>
      )}
    </div>
  );
};
