import * as stylex from "@stylexjs/stylex";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

import "react-image-crop/dist/ReactCrop.css";
import { centerCrop, makeAspectCrop, ReactCrop } from "react-image-crop";
import type { PercentCrop } from "react-image-crop";

import type { BlockField } from "../../content/cms";
import { aspectRatios } from "../../tokens/aspect-ratios";
import { bp } from "../../tokens/breakpoints.stylex";
import {
  palette,
  color,
  font,
  motionToken,
  space,
} from "../../tokens/tokens.stylex";
import { CmsButton } from "./cms-primitives";

type MediaMode = "image" | "video" | "color";

const IMAGE_PREFIX = "image:";
const VIDEO_PREFIX = "video:";
const COLOR_PREFIX = "color:";

// The hero always renders a fixed dark scrim plus cream text over this fill,
// so only shades of the brand green stay legible and on-brand -
// anything lighter (cream, gold) turns into a muddy off-brand tint under the
// scrim, and anything else (black, crimson) reads as an unrelated colour.
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

  /* --- mode segmented control --- */
  modeBar: {
    display: "inline-flex",
    gap: 0,
    margin: 0,
    padding: 0,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: "0.375rem",
    overflow: "hidden",
    backgroundColor: color.surface,
  },
  mode: {
    minHeight: "2rem",
    paddingBlock: space["2xs"],
    paddingInline: space.sm,
    borderWidth: 0,
    borderInlineEndWidth: space.px,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: color.borderStrong,
    borderStyle: "solid",
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(1, 52, 5, 0.04)",
    },
    color: color.onSurfaceMuted,
    fontFamily: font.body,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    cursor: "pointer",
    transitionProperty: "background-color, color",
    transitionDuration: motionToken.fast,
    transitionTimingFunction: motionToken.ease,
  },
  modeActive: {
    backgroundColor: color.accent,
    color: color.onAccent,
  },

  /* --- preview area (display only) --- */
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

  /* --- crop --- */
  cropWrap: {
    width: "100%",
    maxHeight: "28rem",
    overflow: "auto",
    backgroundColor: palette.black,
  },
  cropImage: {
    maxWidth: "100%",
    display: "block",
  },
  cropBar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space["2xs"],
    paddingBlockStart: space["2xs"],
  },

  /* --- color --- */
  colorPreview: {
    width: "100%",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
  },
  colorRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
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
    transitionProperty: "border-color, transform",
    transitionDuration: motionToken.fast,
    transitionTimingFunction: motionToken.ease,
    transform: {
      default: "scale(1)",
      ":hover": "scale(1.1)",
    },
  },
  colorSwatchActive: {
    borderColor: color.onSurface,
    transform: "scale(1.1)",
  },

  /* --- shared --- */
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
  },
  fileInput: {
    display: "none",
  },
  hint: {
    margin: 0,
    fontSize: font.size2xs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  error: {
    margin: 0,
    color: color.danger,
    fontSize: font.size2xs,
  },
});

const defaultCrop: PercentCrop = {
  unit: "%",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

// oxlint-disable react/todo promise/avoid-new -- canvas.toBlob is callback-based, Promise wrapper required
const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });

