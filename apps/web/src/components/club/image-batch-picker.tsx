import { MediaFrame } from "@aloysius/ui/components/primitives/media-frame";
import { aspectRatios } from "@aloysius/ui/tokens/aspect-ratios";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import type { ChangeEvent } from "react";

/**
 * Picking a batch of images to upload.
 *
 * Two decisions are baked in here rather than left to each caller, because
 * getting either wrong is expensive:
 *
 * - **At most `MAX_IMAGES_PER_BATCH` files at a time.** A club's best work is
 *   usually far more than five photographs, and it is nearly always split across
 *   several sittings. Five per batch is a comfortable number to choose, upload
 *   and caption in one pass; the total is unbounded, so the limit costs the
 *   club nothing. The count is enforced here *and* re-checked by the caller,
 *   because a `multiple` input is a hint and not a guarantee.
 * - **Image files only.** A picker that quietly accepts a PDF and uploads it as
 *   a gallery item produces a broken page that only fails for visitors.
 */

export const MAX_IMAGES_PER_BATCH = 5;

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
  selected: {
    display: "grid",
    gap: space.md,
    margin: 0,
    padding: 0,
    listStyle: "none",
    /*
     * A grid rather than a list of filenames because the whole point of choosing
     * a photograph is seeing it. The container each frame reserves is the crop the
     * chosen role will be composed for, so a portrait shot offered as a 16:9
     * banner is visibly wrong here rather than after a re-upload.
     */
    gridTemplateColumns: "repeat(auto-fill, minmax(6rem, 1fr))",
  },
  selectedItem: {
    display: "grid",
    gap: space["3xs"],
    minWidth: 0,
  },
  selectedRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: space["2xs"],
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
  },
  fileName: {
    fontFamily: font.mono,
    color: color.onSurface,
    overflowWrap: "anywhere",
  },
  remove: {
    marginInlineStart: "auto",
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

export interface SelectedImage {
  file: File;
  /** Object URL for the preview. Revoked when the image is removed. */
  previewUrl: string;
}

export const ImageBatchPicker = ({
  aspectRatio = aspectRatios.galleryThumb,
  disabled = false,
  onSelect,
  selected,
}: {
  /**
   * The crop each preview is reserved at. Defaults to the square grid tile, which
   * is what an ordinary gallery image is; a caller that is choosing a cover or a
   * banner passes the ratio for that role so the photograph is previewed in the
   * shape it will actually be published.
   */
  aspectRatio?: number;
  disabled?: boolean;
  selected: readonly SelectedImage[];
  onSelect: (images: SelectedImage[]) => void;
}) => {
  const [problem, setProblem] = useState<string | null>(null);
  const full = selected.length >= MAX_IMAGES_PER_BATCH;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = [...(event.target.files ?? [])];
    // Cleared up front so re-picking the same file still fires a change event.
    event.target.value = "";
    if (chosen.length === 0) {
      return;
    }

    const room = MAX_IMAGES_PER_BATCH - selected.length;
    if (chosen.length > room) {
      setProblem(
        `You picked ${chosen.length} images. Add ${room} at a time — come back for the rest.`
      );
      return;
    }

    const wrongType = chosen.find((file) => !ACCEPTED.includes(file.type));
    if (wrongType) {
      setProblem(`"${wrongType.name}" is not a JPEG, PNG, WebP or AVIF image.`);
      return;
    }

    setProblem(null);
    onSelect([
      ...selected,
      ...chosen.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const removeAt = (index: number) => {
    const target = selected[index];
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onSelect(selected.filter((_, position) => position !== index));
  };

  return (
    <div {...stylex.props(styles.field)}>
      <span {...stylex.props(styles.label)}>
        {full
          ? `Batch full — ${MAX_IMAGES_PER_BATCH} of ${MAX_IMAGES_PER_BATCH}`
          : `Images — ${selected.length} of ${MAX_IMAGES_PER_BATCH}`}
      </span>
      <input
        accept={ACCEPTED.join(",")}
        disabled={disabled || full}
        multiple
        onChange={handleChange}
        type="file"
        {...stylex.props(styles.input)}
      />
      <p {...stylex.props(styles.hint)}>
        {full
          ? `Submit this batch to pick the next ${MAX_IMAGES_PER_BATCH}. There is no limit on the total.`
          : `Up to ${MAX_IMAGES_PER_BATCH} at a time. JPEG, PNG, WebP or AVIF, up to 10 MB each.`}
      </p>
      {problem ? <p {...stylex.props(styles.problem)}>{problem}</p> : null}
      {selected.length > 0 ? (
        <ul {...stylex.props(styles.selected)}>
          {selected.map((image, index) => (
            <li key={image.previewUrl} {...stylex.props(styles.selectedItem)}>
              <MediaFrame
                alt={image.file.name}
                aspectRatio={aspectRatio}
                src={image.previewUrl}
              />
              <span {...stylex.props(styles.selectedRow)}>
                <span {...stylex.props(styles.fileName)}>
                  {image.file.name}
                </span>
                <span aria-hidden="true">·</span>
                <span>{(image.file.size / 1024).toFixed(0)} KB</span>
              </span>
              <button
                onClick={() => {
                  removeAt(index);
                }}
                type="button"
                {...stylex.props(styles.remove)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
