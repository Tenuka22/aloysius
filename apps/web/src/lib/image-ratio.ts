/**
 * Save and read the crop aspect ratio of an uploaded image.
 *
 * When an admin uploads an image through the crop-enabled field, the chosen
 * aspect ratio (16:9, 4:3, 3:4, 1:1 ...) is appended to the stored URL as a
 * `ratio` query param so display components can render it with that ratio.
 */

/** Convert a numeric aspect (width / height) to a "W:H" string, or null if unrecognized. */
export function aspectToRatioString(aspect: number): string | null {
  const map: Record<string, string> = {
    "1.7777777777777777": "16:9",
    "1.3333333333333333": "4:3",
    "0.75": "3:4",
    "1": "1:1",
  };
  return map[String(aspect)] ?? null;
}

/** Append the crop ratio to an uploaded image URL so it can be used for display. */
export function withAspectRatio(url: string, aspect: number): string {
  const ratio = aspectToRatioString(aspect);
  if (!ratio) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}ratio=${encodeURIComponent(ratio)}`;
}

/** Read the saved ratio ("W:H") from an image URL, as a numeric width/height value. */
export function getAspectRatio(url?: string | null): number | null {
  if (!url) return null;
  try {
    const params = new URL(url, "http://local").searchParams;
    const ratio = params.get("ratio");
    if (!ratio) return null;
    const [w, h] = ratio.split(":").map((n) => Number.parseFloat(n));
    if (!w || !h || w <= 0 || h <= 0) return null;
    return w / h;
  } catch {
    return null;
  }
}

/** Tailwind aspect class for a numeric ratio, or empty string when unknown. */
export function aspectRatioClass(ratio: number | null): string {
  if (ratio === null) return "";
  const key =
    Math.abs(ratio - 16 / 9) < 0.01
      ? "aspect-video"
      : Math.abs(ratio - 4 / 3) < 0.01
        ? "aspect-[4/3]"
        : Math.abs(ratio - 1) < 0.01
          ? "aspect-square"
          : Math.abs(ratio - 3 / 4) < 0.01
            ? "aspect-[3/4]"
            : "";
  return key;
}
