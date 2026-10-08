import {
  CmsButton,
  Field,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import type { PillTone } from "@aloysius/ui/components/cms/cms-primitives";
import type { QueuedImage } from "@aloysius/ui/components/cms/file-uploader";
import {
  FileBatchUploader,
  MAX_IMAGES_PER_BATCH,
} from "@aloysius/ui/components/cms/file-uploader";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import { FormDialog } from "@aloysius/ui/components/dialog";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { resolveFileUrls, uploadImageFile } from "@/components/club/upload";
import { client, orpc } from "@/utils/orpc";

const CLUB = "photography" as const;

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved — live in the gallery",
  rejected: "Rejected",
};

const STATUS_TONE: Record<string, PillTone> = {
  pending: "warning",
  approved: "positive",
  rejected: "danger",
};

interface ImageMeta {
  caption: string;
  altText: string;
}

const NO_META: ImageMeta = { caption: "", altText: "" };

const AddPhotosDialog = ({
  onClose,
  onSubmitted,
  open,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) => {
  const [images, setImages] = useState<QueuedImage[]>([]);
  const [meta, setMeta] = useState<ImageMeta[]>([]);
  const [albumUrl, setAlbumUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setImages([]);
    setMeta([]);
    setAlbumUrl("");
    setError(null);
  };

  const handleImagesChange = (next: QueuedImage[]) => {
    setImages(next);
    setMeta((current) =>
      next.map((_, index) => current[index] ?? { ...NO_META })
    );
  };

  const setImageMeta = (index: number, patch: Partial<ImageMeta>) => {
    setMeta((current) =>
      current.map((entry, position) =>
        position === index ? { ...entry, ...patch } : entry
      )
    );
  };

  const canSubmit =
    images.length > 0 &&
    meta.every((entry) => entry.caption.trim() && entry.altText.trim()) &&
    (albumUrl === "" || /^https?:\/\//u.test(albumUrl)) &&
    !busy;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    setBusy(true);
    setError(null);

    const outcomes = await Promise.allSettled(
      images.map(async (image, index) => {
        const fileId = await uploadImageFile(image.file);
        await client.club.submitPhoto({
          club: CLUB,
          fileId,
          caption: meta[index]?.caption.trim() ?? "",
          altText: meta[index]?.altText.trim() ?? "",
          albumUrl: albumUrl.trim() || undefined,
        });
      })
    );

    setBusy(false);
    const failed = outcomes.filter((outcome) => outcome.status === "rejected");
    if (failed.length > 0) {
      setError(
        `${images.length - failed.length} of ${images.length} submitted. ${failed.length} failed — try again for those.`
      );
      return;
    }

    reset();
    onSubmitted();
    onClose();
  };

  return (
    <FormDialog
      busy={busy}
      description={`Up to ${MAX_IMAGES_PER_BATCH} photos at a time, each cropped square. Every photo is reviewed before it appears on the public gallery.`}
      error={error}
      onClose={() => {
        reset();
        onClose();
      }}
      onSubmit={() => {
        handleSubmit();
      }}
      open={open}
      submitDisabled={!canSubmit}
      submitLabel="Submit for review"
      title="Add photos"
    >
      <FileBatchUploader
        images={images}
        hint=""
        label="Photos"
        onChange={handleImagesChange}
        ratioKey="galleryThumb"
      />
      {images.map((image, index) => (
        <Panel key={image.previewUrl}>
          <Field
            kind="text"
            label={`Caption ${index + 1}`}
            onChange={(value) => setImageMeta(index, { caption: value })}
            value={meta[index]?.caption ?? ""}
          />
          <Field
            hint="Describes the photo for a screen reader."
            kind="text"
            label={`Alt text ${index + 1}`}
            onChange={(value) => setImageMeta(index, { altText: value })}
            value={meta[index]?.altText ?? ""}
          />
        </Panel>
      ))}
      <Field
        hint="Optional — a link to the full-resolution set (Google Photos, Flickr, etc.), shown with every photo in this batch."
        kind="url"
        label="Album link"
        onChange={setAlbumUrl}
        value={albumUrl}
      />
    </FormDialog>
  );
};

const MyPhotos = ({ onAdd }: { onAdd: () => void }) => {
  const queryClient = useQueryClient();
  const myPhotosQuery = orpc.club.listMyPhotos.queryOptions();
  const { data: photos } = useSuspenseQuery(myPhotosQuery);
  const fileIds = photos.map((photo) => photo.fileId);
  const { data: fileUrls = {} } = useQuery({
    queryKey: ["club-photo-file-urls", fileIds],
    queryFn: () => resolveFileUrls(fileIds),
  });

  const withdrawMutation = useMutation(
    orpc.club.withdrawPhoto.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(myPhotosQuery);
      },
    })
  );

  return (
    <Panel>
      <PanelHead
        action={
          <CmsButton onClick={onAdd} tone="primary">
            Add photos
          </CmsButton>
        }
        title="Your submissions"
      />
      {photos.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <RecordList label="Your photo submissions">
          {photos.map((photo) => (
            <RecordRow
              actions={
                <>
                  <Pill tone={STATUS_TONE[photo.status] ?? "neutral"}>
                    {STATUS_LABEL[photo.status] ?? photo.status}
                  </Pill>
                  {photo.status === "pending" && (
                    <CmsButton
                      onClick={() => withdrawMutation.mutate({ id: photo.id })}
                      tone="danger"
                    >
                      Withdraw
                    </CmsButton>
                  )}
                </>
              }
              key={photo.id}
              meta={[
                photo.albumUrl && "Album link attached",
                photo.reviewNote && `Reviewer note: ${photo.reviewNote}`,
              ]
                .filter(Boolean)
                .join(" · ")}
              name={
                <span
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <img
                    alt={photo.altText}
                    height={40}
                    src={fileUrls[photo.fileId]}
                    style={{ borderRadius: 4, objectFit: "cover" }}
                    width={40}
                  />
                  {photo.caption}
                </span>
              }
            />
          ))}
        </RecordList>
      )}
    </Panel>
  );
};

const PhotosContent = () => {
  const queryClient = useQueryClient();
  const myPhotosQuery = orpc.club.listMyPhotos.queryOptions();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Photography Club"
        heading="Gallery submissions"
        note="Every photo is reviewed by the CMS team before it appears on the public gallery."
      />
      <MyPhotos onAdd={() => setDialogOpen(true)} />
      <AddPhotosDialog
        onClose={() => setDialogOpen(false)}
        onSubmitted={() => queryClient.invalidateQueries(myPhotosQuery)}
        open={dialogOpen}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/club-admin/photography/photos")({
  component: PhotosContent,
});
