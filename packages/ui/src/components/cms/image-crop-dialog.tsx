import * as stylex from "@stylexjs/stylex";
import { Crop, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { centerCrop, makeAspectCrop, ReactCrop } from "react-image-crop";
import type { PercentCrop } from "react-image-crop";

import { cropToFile } from "../../lib/image-crop";
import { ratioSpec } from "../../tokens/aspect-ratios";
import type { AspectRatioKey } from "../../tokens/aspect-ratios";
import { color, font, radius, shadow, space } from "../../tokens/tokens.stylex";
import { CmsButton, Notice } from "./cms-primitives";

/** What `ImageCropDialog` hands back: the cropped file, or nothing on cancel. */
export interface CropOutcome {
  file: File;
}

const FULL_CROP: PercentCrop = {
  unit: "%",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

const styles = stylex.create({
  dialog: {
    width: "min(46rem, calc(100vw - 2rem))",
    maxWidth: "none",
    maxHeight: "calc(100vh - 2rem)",
    padding: 0,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: color.surfaceRaised,
    color: color.onSurface,
    boxShadow: shadow.lg,
    overflow: "hidden",
    "::backdrop": {
      backgroundColor: color.surfaceOverlay,
    },
  },
  head: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space.xs,
    padding: space.sm,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
  },
  close: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.25rem",
    height: "2.25rem",
    padding: 0,
    borderWidth: 0,
    borderRadius: radius.circle,
    backgroundColor: "transparent",
    color: color.onSurfaceMuted,
    cursor: "pointer",
    ":hover": { backgroundColor: color.placeholder },
  },
  body: {
    display: "grid",
    gap: space.sm,
    padding: space.sm,
  },
  /* The dark surround is the cropper's own backdrop, not decoration: a
     photograph's edges have to be unambiguous against something, and cream is
     too close to a sepia print to judge a crop against. */
  stage: {
    display: "grid",
    placeItems: "center",
    maxHeight: "60vh",
    padding: space["2xs"],
    overflow: "auto",
    backgroundColor: "#000000",
  },
  image: {
    display: "block",
    maxWidth: "100%",
    maxHeight: "56vh",
  },
  bar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space["2xs"],
  },
  spec: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space["2xs"],
    margin: 0,
    marginInlineStart: "auto",
    fontSize: font.size2xs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
  specIcon: { width: "0.9rem", height: "0.9rem" },
  warning: { margin: 0 },
});

/**
 * The file being cropped, plus the URL its preview reads from.
 *
 * Both in one object because the dialog is mounted *per file* — a new pick is a
 * new component instance, so the crop starts from a clean full selection without
 * an effect resetting five pieces of state and leaving a frame where the previous
 * photograph's crop is briefly on screen.
 */
export interface CropRequest {
  file: File;
  previewUrl: string;
}

/**
 * The crop step, as a modal dialog over the form it belongs to.
 *
 * A cropper is not a nicety here, it is the mechanism that makes the token
 * ratios enforceable. `aspectRatios.hero` is 16:9; an editor who uploads a
 * portrait phone snap and does not crop it produces a hero that is letterboxed,
 * blurred or centre-cut at render time by `object-fit: cover` — silently, and
 * usually cutting the face off. Cropping at upload turns that into a visible
 * decision made once, by the person who knows what the photograph is of.
 *
 * Mounted only while there is something to crop, and always `open` by the time
 * it is: there is no "dialog is open" state separate from the file, because the
 * two cannot usefully disagree.
 *
 * ## Why the ratio is a key, not a number
 *
 * `ratioKey` is required, and there is no `aspectRatio` escape hatch. A number
 * prop would let each call site invent its own ratio, which is exactly how the
 * codebase ended up with three different numbers for one idea. Taking a key off
 * `tokens/aspect-ratios.ts` means the crop shape, the name shown in the dialog
 * and the minimum-width warning all come from the one declaration.
 *
 * ## Why `<dialog>`
 *
 * Native `showModal()`, for the reasons given in `site-header.tsx`: focus
 * containment, Escape to close, the top layer, and `inert` background content for
 * free. A cropper is the last thing in a form an operator should be able to Tab
 * out of and lose their selection in.
 */
