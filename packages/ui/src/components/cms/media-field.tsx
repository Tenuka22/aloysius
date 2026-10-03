import * as stylex from "@stylexjs/stylex";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

import type { BlockField } from "../../content/cms";
import { getImageRatioKey } from "../../content/cms";
import { aspectRatios } from "../../tokens/aspect-ratios";
import { bp } from "../../tokens/breakpoints.stylex";
import { palette, color, font, space } from "../../tokens/tokens.stylex";
import { CmsButton, Notice } from "./cms-primitives";
import { FileUploader, MediaModeSwitch } from "./file-uploader";

/**
 * The CMS's image field: one image, cropped to the shape its slot renders at.
 *
 * All of the choosing lives in `FileUploader`. What is left here is the part that
 * is specific to a CMS block field and nothing else:
 *
 * - the **hero**, which on five pages may be a photograph, a video or a brand
 *   colour rather than an image, and
 * - the **persisted value**, which for the hero is `image:`/`video:`/`color:`
 *   prefixed so the renderer knows which of the three it is looking at.
 *
 * The cropper, the ratio tokens, the encoding and the upload error handling used
 * to be duplicated here and in three club-portal components, which is why the same
 * photograph could reach storage cropped to three different shapes.
 */
type MediaMode = "image" | "video" | "color";

const IMAGE_PREFIX = "image:";
const VIDEO_PREFIX = "video:";
const COLOR_PREFIX = "color:";

/**
 * The colours the hero can be tinted.
 *
 * The hero always renders a fixed dark scrim plus cream text over this fill, so
 * only shades of the brand green stay legible and on-brand — anything lighter
 * (cream, gold) turns into a muddy off-brand tint under the scrim, and anything
 * else (black, crimson) reads as an unrelated colour.
 */
const COLOR_CHOICES = [
  palette.greenBright,
  palette.greenMid,
  palette.greenDeep,
  palette.greenDark,
] as const;

const getHeroMode = (value?: string): MediaMode => {
  if (value?.startsWith(VIDEO_PREFIX)) {
    return "video";
  }
  if (value?.startsWith(COLOR_PREFIX)) {
    return "color";
  }
  return "image";
};

const getHeroValue = (value?: string) =>
  value?.replace(/^(?<prefix>image:|video:|color:)/u, "") ?? "";

