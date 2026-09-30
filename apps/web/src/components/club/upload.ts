import { client } from "@/utils/orpc";

/**
 * The quality passed to the WebP encoder.
 *
 * A named constant rather than a magic argument because it is the one dial
 * between image quality and load time, and every uploader shares it: a
 * photograph encoded at 0.85 is visually indistinguishable from the original
 * at gallery sizes and typically a fifth of the bytes.
 */
const WEBP_QUALITY = 0.85;

/** The maximum edge length a stored image may have, in pixels. */
const MAX_EDGE = 2560;

/**
 * Convert an image file to WebP before it is stored.
 *
 * Every image this app uploads is transcoded in the browser, on the
 * uploader's own machine, before the presigned upload starts. The server
 * stays out of the byte path entirely - the same reason the upload is
 * presigned in the first place - and MinIO only ever holds WebP, so every
 * `/api/files` URL serves the small encoding without an on-the-fly
 * transcoder.
 *
 * Steps: decode (EXIF orientation applied by `createImageBitmap`), downscale
 * so the longest edge is at most `MAX_EDGE`, re-encode as WebP at
 * `WEBP_QUALITY`. A 6000px JPEG from a camera arrives as a ~2560px WebP a
 * fraction of its former size; a small image passes through at its own
 * dimensions.
 *
 * Encoding goes through `OffscreenCanvas.convertToBlob`. Every browser that
 * ships `createImageBitmap` has shipped `OffscreenCanvas` for years, so the
 * two are treated as one requirement rather than guarded separately.
 *
 * Returns the original file unchanged when there is nothing to do or nothing
 * to do it with: WebP inputs skip re-encoding (WebP-to-WebP only loses
 * quality), non-image types pass through, and a browser without the bitmap
 * and OffscreenCanvas APIs falls back to the original bytes rather than
 * failing the upload. The file extension travels with the conversion, so
 * `getUploadUrl` presigns a `.webp` key and the stored content type is
 * honest.
 */
export const convertToWebP = async (file: File): Promise<File> => {
  if (file.type === "image/webp" || !file.type.startsWith("image/")) {
    return file;
  }
  if (
    typeof createImageBitmap !== "function" ||
    typeof OffscreenCanvas !== "function"
  ) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Undecodable input: let the upload proceed so the reviewer, not the
    // uploader's browser, decides what to do with it.
    return file;
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await canvas.convertToBlob({
      type: "image/webp",
      quality: WEBP_QUALITY,
    });

    if (blob.type !== "image/webp") {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/u, "");
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } finally {
    bitmap.close();
  }
};

/**
 * The shared body of both upload helpers: convert, presign, PUT, register.
 *
 * Returns the whole file record so each caller can take what it actually
 * needs - the id (gallery items, cover banners) or the URL (CMS block
 * editors, which render straight from `record.url`).
 */
const uploadConverted = async (input: File) => {
  const file = await convertToWebP(input);

  const presigned = await client.files.getUploadUrl({
    name: file.name,
    size: file.size,
    type: file.type,
  });

  const response = await fetch(presigned.uploadUrl, {
    body: file,
    headers: { "Content-Type": file.type },
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(`"${file.name}" could not be uploaded.`);
  }

  return client.files.completeUpload({
    key: presigned.key,
    name: file.name,
    size: file.size,
    type: file.type,
  });
};

/**
 * Upload an image, returning its file id.
 *
 * A content row references `fileId`, and the URL is derived from it wherever
 * an image is actually rendered. Returning the URL here would tempt callers
 * into storing it, which breaks the moment a file is moved.
 */
export const uploadImageFile = async (file: File): Promise<string> => {
  const record = await uploadConverted(file);
  return record.id;
};

/**
 * Upload an image, returning its URL.
 *
 * Kept for the CMS block editors, which render straight from `record.url` and
 * store block content by URL today. Same pipeline, different return value.
 */
export const uploadImage = async (file: File): Promise<string> => {
  const record = await uploadConverted(file);
  return record.url;
};
