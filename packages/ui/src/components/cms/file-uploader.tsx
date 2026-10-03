import * as stylex from "@stylexjs/stylex";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import {
  ACCEPTED_IMAGE_ATTR,
  describeFileProblem,
  MAX_MB,
} from "../../lib/image-file";
import { ratioSpec } from "../../tokens/aspect-ratios";
import type { AspectRatioKey } from "../../tokens/aspect-ratios";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, radius, space } from "../../tokens/tokens.stylex";
import { MediaFrame } from "../primitives/media-frame";
import { CmsButton, Notice } from "./cms-primitives";
import { ImageCropDialog } from "./image-crop-dialog";
import type { CropRequest } from "./image-crop-dialog";

/**
 * One uploader for every image in the CMS and the club portal.
 *
 * There were four `<input type="file">` elements in this codebase and no shared
 * component behind them, so the same decision — pick a photograph — was presented
 * four ways: a bare browser input, a dashed frame with no crop, a cropper, and a
 * batch grid. Three of them stored uncropped originals and let `object-fit: cover`
 * decide the shape at render time, which is how a banner ends up with the top of
 * somebody's head cropped off.
 *
 * This component is the one answer to all four:
 *
 * - **Every image declares its shape** as an `AspectRatioKey`, so the frame it is
 *   previewed in, the crop dialog, and the ratio it is stored at all come from
 *   `tokens/aspect-ratios.ts`. There is deliberately no `aspectRatio` number
 *   prop to pass a literal through.
 * - **Cropping is not optional.** The dialog is the only path from "file chosen"
 *   to "file uploaded", so an image cannot reach storage at the wrong shape.
 * - **Uploading is the caller's business.** `onUpload` receives the cropped file.
 *   Whether that yields a `fileId` or a URL is a storage decision that differs
 *   between the CMS (which stores block content by URL) and the club portal
 *   (which stores a row referencing a file id), and neither belongs here.
 *
 * ## Why the cropper is a dialog and not an inline panel
 *
 * An inline cropper replaces the preview frame with a full-height editing
 * surface, so everything below it jumps when the dialog is dismissed. Inside a
 * modal the surrounding form keeps its layout and its scroll position, which
 * matters most in the CMS where one page stacks twenty-two of these.
 */
