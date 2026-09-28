import { client } from "@/utils/orpc";

/**
 * Presign, PUT, register.
 *
 * The three-step dance every uploader in this app performs, in one place. The
 * middle step goes straight to object storage with the exact content type the
 * presign was issued for - the app server is not in the path, so a 30 MB
 * photograph never occupies a request handler and the server never has to hold
 * an image in memory.
 *
 * Returns the file id, not the URL: a gallery item references `fileId`, and the
 * URL is derived from it wherever an image is actually rendered. Returning the
 * URL here would tempt callers into storing it, which breaks the moment a file
 * is moved.
 */
export const uploadImage = async (file: File): Promise<string> => {
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

  const record = await client.files.completeUpload({
    key: presigned.key,
    name: file.name,
    size: file.size,
    type: file.type,
  });

  return record.id;
};
