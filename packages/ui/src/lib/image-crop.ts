import type { PercentCrop } from "react-image-crop";

/**
 * Turning a chosen photograph into the exact bytes that get stored.
 *
 * Everything here runs in the uploader's browser, before any network call. That
 * is deliberate: cropping and re-encoding are the two operations that decide how
 * large a file is, and doing them client-side means the server never has to hold
 * a 6000px camera JPEG in memory to discover it was a 6000px camera JPEG.
 *
 * There used to be two encoders for this one job — `OffscreenCanvas` to WebP in
 * the club portal, `HTMLCanvasElement` to JPEG in the CMS — so the same
 * photograph uploaded from two screens was stored two different ways at two
 * different sizes. This module is the single one.
 */

/** Quality passed to the WebP encoder. */
const WEBP_QUALITY = 0.85;

/**
 * The longest edge a stored image may have, in pixels.
 *
 * 2560 covers a full-width hero on a 2x display without being visibly soft, and
 * a crop that exceeds it is almost always a photographer sending a raw camera
 * file rather than a deliberate large upload.
 */
const MAX_EDGE = 2560;

/** The file extension every cropped image is stored under. */
const CROP_EXTENSION = "webp";

export interface ImageSize {
  width: number;
  height: number;
}

/**
 * The largest box of the given shape that fits inside `bounds`, centred.
 *
 * Used to keep a crop inside the source image: `react-image-crop` reports
 * percentages, and rounding them to whole pixels can land a few pixels past the
 * edge, which a canvas silently renders as black.
 */
const fitInside = (bounds: ImageSize, aspectRatio: number): ImageSize => {
  const boundRatio = bounds.width / bounds.height;

  if (boundRatio > aspectRatio) {
    const width = Math.round(bounds.height * aspectRatio);
    return { width, height: bounds.height };
  }

  const height = Math.round(bounds.width / aspectRatio);
  return { width: bounds.width, height };
};

/**
 * Read an image's pixel dimensions without decoding it into the document.
 *
 * `createImageBitmap` decodes lazily and off the main thread, and it applies EXIF
 * orientation — so the numbers it reports are the ones the cropper will actually
 * see, which a `<img>`'s `naturalWidth` only agrees with for files that have not
 * been rotated by a phone camera. Reading the size twice, through two different
 * APIs, is how a crop ends up transposed on exactly the photographs most likely
 * to be uploaded from a phone.
 */
export const readImageSize = async (file: File): Promise<ImageSize> => {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
};

/**
 * Render a crop of `file` to a new WebP file at exactly `aspectRatio`.
 *
 * Steps: decode (EXIF orientation applied), resolve the percentage crop to whole
 * pixels, shrink it to the largest box of the target shape that fits inside both
 * the crop and the source, cap the longest edge at `MAX_EDGE`, re-encode as WebP.
 *
 * `centerCrop` is deliberately not used here. It returns a crop at the source's
 * own shape, not the requested one — correct for a cropper that has already
 * constrained the selection with `aspect`, and wrong the moment it does not,
 * which is exactly the case where the stored image would not match its ratio.
 * Resolving the box from the ratio instead means the output is the right shape
 * whether or not the selection happened to be.
 */
export const cropToFile = async ({
  aspectRatio,
  crop,
  file,
  naturalSize,
}: {
  /** Width / height, from `tokens/aspect-ratios.ts`. */
  aspectRatio: number;
  crop: PercentCrop;
  file: File;
  naturalSize: ImageSize;
}): Promise<File> => {
  const bitmap = await createImageBitmap(file);

  try {
    // The selected region, in whole pixels. `Math.min` against the source
    // guards a crop dragged a pixel or two past the edge.
    const selected: ImageSize = {
      width: Math.min(
        Math.round((crop.width / 100) * naturalSize.width),
        naturalSize.width
      ),
      height: Math.min(
        Math.round((crop.height / 100) * naturalSize.height),
        naturalSize.height
      ),
    };

    if (selected.width < 1 || selected.height < 1) {
      throw new Error("That crop has no visible area. Try a larger selection.");
    }

    const target = fitInside(selected, aspectRatio);
    const scale = Math.min(1, MAX_EDGE / Math.max(target.width, target.height));
    const width = Math.max(1, Math.round(target.width * scale));
    const height = Math.max(1, Math.round(target.height * scale));

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(
        "This browser cannot crop images. Try Chrome, Safari or Firefox."
      );
    }

    // Centre of the selection in source pixels: `fitInside` may have taken a
    // smaller box than was selected, and the difference has to come off both
    // sides evenly or the crop appears to jump when it is applied.
    const originX = Math.round(
      (crop.x / 100) * naturalSize.width + (selected.width - target.width) / 2
    );
    const originY = Math.round(
      (crop.y / 100) * naturalSize.height +
        (selected.height - target.height) / 2
    );

    context.drawImage(
      bitmap,
      originX,
      originY,
      target.width,
      target.height,
      0,
      0,
      width,
      height
    );

    const blob = await canvas.convertToBlob({
      type: "image/webp",
      quality: WEBP_QUALITY,
    });

    const baseName = file.name.replace(/\.[^.]+$/u, "") || "image";
    return new File([blob], `${baseName}.${CROP_EXTENSION}`, {
      type: "image/webp",
    });
  } finally {
    bitmap.close();
  }
};
