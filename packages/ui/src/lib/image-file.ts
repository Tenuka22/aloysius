/**
 * Which files the cropper will accept, and the size it refuses to open.
 *
 * Kept out of `image-crop-dialog.tsx` on purpose: a module holding a component
 * should hold that component, and these are values other modules need in order
 * to *reach* it. The crop dialog is the only place a photograph enters, so its
 * accept list and its size limit are the accept list and size limit of the whole
 * upload path.
 */

/** The file types that can be cropped, and therefore the only ones accepted. */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/** The `accept` attribute value for the file input. */
export const ACCEPTED_IMAGE_ATTR = ACCEPTED_IMAGE_TYPES.join(",");

/**
 * The largest file accepted, matching the server's `MAX_FILE_SIZE` in
 * `packages/api/src/routers/files/get-upload-url.ts`.
 *
 * Declared here as well as there because the server's limit is a *rejection*
 * after the bytes have crossed the network, and an editor who finds out at that
 * point has usually already spent a minute on the crop.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** `MAX_UPLOAD_BYTES` in megabytes, for the message that quotes it. */
export const MAX_MB = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024);

/**
 * Reject files before they are previewed.
 *
 * Returns a message describing the *first* problem, or `null` when the file is
 * usable. Both checks are duplicated on the server — this one exists so a
 * rejected file costs the editor nothing, not because the client is trusted.
 */
export const describeFileProblem = (file: File): string | null => {
  const acceptedImage = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(
    file.type
  );
  if (!acceptedImage) {
    return `"${file.name}" is not a JPEG, PNG, WebP or AVIF image.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is ${Math.round(file.size / 1024 / 1024)} MB. The limit is ${MAX_MB} MB.`;
  }
  return null;
};