const styles = stylex.create({
  root: {
    display: "grid",
    gap: space["2xs"],
    // Without this a long unbroken `file.name` sets the grid track width and
    // pushes the panel wider than the viewport.
    minWidth: 0,
  },
  rootWide: {
    gridColumn: {
      default: "auto",
      [bp.lg]: "1 / -1",
    },
  },
  label: {
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceMuted,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space["2xs"],
  },
  hint: {
    margin: 0,
    fontSize: font.size2xs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  hiddenInput: { display: "none" },
});

/**
 * Owns the lifetime of one object URL.
 *
 * Each `createObjectURL` pins the whole file in memory for the life of the
 * document, and a screen where an editor picks at images repeatedly accumulates
 * one per pick. Releasing at the moment a URL is superseded — rather than in an
 * unmount effect — means there is no window where a replaced preview is still
 * being held, and no chance of revoking one still on screen.
 */
const usePreviewUrl = () => {
  const held = useRef<string | null>(null);

  /*
   * Stable identities, so the unmount effect below has nothing to compare. The
   * functions only ever touch the ref, so they are correct to memoise on nothing.
   */
  const release = useCallback(() => {
    if (held.current) {
      URL.revokeObjectURL(held.current);
      held.current = null;
    }
  }, []);

  /**
   * Take ownership of a new URL, releasing whatever was held before.
   *
   * Returns the URL so a caller can store it and set the preview in one step —
   * `URL.createObjectURL` is called once, by the caller, and handed straight
   * through rather than created here and looked up again.
   */
  const take = useCallback((url: string): string => {
    if (held.current && held.current !== url) {
      URL.revokeObjectURL(held.current);
    }
    held.current = url;
    return url;
  }, []);

  useEffect(() => release, [release]);

  return { release, take };
};

/**
 * Clear an `<input type="file">` so re-picking the same file still fires change.
 *
 * The value has to be cleared as the event is handled, not afterwards: the input
 * keeps its selection until then, and a second pick of the identical file would
 * be a no-op.
 */
const clearInput = (event: ChangeEvent<HTMLInputElement>) => {
  event.target.value = "";
};

export interface FileUploaderProps {
  label: string;
  /** Crop shape. Required — see the note on the tokens above. */
  ratioKey: AspectRatioKey;
  /** Uploads the cropped file and resolves to whatever the caller stores. */
  onUpload: (file: File) => Promise<string>;
  onChange: (value: string | null) => void;
  /** What is currently stored, or `null` for an empty field. */
  value?: string | null;
  /** Where the stored image can be fetched for preview. */
  previewUrl?: string | null;
  /** Replaces the uploader's own hint when the caller has something to add. */
  hint?: string;
  /** Allow removing the stored image. */
  clearable?: boolean;
  /** Text shown under a cleared field, e.g. that it lands on approval. */
  clearedNote?: string;
  disabled?: boolean;
  wide?: boolean;
}

/**
 * A single image, cropped to a declared ratio before it is uploaded.
 *
 * `value` is treated as the authority on what is stored. A local object-URL
 * preview only stands in while nothing is stored: once the upload lands, the
 * frame follows the caller, so what an editor sees is what the site will show.
 */
export const FileUploader = ({
  clearable = false,
  clearedNote,
  disabled = false,
  hint,
  label,
  onChange,
  onUpload,
  previewUrl = null,
  ratioKey,
  value = null,
  wide = false,
}: FileUploaderProps) => {
  const spec = ratioSpec(ratioKey);
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = usePreviewUrl();

  const [cropRequest, setCropRequest] = useState<CropRequest | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  /*
   * A stored value always wins over the local preview, so no effect is needed to
   * reconcile the two: the moment `value` is non-empty the frame reads the
   * caller's URL and the object URL stops being shown. It is released explicitly
   * at the two points that supersede it, and on unmount by `usePreviewUrl` if
   * something else changed `value` from outside.
   */
  const shown = value ? previewUrl : localPreview;
  const busy = disabled || uploading;

  let chooseLabel = `Choose image — ${spec.name}`;
  if (uploading) {
    chooseLabel = "Uploading…";
  } else if (value) {
    chooseLabel = `Replace — ${spec.name}`;
  }

  const choose = (file: File | undefined) => {
    if (!file) {
      return;
    }
    const complaint = describeFileProblem(file);
    if (complaint) {
      setProblem(complaint);
      return;
    }
    setProblem(null);
    const url = preview.take(URL.createObjectURL(file));
    setLocalPreview(url);
    setCropRequest({ file, previewUrl: url });
  };

  const handleCropped = async (outcome: { file: File } | null) => {
    setCropRequest(null);
    if (!outcome) {
      // Backing out leaves the stored image alone; the frame returns to it.
      if (!value) {
        preview.release();
        setLocalPreview(null);
      }
      return;
    }

    setUploading(true);
    setProblem(null);
    try {
      onChange(await onUpload(outcome.file));
      // The stored image is now the thing to show. The object URL has done its
      // job — and the cropped file it pointed at is not byte-identical to what
      // the caller just stored, so keeping it on screen would misrepresent it.
      preview.release();
      setLocalPreview(null);
    } catch (error) {
      // The preview stays: it is the cropped file that just failed, and the
      // editor needs to see which photograph to try again with.
      setProblem(
        error instanceof Error
          ? error.message
          : "That image could not be uploaded."
      );
    }
    setUploading(false);
  };

  return (
    <div {...stylex.props(styles.root, wide && styles.rootWide)}>
      <span {...stylex.props(styles.label)}>{label}</span>

      <MediaFrame
        alt=""
        aspectRatio={spec.ratio}
        hint={`Choose an image — it will be cropped to ${spec.name}`}
        src={shown}
      />

      <input
        accept={ACCEPTED_IMAGE_ATTR}
        disabled={busy}
        onChange={(event) => {
          clearInput(event);
          choose(event.target.files?.[0]);
        }}
        ref={inputRef}
        type="file"
        {...stylex.props(styles.hiddenInput)}
      />

      <div {...stylex.props(styles.actions)}>
        <CmsButton
          disabled={busy}
          onClick={() => {
            inputRef.current?.click();
          }}
          tone="quiet"
        >
          {chooseLabel}
        </CmsButton>
        {clearable && value ? (
          <CmsButton
            disabled={busy}
            onClick={() => {
              preview.release();
              setLocalPreview(null);
              setProblem(null);
              onChange(null);
            }}
            tone="quiet"
          >
            Remove
          </CmsButton>
        ) : null}
      </div>

      <p {...stylex.props(styles.hint)}>
        {hint ?? `JPEG, PNG, WebP or AVIF, up to ${MAX_MB} MB. ${spec.label}.`}
      </p>

      {clearedNote ? <p {...stylex.props(styles.hint)}>{clearedNote}</p> : null}

      {problem ? <Notice tone="danger">{problem}</Notice> : null}

      {/*
        Mounted per file rather than kept open and closed, so a new pick always
        starts from a full-frame selection. Reusing one instance meant the
        previous photograph's crop was briefly live on the next one.
      */}
      {cropRequest ? (
        <ImageCropDialog
          key={cropRequest.previewUrl}
          onCropped={(outcome) => {
            void handleCropped(outcome);
          }}
          ratioKey={ratioKey}
          request={cropRequest}
        />
      ) : null}
    </div>
  );
};

/**
 * An image held by a batch, before or after it is uploaded.
 *
 * `previewUrl` is created and revoked by whichever uploader owns the list, so
 * there is exactly one owner of each URL's lifetime. Two owners is how it ends
 * up revoked while still on screen, or never revoked at all.
 */
export interface QueuedImage {
  file: File;
  previewUrl: string;
  /** `fileId` or URL, once the file has been uploaded. */
  stored?: string;
}

/** How many images one batch may hold. */
export const MAX_IMAGES_PER_BATCH = 5;

const batchStyles = stylex.create({
  grid: {
    display: "grid",
    /*
     * A grid of frames, not a list of filenames: the whole point of choosing a
     * photograph is seeing it, and a portrait offered as a 16:9 banner should
     * look wrong here rather than after approval.
     */
    gridTemplateColumns: "repeat(auto-fill, minmax(7rem, 1fr))",
    gap: space.md,
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  item: {
    display: "grid",
    gap: space["3xs"],
    minWidth: 0,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: space["2xs"],
    fontSize: font.size2xs,
    color: color.onSurfaceMuted,
  },
  name: {
    fontFamily: font.mono,
    color: color.onSurface,
    overflowWrap: "anywhere",
  },
  remove: {
    justifySelf: "start",
    margin: 0,
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
  cancelRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: space["2xs"],
  },
});

export interface FileBatchUploaderProps {
  label: string;
  ratioKey: AspectRatioKey;
  /** The images held so far. Owned by the caller so a submit can read them. */
  images: readonly QueuedImage[];
  onChange: (images: QueuedImage[]) => void;
  hint?: string;
  max?: number;
  disabled?: boolean;
  wide?: boolean;
}

/**
 * A batch of images, each cropped to the declared ratio before it is uploaded.
 *
 * The same dialog, tokens and encoding as `FileUploader`. The difference is that
 * it takes as many files as the screen has room for and hands them to the caller
 * un-uploaded: a batch is submitted alongside a caption and a role, and
 * uploading five photographs only for the form to be abandoned would leave five
 * orphans in storage.
 */
export const FileBatchUploader = ({
  disabled = false,
  hint,
  images,
  label,
  max = MAX_IMAGES_PER_BATCH,
  onChange,
  ratioKey,
  wide = false,
}: FileBatchUploaderProps) => {
  const spec = ratioSpec(ratioKey);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Files chosen but not yet cropped, and which one the dialog is showing. */
  const [queue, setQueue] = useState<QueuedImage[]>([]);
  const [cropIndex, setCropIndex] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);

  const room = max - images.length - queue.length;

  /**
   * Release a queue's preview URLs before it is discarded.
   *
   * Read from the ref rather than a `setState` callback: revoking is a side
   * effect, and a state updater must stay pure for React to be able to call it
   * twice in Strict Mode.
   */
  const queueRef = useRef<QueuedImage[]>([]);
  const dropQueue = () => {
    for (const image of queueRef.current) {
      URL.revokeObjectURL(image.previewUrl);
    }
    queueRef.current = [];
    setQueue([]);
  };

  const handleFiles = (files: FileList | null) => {
    const chosen = [...(files ?? [])];
    if (chosen.length === 0) {
      return;
    }
    if (chosen.length > room) {
      setProblem(
        `You picked ${chosen.length} images. Add ${room} at a time — come back for the rest.`
      );
      return;
    }

    const complaint = chosen
      .map((file) => describeFileProblem(file))
      .find((message) => message !== null);
    if (complaint) {
      setProblem(complaint);
      return;
    }

    setProblem(null);
    /*
     * The frame keeps showing the original while it is being cropped: the crop
     * is a region of what the editor can already see, and swapping in the
     * cropped render mid-dialog would make the selection appear to move.
     */
    const next = chosen.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    queueRef.current = next;
    setQueue(next);
    setCropIndex(0);
  };

  const handleCropped = (outcome: { file: File } | null) => {
    if (!outcome) {
      // Backing out abandons the whole un-cropped batch: the remaining files
      // were only ever going to be usable after this one.
      dropQueue();
      return;
    }

    const next = queueRef.current.map((image, position) =>
      position === cropIndex ? { ...image, file: outcome.file } : image
    );

    /*
     * The last crop in the batch hands the whole set over; anything earlier
     * stays in the queue and the dialog moves on to the next file. The advance
     * is functional because it must not depend on which index this closure
     * captured; `isLast` can read the captured value, since the dialog is modal
     * and only one crop resolves at a time.
     */
    const isLast = cropIndex + 1 >= next.length;

    if (isLast) {
      setQueue([]);
      setCropIndex(0);
      queueRef.current = [];
      onChange([...images, ...next]);
      return;
    }

    queueRef.current = next;
    setQueue(next);
    setCropIndex((index) => index + 1);
  };

  const removeAt = (index: number) => {
    const target = images[index];
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onChange(images.filter((_, position) => position !== index));
  };

  const cropping = queue[cropIndex] ?? null;

  return (
    <div {...stylex.props(styles.root, wide && styles.rootWide)}>
      <span {...stylex.props(styles.label)}>
        {room === 0
          ? `Batch full — ${max} of ${max}`
          : `${label} — ${images.length} of ${max}`}
      </span>

      <input
        accept={ACCEPTED_IMAGE_ATTR}
        disabled={disabled || room === 0}
        multiple
        onChange={(event) => {
          clearInput(event);
          handleFiles(event.target.files);
        }}
        ref={inputRef}
        type="file"
        {...stylex.props(styles.hiddenInput)}
      />

      <div {...stylex.props(styles.actions)}>
        <CmsButton
          disabled={disabled || room === 0}
          onClick={() => {
            inputRef.current?.click();
          }}
          tone="quiet"
        >
          {images.length === 0
            ? `Choose images — ${spec.name}`
            : `Add more — ${spec.name}`}
        </CmsButton>
        {room === 0 ? (
          <span {...stylex.props(styles.hint)}>
            Submit these to pick the next {max}. There is no limit on the total.
          </span>
        ) : null}
      </div>

      <p {...stylex.props(styles.hint)}>
        {hint ??
          `Up to ${max} at a time. Each is cropped to ${spec.name} before it is uploaded.`}
      </p>

      {problem ? <Notice tone="danger">{problem}</Notice> : null}

      {images.length > 0 ? (
        <ul {...stylex.props(batchStyles.grid)}>
          {images.map((image, index) => (
            <li key={image.previewUrl} {...stylex.props(batchStyles.item)}>
              <MediaFrame
                alt={image.file.name}
                aspectRatio={spec.ratio}
                src={image.previewUrl}
              />
              <span {...stylex.props(batchStyles.meta)}>
                <span {...stylex.props(batchStyles.name)}>
                  {image.file.name}
                </span>
                <span aria-hidden="true">·</span>
                <span>{Math.round(image.file.size / 1024)} KB</span>
              </span>
              <button
                onClick={() => {
                  removeAt(index);
                }}
                type="button"
                {...stylex.props(batchStyles.remove)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {cropping ? (
        <Notice tone="info">
          <span {...stylex.props(batchStyles.cancelRow)}>
            <span>
              Cropping {cropIndex + 1} of {queue.length}.
            </span>
            <button
              onClick={dropQueue}
              type="button"
              {...stylex.props(batchStyles.remove)}
            >
              Cancel these
            </button>
          </span>
        </Notice>
      ) : null}

      {cropping ? (
        <ImageCropDialog
          key={cropping.previewUrl}
          onCropped={handleCropped}
          ratioKey={ratioKey}
          request={cropping}
        />
      ) : null}
    </div>
  );
};

const modeStyles = stylex.create({
  bar: {
    display: "inline-flex",
    gap: 0,
    margin: 0,
    padding: 0,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: color.surface,
  },
  option: {
    minHeight: "2rem",
    paddingBlock: space["2xs"],
    paddingInline: space.sm,
    borderWidth: 0,
    borderInlineEndWidth: space.px,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: color.borderStrong,
    backgroundColor: "transparent",
    color: color.onSurfaceMuted,
    fontFamily: font.body,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    textTransform: "capitalize",
    cursor: "pointer",
    ":hover": { backgroundColor: "rgba(1, 52, 5, 0.04)" },
  },
  optionActive: {
    backgroundColor: color.accent,
    color: color.onAccent,
  },
});

/**
 * A video, or a brand colour, in place of a photograph.
 *
 * The hero on five CMS pages is not always a photograph. Keeping this beside the
 * uploader rather than inside it is what lets the uploader assume that every
 * file it is handed can be cropped — the only file type it accepts is an image.
 */
export const MediaModeSwitch = ({
  label,
  onSelect,
  value,
}: {
  label: string;
  value: "image" | "video" | "color";
  onSelect: (mode: "image" | "video" | "color") => void;
}) => (
  <fieldset aria-label={label} {...stylex.props(modeStyles.bar)}>
    {(["image", "video", "color"] as const).map((option) => (
      <button
        aria-pressed={value === option}
        key={option}
        onClick={() => {
          onSelect(option);
        }}
        type="button"
        {...stylex.props(
          modeStyles.option,
          value === option && modeStyles.optionActive
        )}
      >
        {option}
      </button>
    ))}
  </fieldset>
);
