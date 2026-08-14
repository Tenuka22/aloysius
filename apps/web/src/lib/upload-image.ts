import { client } from "@/utils/orpc";
import { convertToWebp } from "@/utils/convert-to-webp";
import { withAspectRatio } from "@/lib/image-ratio";

/**
 * Upload an image through the CMS (webp) and return its URL with the crop
 * aspect ratio saved on it, so display components can render it with the
 * exact ratio chosen at crop time.
 */
export async function uploadImageWithRatio(file: File, aspect = 16 / 9): Promise<string> {
  const webp = await convertToWebp(file);
  const result = await client.files.uploadFile(webp);
  return withAspectRatio(result.url, aspect);
}
