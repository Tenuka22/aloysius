"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { Button } from "@aloysius-web/ui/components/button";

async function cropImage(file: File, crop: PixelCrop): Promise<File> {
  const image = new Image();
  const imageUrl = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageUrl;
  });

  const cropIsPercent = crop.unit === "%";
  const x = cropIsPercent ? (crop.x / 100) * image.naturalWidth : crop.x;
  const y = cropIsPercent ? (crop.y / 100) * image.naturalHeight : crop.y;
  const width = cropIsPercent ? (crop.width / 100) * image.naturalWidth : crop.width;
  const height = cropIsPercent ? (crop.height / 100) * image.naturalHeight : crop.height;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(imageUrl);
    throw new Error("Canvas not available");
  }

  ctx.drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
  );

  URL.revokeObjectURL(imageUrl);

  if (!blob) throw new Error("Failed to crop image");

  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
    type: "image/jpeg",
  });
}

export function ImageCropDialog({
  open,
  onOpenChange,
  file,
  onCropComplete,
  aspect = 16 / 9,
  title = "Crop Image",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onCropComplete: (file: File) => void;
  aspect?: number;
  title?: string;
}) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageUrl, setImageUrl] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (open && file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setCrop(undefined);
      setCompletedCrop(undefined);
      return () => {
        URL.revokeObjectURL(url);
        setImageUrl("");
      };
    }
    if (!open) {
      setImageUrl("");
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [open, file]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const c = centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
        width,
        height,
      );
      setCrop(c);
    },
    [aspect],
  );

  const handleApply = useCallback(async () => {
    if (!file || !completedCrop) return;
    const cropped = await cropImage(file, completedCrop);
    onCropComplete(cropped);
    onOpenChange(false);
  }, [file, completedCrop, onCropComplete, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(90vw,900px)] sm:w-[min(90vw,900px)]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {imageUrl && (
          <div className="max-h-[70vh] overflow-auto rounded-md border p-2">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(_, pixelCrop) => setCompletedCrop(pixelCrop)}
              aspect={aspect}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-h-[70vh] w-full object-contain"
              />
            </ReactCrop>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApply} disabled={!completedCrop}>
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