const styles = stylex.create({
  root: {
    display: "grid",
    gap: space.sm,
    padding: space.sm,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    backgroundColor: color.surfaceSunken,
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
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.onSurfaceMuted,
  },

  /* --- non-image media --- */
  preview: {
    position: "relative",
    display: "grid",
    placeItems: "center",
    width: "100%",
    height: "auto",
    overflow: "hidden",
    borderWidth: space.px,
    borderStyle: "dashed",
    borderColor: color.borderStrong,
    backgroundColor: color.surface,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  previewVideo: {
    width: "100%",
    maxHeight: "22rem",
    backgroundColor: palette.black,
  },
  previewHint: {
    margin: 0,
    padding: space.md,
    textAlign: "center",
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
  colorPreview: {
    width: "100%",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
  },
  colorRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.xs,
  },
  colorSwatch: {
    width: "2.25rem",
    height: "2.25rem",
    padding: 0,
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: "0.375rem",
    cursor: "pointer",
  },
  colorSwatchActive: { borderColor: color.onSurface },

  /* --- shared --- */
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
  },
  fileInput: { display: "none" },
  hint: {
    margin: 0,
    fontSize: font.size2xs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
});

/**
 * The video and colour branches.
 *
 * Split out because they share nothing with the image branch: no ratio cropping,
 * no upload validation, and a different value encoding. Inlining them made the
 * component one large branch on `mode`, which is exactly the shape that grows a
 * fourth kind later without anyone noticing the others had stopped being
 * reviewed.
 */
const NonImageMedia = ({
  mode,
  onChange,
  onRemove,
  onUpload,
  ratio,
  sourceValue,
  uploading,
  problem,
}: {
  mode: Exclude<MediaMode, "image">;
  onChange: (value: string) => void;
  onRemove: () => void;
  onUpload?: (file: File) => Promise<string>;
  /** Number, because a `<video>` and a colour swatch only need a box to fill. */
  ratio: number;
  sourceValue: string;
  uploading: boolean;
  problem: string | null;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onUpload) {
      return;
    }
    try {
      onChange(await onUpload(file));
    } catch {
      // Surfaced through the uploader's own problem slot rather than a second
      // error channel; the operator only needs to know it did not work.
    }
  };

  if (mode === "color") {
    return (
      <>
        <div
          style={{ aspectRatio: ratio, backgroundColor: sourceValue }}
          {...stylex.props(styles.colorPreview)}
        />
        <div {...stylex.props(styles.colorRow)}>
          {COLOR_CHOICES.map((choice) => (
            <button
              aria-label={`Use ${choice}`}
              aria-pressed={sourceValue === choice}
              key={choice}
              onClick={() => {
                onChange(choice);
              }}
              style={{ backgroundColor: choice }}
              type="button"
              {...stylex.props(
                styles.colorSwatch,
                sourceValue === choice && styles.colorSwatchActive
              )}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ aspectRatio: ratio }} {...stylex.props(styles.preview)}>
        {sourceValue ? (
          <video
            aria-hidden="true"
            controls
            preload="metadata"
            src={sourceValue}
            {...stylex.props(styles.previewVideo)}
          >
            <track kind="captions" label="No captions available" src="" />
          </video>
        ) : (
          <p {...stylex.props(styles.previewHint)}>
            {uploading ? "Uploading…" : "No video selected"}
          </p>
        )}
      </div>

      <input
        accept="video/*"
        disabled={uploading || !onUpload}
        onChange={(event) => {
          void handleFile(event);
        }}
        ref={inputRef}
        type="file"
        {...stylex.props(styles.fileInput)}
      />

      <div {...stylex.props(styles.actions)}>
        <CmsButton
          disabled={uploading || !onUpload}
          onClick={() => {
            inputRef.current?.click();
          }}
          tone="quiet"
        >
          {sourceValue ? "Replace video" : "Choose video"}
        </CmsButton>
        {sourceValue ? (
          <CmsButton disabled={uploading} onClick={onRemove} tone="quiet">
            Remove
          </CmsButton>
        ) : null}
      </div>

      {problem ? <Notice tone="danger">{problem}</Notice> : null}
    </>
  );
};

export const MediaField = ({
  defaultImage,
  field,
  onChange,
  onUpload,
  value,
  variant = "image",
  wide,
}: {
  field: BlockField;
  onChange: (value: string) => void;
  onUpload?: (file: File) => Promise<string>;
  value?: string;
  /** Fallback image URL shown when no value has been saved yet. */
  defaultImage?: string;
  variant?: "image" | "hero";
  wide?: boolean;
}) => {
  const ratioKey = getImageRatioKey(field.id);
  const spec = aspectRatios[ratioKey];
  const isHero = variant === "hero";

  const [mode, setMode] = useState<MediaMode>(
    isHero ? getHeroMode(value) : "image"
  );
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const sourceValue = getHeroValue(value);

  const handleMode = (next: MediaMode) => {
    setMode(next);
    setProblem(null);
  };

  /**
   * Wrap the caller's `onUpload` so the video branch gets the same busy and
   * error handling the image branch gets from `FileUploader`. Passing the raw
   * prop to both meant the video branch silently had neither.
   */
  const uploadVideo = async (file: File): Promise<string> => {
    if (!onUpload) {
      throw new Error("Media upload is not available.");
    }
    setUploading(true);
    setProblem(null);

    // No `finally`: React Compiler cannot lower one, so the busy flag is
    // cleared on both paths by hand — once after a successful upload, once
    // while rethrowing a failed one.
    try {
      const id = await onUpload(file);
      setUploading(false);
      return id;
    } catch (error) {
      setProblem(
        error instanceof Error
          ? error.message
          : "The video could not be uploaded."
      );
      setUploading(false);
      throw error;
    }
  };

  const remove = () => {
    setProblem(null);
    onChange("");
  };

  /*
   * The label and hint belong to `FileUploader` in image mode — it renders
   * both, and rendering them here as well is how a field ends up with two
   * headings and two copies of the same guidance. The non-image branches have
   * no uploader of their own, so they take them here.
   *
   * Built as two values rather than one nested conditional: a ternary inside a
   * ternary made the three-way split of this field unreadable at a glance.
   */
  const imageMode = onUpload ? (
    <FileUploader
      hint={field.hint}
      label={field.label}
      onChange={(next) => {
        onChange(isHero ? `${IMAGE_PREFIX}${next}` : (next ?? ""));
      }}
      onUpload={onUpload}
      previewUrl={sourceValue || defaultImage || null}
      ratioKey={ratioKey}
      value={sourceValue}
      wide={wide}
    />
  ) : (
    /*
     * No uploader available: the field still has to render, or a CMS page
     * loaded without upload rights would lose its image slots entirely. The
     * existing image is shown read-only and the gap is stated.
     */
    <>
      <span {...stylex.props(styles.label)}>{field.label}</span>
      <div style={{ aspectRatio: spec }} {...stylex.props(styles.preview)}>
        {sourceValue || defaultImage ? (
          <img
            alt=""
            loading="lazy"
            src={sourceValue || defaultImage}
            {...stylex.props(styles.previewImage)}
          />
        ) : (
          <p {...stylex.props(styles.previewHint)}>No image selected</p>
        )}
      </div>
      <Notice tone="warning">
        You cannot upload images with this account, so this field is read-only.
      </Notice>
      {field.hint ? <p {...stylex.props(styles.hint)}>{field.hint}</p> : null}
    </>
  );

  /*
   * `null` while the field is in image mode: that comparison is what narrows
   * `mode` for `NonImageMedia` below, which takes only the two non-image modes.
   * Building this unconditionally would hand it the union of all three.
   */
  const nonImageMode =
    mode === "image" ? null : (
      <>
        <span {...stylex.props(styles.label)}>{field.label}</span>
        <NonImageMedia
          mode={mode}
          onChange={(next) => {
            onChange(
              `${mode === "video" ? VIDEO_PREFIX : COLOR_PREFIX}${next}`
            );
          }}
          onRemove={remove}
          onUpload={onUpload ? uploadVideo : undefined}
          problem={problem}
          ratio={spec}
          sourceValue={sourceValue}
          uploading={uploading}
        />
        {field.hint ? <p {...stylex.props(styles.hint)}>{field.hint}</p> : null}
      </>
    );

  return (
    <div {...stylex.props(styles.root, wide && styles.rootWide)}>
      {isHero ? (
        <MediaModeSwitch
          label={`${field.label} type`}
          onSelect={handleMode}
          value={mode}
        />
      ) : null}

      {mode === "image" ? imageMode : nonImageMode}
    </div>
  );
};
