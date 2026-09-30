import { MediaFrame } from "@aloysius/ui/components/primitives/media-frame";
import { aspectRatios } from "@aloysius/ui/tokens/aspect-ratios";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { uploadImageFile } from "./upload";

/**
 * Choosing the one image that represents a club.
 *
 * Separate from `ImageBatchPicker` because this is a different decision with
 * different consequences: a gallery takes as many images as the club has, and
 * this takes exactly one, and it is the image a visitor sees first on the
 * students page. A batch picker here would let a club accidentally upload three
 * photographs and pick one at random by upload order.
 *
 * The upload happens here rather than in the caller so the file never becomes
 * content state that a form has to be told about. What the parent receives is a
 * `fileId`, which is what the club row stores; the object URL is only ever a
 * preview and is revoked when it is replaced.
 */
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const styles = stylex.create({
  field: {
    display: "grid",
    gap: space["2xs"],
    minWidth: 0,
  },
  label: {
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurface,
  },
  input: {
    display: "block",
    width: "100%",
    minHeight: "2.75rem",
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: font.sizeSm,
    cursor: "pointer",
    ":disabled": {
      backgroundColor: color.placeholder,
      color: color.onSurfaceSubtle,
      cursor: "not-allowed",
    },
  },
  hint: {
    margin: 0,
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
  problem: {
    margin: 0,
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.danger,
  },
  remove: {
    justifySelf: "start",
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: color.accentOnSurface,
    fontFamily: font.body,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    textDecoration: "underline",
    cursor: "pointer",
  },
});

export interface CoverImageSelection {
  /** The uploaded file id, or null when the banner is being removed. */
  fileId: string | null;
  /** Object URL for previewing a just-uploaded file. Already-uploaded ones use `currentUrl`. */
  previewUrl: string | null;
  /** False when this selection is a removal rather than a replacement. */
  isRemoval: boolean;
}

export const CoverImagePicker = ({
  currentUrl,
  label,
  onSelect,
  selected,
}: {
  /** The banner currently live on the site, if any. */
  currentUrl: string | null;
  label: string;
  /** `null` when nothing has been chosen in this session. */
  selected: CoverImageSelection | null;
  onSelect: (selection: CoverImageSelection | null) => void;
}) => {
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<string | null>(null);

  /**
   * Object URLs are a leak if they are not released: each one pins the whole
   * file in memory for the life of the document. The previous preview is revoked
   * at the point a new one is created rather than in an effect on unmount, so
   * there is no window where a replaced image is still being held.
   */
  const releasePreview = (url: string | null) => {
    if (url && url !== previewRef.current) {
      URL.revokeObjectURL(url);
    }
  };

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cleared up front so re-picking the same file still fires a change event.
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!ACCEPTED.includes(file.type)) {
      setProblem(`"${file.name}" is not a JPEG, PNG, WebP or AVIF image.`);
      return;
    }

    setProblem(null);
    setBusy(true);
    try {
      const fileId = await uploadImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      releasePreview(previewRef.current);
      previewRef.current = previewUrl;
      onSelect({ fileId, previewUrl, isRemoval: false });
    } catch (error) {
      setProblem(
        error instanceof Error
          ? error.message
          : "That image could not be uploaded. Try a smaller file."
      );
    }
    // No `finally`: the React Compiler cannot lower a `try` with one, and the
    // reset is a plain statement either way.
    setBusy(false);
  };

  const clear = () => {
    releasePreview(previewRef.current);
    previewRef.current = null;
    onSelect({ fileId: null, previewUrl: null, isRemoval: true });
  };

  const shown = selected?.previewUrl ?? currentUrl;

  return (
    <div {...stylex.props(styles.field)}>
      <span {...stylex.props(styles.label)}>{label}</span>
      {/*
       * Reserved at the *banner's* ratio, not the picker's. A photograph
       * composed to fill this box still has usable middle thirds once the CMS
       * crops it wider for a strip; one composed for a wider strip loses its
       * subject here. Showing the roomier box stops the club producing a banner
       * that is already too tight.
       */}
      <MediaFrame
        aspectRatio={aspectRatios.mosaicTile}
        hint="No banner chosen yet"
        src={shown}
      />
      <input
        accept={ACCEPTED.join(",")}
        disabled={busy}
        onChange={(event) => {
          void handleChange(event);
        }}
        type="file"
        {...stylex.props(styles.input)}
      />
      <p {...stylex.props(styles.hint)}>
        JPEG, PNG, WebP or AVIF, up to 10 MB. Landscape works best — this is
        cropped wide across the top of the club.
      </p>
      {selected?.isRemoval ? (
        <p {...stylex.props(styles.hint)}>
          This banner will be taken down when the change is approved.
        </p>
      ) : null}
      {shown ? (
        <button onClick={clear} type="button" {...stylex.props(styles.remove)}>
          Remove this banner
        </button>
      ) : null}
      {problem ? <p {...stylex.props(styles.problem)}>{problem}</p> : null}
    </div>
  );
};
