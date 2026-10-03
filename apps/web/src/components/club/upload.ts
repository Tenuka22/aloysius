import { client } from "@/utils/orpc";

/**
 * Getting a chosen image into storage.
 *
 * Three steps, in this order, and the order is the design: transcode, ask for a
 * destination, PUT. Cropping has already happened by the time a file reaches
 * here — `FileUploader` in `packages/ui` does it in the editor's browser — so
 * this module is only concerned with moving bytes.
 *
 * ## Why the browser PUTs to the app and not to storage
 *
 * Storage (MinIO) is only reachable from the server: in Docker it answers to an
 * internal hostname on a port that is deliberately not published. `getUploadUrl`
 * therefore returns a path on this app, and `/api/files/upload/*` forwards it —
 * the same arrangement `/api/files/*` already uses to serve images back.
 */
export const uploadConverted = async (file: File) => {
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
 * A content row references `fileId`, and the URL is derived from it wherever an
 * image is actually rendered. Returning the URL here would tempt callers into
 * storing it, which breaks the moment a file is moved.
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