export const ImageCropDialog = ({
  onCropped,
  request,
  ratioKey,
}: {
  /** The file being cropped. The dialog is open for exactly as long as this. */
  request: CropRequest;
  /** Crop shape, from `tokens/aspect-ratios.ts`. */
  ratioKey: AspectRatioKey;
  /** Receives the cropped file, or `null` when the editor backs out. */
  onCropped: (outcome: CropOutcome | null) => void;
}) => {
  const spec = ratioSpec(ratioKey);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const headingId = useId();

  const [crop, setCrop] = useState<PercentCrop>(FULL_CROP);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [sourceWidth, setSourceWidth] = useState<number | null>(null);
  const [sourceHeight, setSourceHeight] = useState<number | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  /**
   * Seed the selection once the image's real dimensions are known.
   *
   * `80%` rather than `100%`: a full-bleed selection is one nudge away from
   * clipping the subject, and the editor can always drag outwards. The cropper's
   * own `aspect` prop then constrains the selection to the token ratio, so the
   * shape on screen is the shape that gets stored.
   */
  const handleLoad = () => {
    const image = imageRef.current;
    if (!image) {
      return;
    }
    setSourceWidth(image.naturalWidth);
    setSourceHeight(image.naturalHeight);
    setCrop(
      makeAspectCrop(
        { unit: "%", width: 80 },
        spec.ratio,
        image.naturalWidth,
        image.naturalHeight
      )
    );
  };

  const handleConfirm = async () => {
    const file = request?.file;
    const image = imageRef.current;
    if (!file || !image) {
      return;
    }

    setBusy(true);
    setProblem(null);
    try {
      // `centerCrop` converts the percentage selection to whole pixels at the
      // source's natural size; `cropToFile` then resolves it against the token
      // ratio and re-encodes. Passing percentages straight through would mean
      // the pixel maths runs against a size the cropper never measured.
      const pixel = centerCrop(crop, image.naturalWidth, image.naturalHeight);
      const cropped = await cropToFile({
        aspectRatio: spec.ratio,
        crop,
        file,
        naturalSize: {
          width: pixel.width || image.naturalWidth,
          height: pixel.height || image.naturalHeight,
        },
      });
      onCropped({ file: cropped });
    } catch (error) {
      setProblem(
        error instanceof Error
          ? error.message
          : "That image could not be cropped."
      );
    }
    setBusy(false);
  };

  const tooNarrow =
    sourceWidth !== null && sourceWidth > 0 && sourceWidth < spec.minWidth;

  return (
    <dialog
      aria-labelledby={headingId}
      onCancel={(event) => {
        // Escape fires `cancel`; take it over so the parent's `request` is
        // cleared and the dialog actually closes.
        event.preventDefault();
        onCropped(null);
      }}
      ref={dialogRef}
      {...stylex.props(styles.dialog)}
    >
      <div {...stylex.props(styles.head)}>
        <h2 id={headingId} {...stylex.props(styles.title)}>
          Crop this image
        </h2>
        <button
          aria-label="Cancel cropping"
          onClick={() => {
            onCropped(null);
          }}
          type="button"
          {...stylex.props(styles.close)}
        >
          <X aria-hidden="true" width={18} height={18} />
        </button>
      </div>

      <div {...stylex.props(styles.body)}>
        <div {...stylex.props(styles.stage)}>
          <ReactCrop
            aspect={spec.ratio}
            crop={crop}
            onChange={(_pixels, percent) => {
              setCrop(percent);
            }}
            onComplete={(_pixels, percent) => {
              setCrop(percent);
            }}
          >
            <img
              alt=""
              onLoad={handleLoad}
              ref={imageRef}
              src={request.previewUrl}
              {...stylex.props(styles.image)}
            />
          </ReactCrop>
        </div>

        {tooNarrow ? (
          <Notice tone="warning">
            {request.file.name} is {sourceWidth}px wide. {spec.label} is usually
            composed at {spec.minWidth}px or more, so this will look soft on a
            large screen. You can still use it.
          </Notice>
        ) : null}

        {problem ? <Notice tone="danger">{problem}</Notice> : null}

        <div {...stylex.props(styles.bar)}>
          <CmsButton
            disabled={busy}
            onClick={() => {
              void handleConfirm();
            }}
            tone="primary"
          >
            {busy ? "Cropping…" : "Use this crop"}
          </CmsButton>
          <CmsButton
            disabled={busy}
            onClick={() => {
              onCropped(null);
            }}
            tone="quiet"
          >
            Choose a different file
          </CmsButton>
          <p {...stylex.props(styles.spec)}>
            <Crop aria-hidden="true" {...stylex.props(styles.specIcon)} />
            <span>{spec.name}</span>
            <span aria-hidden="true">·</span>
            <span>
              {sourceWidth ?? "—"}
              {sourceHeight === null ? "" : `×${sourceHeight}`} px
            </span>
          </p>
        </div>
      </div>
    </dialog>
  );
};
