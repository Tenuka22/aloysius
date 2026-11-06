/**
 * Which files the cropper will accept. There is no size limit; every photo is re-encoded to WebP by the cropper.
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
  return null;
};
