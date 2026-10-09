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
  FileUploader,
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
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { uploadImageFile } from "@/components/club/upload";
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

const AddGalleryDialog = ({
  onClose,
  onSubmitted,
  open,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [albumUrl, setAlbumUrl] = useState("");
  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState<
    string | null
  >(null);
  const [images, setImages] = useState<QueuedImage[]>([]);
  const [meta, setMeta] = useState<ImageMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setAlbumUrl("");
    setCoverImageId(null);
    setCoverImagePreviewUrl(null);
    setImages([]);
    setMeta([]);
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
    title.trim().length > 0 &&
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

    try {
      const photos = await Promise.all(
        images.map(async (image, index) => ({
          fileId: await uploadImageFile(image.file),
          caption: meta[index]?.caption.trim() ?? "",
          altText: meta[index]?.altText.trim() ?? "",
        }))
      );

      await client.club.createGallery({
        club: CLUB,
        title: title.trim(),
        description: description.trim() || undefined,
        albumUrl: albumUrl.trim() || undefined,
        coverImageId: coverImageId ?? undefined,
        photos,
      });

      setBusy(false);
      reset();
      onSubmitted();
      onClose();
    } catch {
      setBusy(false);
      setError("Could not submit the gallery — try again.");
    }
  };

  return (
    <FormDialog
      busy={busy}
      description={`Up to ${MAX_IMAGES_PER_BATCH} photos per gallery, each cropped square. Every gallery is reviewed before it appears on the public gallery.`}
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
      title="Add gallery"
    >
      <Field kind="text" label="Title" onChange={setTitle} value={title} />
      <Field
        hint="Optional."
        kind="text"
        label="Description"
        onChange={setDescription}
        value={description}
      />
      <Field
        hint="Optional - a link to the full-resolution set (Google Photos, Flickr, etc.)."
        kind="url"
        label="Album link"
        onChange={setAlbumUrl}
        value={albumUrl}
      />
      <FileUploader
        clearable
        label="Cover image (optional)"
        onChange={(next) => {
          setCoverImageId(next);
          setCoverImagePreviewUrl(null);
        }}
        onUpload={uploadImageFile}
        previewUrl={coverImagePreviewUrl}
        ratioKey="galleryThumb"
        value={coverImageId}
      />
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
    </FormDialog>
  );
};

const MyGalleries = ({ onAdd }: { onAdd: () => void }) => {
  const queryClient = useQueryClient();
  const myGalleriesQuery = orpc.club.listMyGalleries.queryOptions();
  const { data: galleries } = useSuspenseQuery(myGalleriesQuery);

  const withdrawMutation = useMutation(
    orpc.club.withdrawGallery.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(myGalleriesQuery);
      },
    })
  );

  return (
    <Panel>
      <PanelHead
        action={
          <CmsButton onClick={onAdd} tone="primary">
            Add gallery
          </CmsButton>
        }
        title="Your galleries"
      />
      {galleries.length === 0 ? (
        <p>No galleries yet.</p>
      ) : (
        <RecordList label="Your gallery submissions">
          {galleries.map((gallery) => (
            <RecordRow
              actions={
                <>
                  <Pill tone={STATUS_TONE[gallery.status] ?? "neutral"}>
                    {STATUS_LABEL[gallery.status] ?? gallery.status}
                  </Pill>
                  {gallery.status === "pending" && (
                    <CmsButton
                      onClick={() =>
                        withdrawMutation.mutate({ id: gallery.id })
                      }
                      tone="danger"
                    >
                      Withdraw
                    </CmsButton>
                  )}
                </>
              }
              key={gallery.id}
              meta={[
                `${gallery.photoCount} photo${gallery.photoCount === 1 ? "" : "s"}`,
                gallery.reviewNote && `Reviewer note: ${gallery.reviewNote}`,
              ]
                .filter(Boolean)
                .join(" · ")}
              name={
                <span
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  {gallery.coverUrl && (
                    <img
                      alt=""
                      height={40}
                      src={gallery.coverUrl}
                      style={{ borderRadius: 4, objectFit: "cover" }}
                      width={40}
                    />
                  )}
                  {gallery.title}
                </span>
              }
            />
          ))}
        </RecordList>
      )}
    </Panel>
  );
};

const GalleriesContent = () => {
  const queryClient = useQueryClient();
  const myGalleriesQuery = orpc.club.listMyGalleries.queryOptions();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Photography Club"
        heading="Gallery submissions"
        note="Every gallery is reviewed by the CMS team before it appears on the public gallery."
      />
      <MyGalleries onAdd={() => setDialogOpen(true)} />
      <AddGalleryDialog
        onClose={() => setDialogOpen(false)}
        onSubmitted={() => queryClient.invalidateQueries(myGalleriesQuery)}
        open={dialogOpen}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/club-admin/photography/galleries")({
  component: GalleriesContent,
});