// oxlint-disable react-doctor/no-giant-component eslint/complexity -- splitting would fragment tightly-coupled crop/upload/color logic
export const MediaField = ({
  aspectRatio = aspectRatios.hero,
  defaultImage,
  field,
  onChange,
  onUpload,
  value,
  variant = "image",
  wide,
}: {
  aspectRatio?: number;
  /** Fallback image URL shown when no value is set. */
  defaultImage?: string;
  field: BlockField;
  onChange: (value: string) => void;
  onUpload?: (file: File) => Promise<string>;
  value?: string;
  variant?: "image" | "hero";
  wide?: boolean;
}) => {
  const initialMode = variant === "hero" ? getHeroMode(value) : "image";
  const [mode, setMode] = useState<MediaMode>(initialMode);
  const [crop, setCrop] = useState<PercentCrop>(defaultCrop);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>();
  const imageRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sourceValue = getHeroValue(value);
  const isHero = variant === "hero";
  const currentMode = mode;

  const handleMode = (nextMode: MediaMode) => {
    setMode(nextMode);
    setIsCropping(false);
    setError(undefined);
    if (
      nextMode === "image" &&
      sourceValue &&
      !sourceValue.startsWith("data:")
    ) {
      setPreviewUrl(sourceValue);
    }
  };

  const handleImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCrop(defaultCrop);
    setIsCropping(true);
    setError(undefined);
    event.target.value = "";
  };

  const handleImageLoad = () => {
    const image = imageRef.current;
    if (!image || !aspectRatio) {
      return;
    }
    setCrop(
      makeAspectCrop(
        { unit: "%", width: 80 },
        aspectRatio,
        image.naturalWidth,
        image.naturalHeight
      )
    );
  };

  const handleUseCrop = async () => {
    const image = imageRef.current;
    if (!image) {
      return;
    }
    if (!onUpload) {
      setError("Media upload is not available.");
      return;
    }
    setIsUploading(true);
    setError(undefined);
    try {
      const pixelCrop = centerCrop(
        crop,
        image.naturalWidth,
        image.naturalHeight
      );
      if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
        setError("Choose a crop with visible dimensions.");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const context = canvas.getContext("2d");
      if (!context) {
        setError("The browser could not prepare the image crop.");
        return;
      }
      context.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      const blob = await canvasToBlob(canvas);
      if (!blob) {
        setError("The cropped image could not be created.");
        return;
      }
      const file = new File([blob], "homepage-crop.jpg", {
        type: "image/jpeg",
      });
      const url = await onUpload(file);
      onChange(isHero ? `${IMAGE_PREFIX}${url}` : url);
      setPreviewUrl(url);
      setIsCropping(false);
    } catch (cropError) {
      setError(
        cropError instanceof Error ? cropError.message : "Upload failed."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("video/")) {
      setError("Choose a video file.");
      return;
    }
    if (!onUpload) {
      setError("Media upload is not available.");
      return;
    }
    setIsUploading(true);
    setError(undefined);
    try {
      const url = await onUpload(file);
      onChange(`${VIDEO_PREFIX}${url}`);
      setPreviewUrl(url);
    } catch (videoError) {
      setError(
        videoError instanceof Error ? videoError.message : "Upload failed."
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleColor = (nextColor: string) => {
    onChange(`${COLOR_PREFIX}${nextColor}`);
    setError(undefined);
  };

  const handleRemove = () => {
    onChange("");
    setPreviewUrl(undefined);
    setIsCropping(false);
    setError(undefined);
  };

  const openFilePicker = () => fileRef.current?.click();

  const renderImagePreview = () => {
    if (sourceValue) {
      return (
        <img
          alt=""
          loading="lazy"
          src={sourceValue}
          {...stylex.props(styles.previewImage)}
        />
      );
    }
    if (defaultImage) {
      return (
        <img
          alt="Default"
          loading="lazy"
          src={defaultImage}
          {...stylex.props(styles.previewImage)}
        />
      );
    }
    return (
      <p {...stylex.props(styles.previewHint)}>
        {isUploading ? "Uploading…" : "No image selected"}
      </p>
    );
  };

  return (
    <div {...stylex.props(styles.root, wide && styles.rootWide)}>
      <span {...stylex.props(styles.label)}>{field.label}</span>

      {isHero ? (
        <fieldset
          aria-label={`${field.label} type`}
          {...stylex.props(styles.modeBar)}
        >
          {(["image", "video", "color"] as MediaMode[]).map((option) => (
            <button
              aria-pressed={currentMode === option}
              key={option}
              onClick={() => handleMode(option)}
              type="button"
              {...stylex.props(
                styles.mode,
                currentMode === option && styles.modeActive
              )}
            >
              {option[0]?.toUpperCase()}
              {option.slice(1)}
            </button>
          ))}
        </fieldset>
      ) : null}

      {currentMode === "color" ? (
        <>
          <div
            style={{
              aspectRatio,
              backgroundColor: sourceValue || palette.greenDeep,
            }}
            {...stylex.props(styles.colorPreview)}
          />
          <div {...stylex.props(styles.colorRow)}>
            {COLOR_CHOICES.map((choice) => (
              <button
                aria-label={`Use ${choice}`}
                aria-pressed={sourceValue === choice}
                key={choice}
                onClick={() => handleColor(choice)}
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
      ) : null}

      {currentMode === "video" ? (
        <div style={{ aspectRatio }} {...stylex.props(styles.preview)}>
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
              {isUploading ? "Uploading…" : "No video selected"}
            </p>
          )}
        </div>
      ) : null}

      {currentMode === "image" && isCropping ? (
        <>
          <div {...stylex.props(styles.cropWrap)}>
            <ReactCrop
              aspect={aspectRatio}
              crop={crop}
              onChange={(_pixelCrop, percentageCrop) => setCrop(percentageCrop)}
              onComplete={(_pixelCrop, percentageCrop) =>
                setCrop(percentageCrop)
              }
            >
              <img
                alt=""
                onLoad={handleImageLoad}
                ref={imageRef}
                src={previewUrl ?? sourceValue}
                {...stylex.props(styles.cropImage)}
              />
            </ReactCrop>
          </div>
          <div {...stylex.props(styles.cropBar)}>
            <CmsButton
              disabled={isUploading}
              onClick={handleUseCrop}
              tone="primary"
            >
              {isUploading ? "Uploading…" : "Use cropped image"}
            </CmsButton>
            <CmsButton
              disabled={isUploading}
              onClick={() => {
                setIsCropping(false);
                setPreviewUrl(undefined);
              }}
              tone="quiet"
            >
              Cancel
            </CmsButton>
          </div>
        </>
      ) : null}

      {currentMode === "image" && !isCropping ? (
        <div style={{ aspectRatio }} {...stylex.props(styles.preview)}>
          {renderImagePreview()}
        </div>
      ) : null}

      {currentMode !== "color" && (
        <div {...stylex.props(styles.actions)}>
          <input
            accept={currentMode === "video" ? "video/*" : "image/*"}
            onChange={
              currentMode === "video" ? handleVideoFile : handleImageFile
            }
            ref={fileRef}
            type="file"
            {...stylex.props(styles.fileInput)}
          />
          <CmsButton
            disabled={isUploading}
            onClick={openFilePicker}
            tone="quiet"
          >
            {sourceValue
              ? `Replace ${currentMode === "video" ? "video" : "image"}`
              : `Choose ${currentMode === "video" ? "video" : "image"}`}
          </CmsButton>
          {sourceValue && !isCropping ? (
            <CmsButton
              disabled={isUploading}
              onClick={handleRemove}
              tone="quiet"
            >
              Remove
            </CmsButton>
          ) : null}
        </div>
      )}

      {field.hint ? <p {...stylex.props(styles.hint)}>{field.hint}</p> : null}
      {error ? <p {...stylex.props(styles.error)}>{error}</p> : null}
    </div>
  );
};
