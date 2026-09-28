import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { color, font, space } from "../../tokens/tokens.stylex";

/**
 * The reserved box an image occupies before it loads.
 *
 * Extracted from the CMS `MediaField`, which is the reference for how an image
 * should be presented while it is being chosen: a dashed container on the surface
 * colour, the image filling it with `object-fit: cover`, and a centred hint when
 * there is nothing to show yet. The club portal had grown its own three
 * variations on this - a bare `<input type="file">` with no container at all, a
 * 3rem square thumbnail, and a hardcoded `aspectRatio` string per call site - and
 * they all looked like different products.
 *
 * ## Why the box is reserved at all
 *
 * `aspect-ratio` on the frame means the space is allocated before the bytes
 * arrive. Without it, choosing an image reflows everything below it, which on a
 * form full of panels is a large, disorienting jump. The dashed border is
 * therefore a promise about layout, not decoration.
 *
 * ## Ratios
 *
 * `aspectRatio` is a plain number so it can take a token straight from
 * `tokens/aspect-ratios.ts` rather than a string literal. Passing a literal here
 * is how the club portal ended up with three different numbers for what the CMS
 * calls one thing.
 */
const styles = stylex.create({
  frame: {
    position: "relative",
    display: "grid",
    placeItems: "center",
    width: "100%",
    height: "auto",
    overflow: "hidden",
    borderWidth: space.px,
    borderStyle: "dashed",
    borderColor: color.borderStrong,
    backgroundColor: color.surface,
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  hint: {
    margin: 0,
    padding: space.md,
    textAlign: "center",
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  /** A small square for list rows, where the subject only has to be recognisable. */
  thumbFrame: {
    flexShrink: 0,
    width: "3rem",
    height: "3rem",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
});

/**
 * A full-width image container at a known ratio.
 *
 * `alt` is empty by design at most call sites: a thumbnail next to a caption
 * that already names the image is decorative, and a non-empty alt would make a
 * screen reader announce the same subject twice. Pass real alt text when the frame
 * is the only description of the image.
 */
export const MediaFrame = ({
  alt = "",
  aspectRatio,
  children,
  hint,
  src,
}: {
  aspectRatio: number;
  src?: string | null;
  alt?: string;
  /** Shown centred when there is no image. */
  hint?: string;
  children?: ReactNode;
}) => {
  let content: ReactNode = children ?? null;

  if (src) {
    content = (
      <img alt={alt} loading="lazy" src={src} {...stylex.props(styles.image)} />
    );
  } else if (hint) {
    content = <p {...stylex.props(styles.hint)}>{hint}</p>;
  }

  return (
    <div style={{ aspectRatio }} {...stylex.props(styles.frame)}>
      {content}
    </div>
  );
};

/**
 * A fixed-size thumbnail for a list row.
 *
 * Separate from `MediaFrame` because a row thumbnail is not a layout box: it is a
 * fixed square that has to sit inline with text without affecting the row's line
 * height. Giving it a `3 / 2` or `16 / 9` ratio here would make rows different
 * heights, so the square is deliberate and matches `aspectRatios.galleryThumb`.
 */
export const MediaThumb = ({
  alt = "",
  src,
}: {
  src: string | null;
  alt?: string;
}) => {
  if (!src) {
    return null;
  }

  return (
    <span {...stylex.props(styles.thumbFrame)}>
      <img
        alt={alt}
        loading="lazy"
        src={src}
        {...stylex.props(styles.thumbImage)}
      />
    </span>
  );
};
