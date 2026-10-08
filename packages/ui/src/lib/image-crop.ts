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

/** Quality passed to the encoder. */
const WEBP_QUALITY = 0.85;

/**
 * The longest edge a stored image may have, in pixels.
 *
 * 2560 covers a full-width hero on a 2x display without being visibly soft, and
 * a crop that exceeds it is almost always a photographer sending a raw camera
 * file rather than a deliberate large upload.
 */
const MAX_EDGE = 2560;

export interface ImageSize {
  width: number;
  height: number;
}

/** What a crop produced, including enough to tell the operator what happened. */
export interface CropResult {
  file: File;
  /** Dimensions of the stored image, after capping and rounding. */
  width: number;
  height: number;
  /** Size of the file the operator picked, for the "saved N" line. */
  sourceBytes: number;
  /** Size actually stored. */
  bytes: number;
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
 * A canvas of the given size, whichever kind this browser has.
 *
 * `OffscreenCanvas` is the better API — it does not touch the document and can be
 * transferred — but it is not universally available, and it was used
 * unconditionally. On a browser without it the constructor threw a `ReferenceError`
 * out of `cropToFile`, which the crop dialog reported as "That image could not be
 * cropped.": so the photograph that failed was not the operator's fault and the
 * message told them nothing. Every image upload on that browser was dead, cropping
 * and all.
 *
 * Both paths are kept because they produce identical pixels; only the way the
 * bytes come back out differs, which `canvasToBlob` handles.
 */
const createCanvas = (width: number, height: number): Canvas => {
  if (typeof OffscreenCanvas === "function") {
    return new OffscreenCanvas(width, height) as unknown as Canvas;
  }
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  return element;
};

/** A canvas that is either kind, without naming either in the caller's types. */
type Canvas = OffscreenCanvas | HTMLCanvasElement;

/**
 * Encode a canvas, whichever kind it is.
 *
 * The MIME type actually produced is returned rather than the one requested: a
 * browser that cannot encode WebP silently encodes PNG instead, and naming the
 * file `.webp` when its bytes are PNG means the extension lies about the content
 * for every downstream consumer. `cropToFile` names the file from this.
 */
const canvasToBlob = async (
  canvas: Canvas,
  type: string,
  quality: number
): Promise<Blob> => {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(
          new Error(
            "This browser could not encode the cropped image. Try Chrome, Edge, Firefox or Safari."
          )
        );
      },
      type,
      quality
    );
  });
};

/** The file extension for a MIME type, so the name matches the bytes. */
const extensionFor = (mimeType: string): string => {
  const subtype = mimeType.split("/")[1] ?? "";
  const cleaned = subtype.replace(/^x-/u, "").replace(/\+.*$/u, "");
  return /^[a-z0-9]{1,10}$/u.test(cleaned) ? cleaned : "bin";
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
 *
 * Falls back to an `<img>` for browsers without it, for the same reason
 * `createCanvas` falls back: a missing optimisation API must not be the reason a
 * photograph cannot be uploaded.
 */
export const readImageSize = async (file: File): Promise<ImageSize> => {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<ImageSize>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      };
      image.onerror = () => {
        reject(new Error(`"${file.name}" could not be read as an image.`));
      };
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

/** Decode a file to something drawable, on whichever API this browser has. */
const decode = async (
  file: File
): Promise<ImageBitmap | (HTMLImageElement & { close?: () => void })> => {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve(image);
      };
      image.onerror = () => {
        reject(new Error(`"${file.name}" could not be read as an image.`));
      };
      image.src = url;
    });
  } catch (error) {
    throw error;
  } finally {
    // The image has decoded by the time either callback runs, so the URL can go.
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  }
};

/**
 * Render a crop of `file` to a new image file at exactly `aspectRatio`.
 *
 * Steps: decode (EXIF orientation applied), resolve the percentage crop to whole
 * pixels, shrink it to the largest box of the target shape that fits inside both
 * the crop and the source, cap the longest edge at `MAX_EDGE`, re-encode.
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
}): Promise<CropResult> => {
  const source = await decode(file);

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

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(
        "This browser cannot crop images. Try Chrome, Edge, Firefox or Safari."
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
      source as CanvasImageSource,
      originX,
      originY,
      target.width,
      target.height,
      0,
      0,
      width,
      height
    );

    const blob = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);

    if (blob.size === 0) {
      throw new Error(
        "The cropped image came out empty. Try a different part of the photograph."
      );
    }

    const baseName = file.name.replace(/\.[^.]+$/u, "") || "image";
    return {
      file: new File([blob], `${baseName}.${extensionFor(blob.type)}`, {
        type: blob.type,
      }),
      width,
      height,
      sourceBytes: file.size,
      bytes: blob.size,
    };
  } finally {
    source.close?.();
  }
};

/** Human-readable byte size, for the "was … now …" line. */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
