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
  FileUploader,
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
import { useReducer, useRef, useState } from "react";

import { uploadImageFile } from "@/components/club/upload";
import { mutationErrorText } from "@/components/mutation-error";
import { orpc } from "@/utils/orpc";

type LinkedKind = "news" | "event" | "achievement";
type GalleryStatus = "pending" | "approved" | "rejected";

const LINK_KIND_OPTIONS = [
  { label: "None", value: "" },
  { label: "News post", value: "news" },
  { label: "Event", value: "event" },
  { label: "Achievement", value: "achievement" },
];

const EMPTY_LABEL_BY_KIND: Record<LinkedKind, string> = {
  news: "No news posts yet",
  event: "No events yet",
  achievement: "No achievements yet",
};

const STATUS_LABEL: Record<GalleryStatus, string> = {
  pending: "Pending review",
  approved: "Approved — live",
  rejected: "Rejected",
};

const STATUS_TONE: Record<GalleryStatus, PillTone> = {
  pending: "warning",
  approved: "positive",
  rejected: "danger",
};

/** Every gallery's maximum photo count, matching the API's `photos` array
 * bound (`galleryFieldsSchema`) — existing plus newly-added photos in the
 * dialog must never exceed it. */
const MAX_PHOTOS_PER_GALLERY = 5;

interface GalleryPhoto {
  id: string;
  fileId: string;
  caption: string;
  altText: string;
  imageUrl: string | null;
}

interface GalleryRow {
  id: string;
  club: string | null;
  title: string;
  description: string | null;
  albumUrl: string | null;
  coverImageId: string | null;
  coverImageUrl: string | null;
  status: GalleryStatus;
  createdById: string;
  createdAt: string;
  reviewNote: string | null;
  linkedKind: LinkedKind | null;
  linkedTitle: string | null;
  linkedNewsId: string | null;
  linkedEventId: string | null;
  linkedAchievementId: string | null;
  photos: GalleryPhoto[];
}

interface LinkableItem {
  id: string;
  title: string;
}

/**
 * The second select in a link picker - which specific item, once a kind is
 * picked. Shows an explicit disabled option when the source list is empty
 * rather than an empty dropdown.
 */
const LinkTargetPicker = ({
  emptyLabel,
  items,
  onChange,
  value,
}: {
  items: LinkableItem[];
  value: string;
  onChange: (next: string) => void;
  emptyLabel: string;
}) => {
  const options =
    items.length === 0
      ? [{ label: emptyLabel, value: "" }]
      : [
          { label: "Choose one…", value: "" },
          ...items.map((item) => ({ label: item.title, value: item.id })),
        ];

  return (
    <Field
      kind="select"
      label="Linked item"
      onChange={onChange}
      options={options}
      value={value}
    />
  );
};

/**
 * The reviewer's link picker, on a pending row - saves immediately via
 * `club.setGalleryLink`, independent of the approve/reject decision, exactly
 * like the per-photo picker this replaces.
 */
const GalleryLinkPicker = ({
  achievements,
  events,
  galleryRow,
  newsPosts,
  onLinked,
}: {
  galleryRow: Pick<
    GalleryRow,
    | "id"
    | "linkedKind"
    | "linkedNewsId"
    | "linkedEventId"
    | "linkedAchievementId"
  >;
  newsPosts: LinkableItem[];
  events: LinkableItem[];
  achievements: LinkableItem[];
  onLinked: () => void;
}) => {
  const currentLinkedId =
    galleryRow.linkedNewsId ??
    galleryRow.linkedEventId ??
    galleryRow.linkedAchievementId;
  const [kind, setKind] = useState<string>(galleryRow.linkedKind ?? "");
  const [linkedId, setLinkedId] = useState<string>(currentLinkedId ?? "");

  const linkMutation = useMutation(orpc.club.setGalleryLink.mutationOptions());

  const byKind: Record<LinkedKind, LinkableItem[]> = {
    news: newsPosts,
    event: events,
    achievement: achievements,
  };
  const canSave =
    !linkMutation.isPending &&
    (kind === "" || linkedId !== "") &&
    (kind !== (galleryRow.linkedKind ?? "") ||
      linkedId !== (currentLinkedId ?? ""));

  const handleSave = () => {
    if (kind === "") {
      linkMutation.mutate(
        { id: galleryRow.id, linkedId: null, linkedKind: null },
        { onSuccess: onLinked }
      );
      return;
    }
    linkMutation.mutate(
      { id: galleryRow.id, linkedId, linkedKind: kind as LinkedKind },
      { onSuccess: onLinked }
    );
  };

  return (
    <span
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        alignItems: "flex-end",
      }}
    >
      <Field
        kind="select"
        label="Related content"
        onChange={(next) => {
          setKind(next);
          setLinkedId("");
        }}
        options={LINK_KIND_OPTIONS}
        value={kind}
      />
      {kind === "" ? null : (
        <LinkTargetPicker
          emptyLabel={EMPTY_LABEL_BY_KIND[kind as LinkedKind]}
          items={byKind[kind as LinkedKind]}
          onChange={setLinkedId}
          value={linkedId}
        />
      )}
      <CmsButton disabled={!canSave} onClick={handleSave} tone="quiet">
        {linkMutation.isPending ? "Saving..." : "Save link"}
      </CmsButton>
    </span>
  );
};

const GalleryReviewControls = ({
  achievements,
  events,
  galleryRow,
  newsPosts,
  onDecided,
}: {
  galleryRow: GalleryRow;
  newsPosts: LinkableItem[];
  events: LinkableItem[];
  achievements: LinkableItem[];
  onDecided: () => void;
}) => {
  const [note, setNote] = useState("");

  const reviewMutation = useMutation(
    orpc.club.reviewGallery.mutationOptions({ onSuccess: onDecided })
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      <Field
        kind="text"
        label="Reviewer note"
        onChange={setNote}
        value={note}
      />
      <GalleryLinkPicker
        achievements={achievements}
        events={events}
        galleryRow={galleryRow}
        newsPosts={newsPosts}
        onLinked={onDecided}
      />
      <span style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <CmsButton
          disabled={reviewMutation.isPending}
          onClick={() =>
            reviewMutation.mutate({
              id: galleryRow.id,
              status: "approved",
              reviewNote: note || undefined,
            })
          }
          tone="primary"
        >
          Approve
        </CmsButton>
        <CmsButton
          disabled={reviewMutation.isPending}
          onClick={() =>
            reviewMutation.mutate({
              id: galleryRow.id,
              status: "rejected",
              reviewNote: note || undefined,
            })
          }
          tone="danger"
        >
          Reject
        </CmsButton>
      </span>
    </div>
  );
};

interface ExistingPhotoState {
  id: string;
  fileId: string;
  caption: string;
  altText: string;
  imageUrl: string | null;
}

interface NewPhotoMeta {
  caption: string;
  altText: string;
}

interface GalleryFormState {
  title: string;
  description: string;
  albumUrl: string;
  coverImageId: string | null;
  coverImagePreviewUrl: string | null;
  linkedKind: string;
  linkedId: string;
  existingPhotos: ExistingPhotoState[];
  newImages: QueuedImage[];
  newMeta: NewPhotoMeta[];
}

const EMPTY_FORM_STATE: GalleryFormState = {
  title: "",
  description: "",
  albumUrl: "",
  coverImageId: null,
  coverImagePreviewUrl: null,
  linkedKind: "",
  linkedId: "",
  existingPhotos: [],
  newImages: [],
  newMeta: [],
};

/** The dialog's initial state, read once per mount - the parent remounts the
 * dialog (via `key`) every time it opens, so this never needs to react to a
 * prop change after the fact. */
const formStateFromRow = (row: GalleryRow | null): GalleryFormState =>
  row
    ? {
        title: row.title,
        description: row.description ?? "",
        albumUrl: row.albumUrl ?? "",
        coverImageId: row.coverImageId,
        coverImagePreviewUrl: row.coverImageUrl,
        linkedKind: row.linkedKind ?? "",
        linkedId:
          row.linkedNewsId ??
          row.linkedEventId ??
          row.linkedAchievementId ??
          "",
        existingPhotos: row.photos.map((photo) => ({
          id: photo.id,
          fileId: photo.fileId,
          caption: photo.caption,
          altText: photo.altText,
          imageUrl: photo.imageUrl,
        })),
        newImages: [],
        newMeta: [],
      }
    : EMPTY_FORM_STATE;

interface FormAction {
  patch: Partial<GalleryFormState>;
  type: "patch";
}

const formReducer = (
  state: GalleryFormState,
  action: FormAction
): GalleryFormState => ({ ...state, ...action.patch });

const GalleryDialog = ({
  achievements,
  editing,
  events,
  newsPosts,
  onClose,
  onSaved,
  open,
}: {
  open: boolean;
  editing: GalleryRow | null;
  onClose: () => void;
  onSaved: () => void;
  newsPosts: LinkableItem[];
  events: LinkableItem[];
  achievements: LinkableItem[];
}) => {
  const [form, dispatch] = useReducer(formReducer, editing, formStateFromRow);
  const patch = (next: Partial<GalleryFormState>) =>
    dispatch({ patch: next, type: "patch" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const createMutation = useMutation(
    orpc.cms.createGallery.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );
  const updateMutation = useMutation(
    orpc.cms.updateGallery.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  const busy =
    createMutation.isPending || updateMutation.isPending || uploading;

  const setExistingMeta = (
    index: number,
    patchFields: Partial<Pick<ExistingPhotoState, "caption" | "altText">>
  ) => {
    patch({
      existingPhotos: form.existingPhotos.map((photo, position) =>
        position === index ? { ...photo, ...patchFields } : photo
      ),
    });
  };

  const removeExisting = (index: number) => {
    patch({
      existingPhotos: form.existingPhotos.filter(
        (_, position) => position !== index
      ),
    });
  };

  const handleNewImagesChange = (next: QueuedImage[]) => {
    patch({
      newImages: next,
      newMeta: next.map(
        (_, index) => form.newMeta[index] ?? { caption: "", altText: "" }
      ),
    });
  };

  const setNewMeta = (index: number, patchFields: Partial<NewPhotoMeta>) => {
    patch({
      newMeta: form.newMeta.map((entry, position) =>
        position === index ? { ...entry, ...patchFields } : entry
      ),
    });
  };

  const totalPhotoCount = form.existingPhotos.length + form.newImages.length;
  const albumUrlValid =
    form.albumUrl.trim() === "" || /^https?:\/\//u.test(form.albumUrl.trim());
  const linkValid = form.linkedKind === "" || form.linkedId !== "";
  const captionsValid =
    form.existingPhotos.every(
      (photo) => photo.caption.trim() && photo.altText.trim()
    ) &&
    form.newImages.every(
      (_, index) =>
        form.newMeta[index]?.caption.trim() &&
        form.newMeta[index]?.altText.trim()
    );

  const canSubmit =
    form.title.trim().length > 0 &&
    totalPhotoCount > 0 &&
    totalPhotoCount <= MAX_PHOTOS_PER_GALLERY &&
    albumUrlValid &&
    linkValid &&
    captionsValid &&
    !busy;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    setUploading(true);
    setUploadError(null);

    let newFileIds: string[];
    try {
      newFileIds = await Promise.all(
        form.newImages.map((image) => uploadImageFile(image.file))
      );
    } catch {
      setUploading(false);
      setUploadError("One or more photos could not be uploaded. Try again.");
      return;
    }
    setUploading(false);

    const photos = [
      ...form.existingPhotos.map((photo) => ({
        fileId: photo.fileId,
        caption: photo.caption.trim(),
        altText: photo.altText.trim(),
      })),
      ...newFileIds.map((fileId, index) => ({
        fileId,
        caption: form.newMeta[index]?.caption.trim() ?? "",
        altText: form.newMeta[index]?.altText.trim() ?? "",
      })),
    ];

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      albumUrl: form.albumUrl.trim() || null,
      coverImageId: form.coverImageId,
      linkedKind:
        form.linkedKind === "" ? null : (form.linkedKind as LinkedKind),
      linkedId: form.linkedKind === "" ? null : form.linkedId,
      photos,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const byKind: Record<LinkedKind, LinkableItem[]> = {
    news: newsPosts,
    event: events,
    achievement: achievements,
  };

  return (
    <FormDialog
      busy={busy}
      description="CMS-direct galleries go live the instant they are saved. Editing any gallery here replaces its entire photo set."
      error={
        uploadError ??
        mutationErrorText(
          editing ? updateMutation.error : createMutation.error,
          "The gallery could not be saved."
        )
      }
      onClose={onClose}
      onSubmit={() => {
        void handleSubmit();
      }}
      open={open}
      submitDisabled={!canSubmit}
      submitLabel={editing ? "Save changes" : "Create gallery"}
      title={editing ? "Edit gallery" : "New gallery"}
    >
      <Field
        kind="text"
        label="Title"
        onChange={(next) => patch({ title: next })}
        value={form.title}
      />
      <Field
        kind="textarea"
        label="Description (optional)"
        onChange={(next) => patch({ description: next })}
        value={form.description}
      />
      <Field
        hint="Optional - a link to the full-resolution set (Google Photos, Flickr, etc.)."
        kind="url"
        label="Album link (optional)"
        onChange={(next) => patch({ albumUrl: next })}
        value={form.albumUrl}
      />
      <FileUploader
        clearable
        label="Cover image (optional)"
        onChange={(next) => {
          patch({ coverImageId: next, coverImagePreviewUrl: null });
        }}
        onUpload={uploadImageFile}
        previewUrl={form.coverImagePreviewUrl}
        ratioKey="galleryThumb"
        value={form.coverImageId}
      />
      <Field
        kind="select"
        label="Related content"
        onChange={(next) => patch({ linkedKind: next, linkedId: "" })}
        options={LINK_KIND_OPTIONS}
        value={form.linkedKind}
      />
      {form.linkedKind === "" ? null : (
        <LinkTargetPicker
          emptyLabel={EMPTY_LABEL_BY_KIND[form.linkedKind as LinkedKind]}
          items={byKind[form.linkedKind as LinkedKind]}
          onChange={(next) => patch({ linkedId: next })}
          value={form.linkedId}
        />
      )}
      {form.existingPhotos.length > 0 ? (
        <Panel>
          <PanelHead title="Existing photos" />
          {form.existingPhotos.map((photo, index) => (
            <Panel key={photo.id}>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  alt={photo.altText}
                  height={48}
                  src={photo.imageUrl ?? undefined}
                  style={{ borderRadius: 4, objectFit: "cover" }}
                  width={48}
                />
              </span>
              <Field
                kind="text"
                label={`Caption ${index + 1}`}
                onChange={(value) => setExistingMeta(index, { caption: value })}
                value={photo.caption}
              />
              <Field
                hint="Describes the photo for a screen reader."
                kind="text"
                label={`Alt text ${index + 1}`}
                onChange={(value) => setExistingMeta(index, { altText: value })}
                value={photo.altText}
              />
              <CmsButton onClick={() => removeExisting(index)} tone="danger">
                Remove
              </CmsButton>
            </Panel>
          ))}
        </Panel>
      ) : null}
      <FileBatchUploader
        images={form.newImages}
        hint=""
        label="Add photos"
        max={Math.max(0, MAX_PHOTOS_PER_GALLERY - form.existingPhotos.length)}
        onChange={handleNewImagesChange}
        ratioKey="galleryThumb"
      />
      {form.newImages.map((image, index) => (
        <Panel key={image.previewUrl}>
          <Field
            kind="text"
            label={`New caption ${index + 1}`}
            onChange={(value) => setNewMeta(index, { caption: value })}
            value={form.newMeta[index]?.caption ?? ""}
          />
          <Field
            hint="Describes the photo for a screen reader."
            kind="text"
            label={`New alt text ${index + 1}`}
            onChange={(value) => setNewMeta(index, { altText: value })}
            value={form.newMeta[index]?.altText ?? ""}
          />
        </Panel>
      ))}
    </FormDialog>
  );
};

const GalleryRowItem = ({
  achievements,
  deletePending,
  events,
  galleryRow,
  newsPosts,
  onDecided,
  onDelete,
  onEdit,
}: {
  galleryRow: GalleryRow;
  newsPosts: LinkableItem[];
  events: LinkableItem[];
  achievements: LinkableItem[];
  onDecided: () => void;
  onEdit: (row: GalleryRow) => void;
  onDelete: (id: string) => void;
  deletePending: boolean;
}) => (
  <RecordRow
    actions={
      <>
        <Pill tone={STATUS_TONE[galleryRow.status]}>
          {STATUS_LABEL[galleryRow.status]}
        </Pill>
        {galleryRow.status === "pending" ? (
          <GalleryReviewControls
            achievements={achievements}
            events={events}
            galleryRow={galleryRow}
            newsPosts={newsPosts}
            onDecided={onDecided}
          />
        ) : null}
        <CmsButton onClick={() => onEdit(galleryRow)} tone="quiet">
          Edit
        </CmsButton>
        <CmsButton
          disabled={deletePending}
          onClick={() => onDelete(galleryRow.id)}
          tone="danger"
        >
          Delete
        </CmsButton>
      </>
    }
    meta={[
      galleryRow.club ? `Club: ${galleryRow.club}` : "CMS-direct",
      `${galleryRow.photos.length} photo${galleryRow.photos.length === 1 ? "" : "s"}`,
      galleryRow.linkedTitle && `Linked: ${galleryRow.linkedTitle}`,
      galleryRow.reviewNote && `Reviewer note: ${galleryRow.reviewNote}`,
    ]
      .filter(Boolean)
      .join(" · ")}
    name={
      <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span>{galleryRow.title}</span>
        <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {galleryRow.photos.slice(0, 6).map((photo) => (
            <img
              alt={photo.altText}
              height={40}
              key={photo.id}
              src={photo.imageUrl ?? undefined}
              style={{ borderRadius: 4, objectFit: "cover" }}
              title={photo.caption}
              width={40}
            />
          ))}
          {galleryRow.photos.length > 6 ? (
            <span>+{galleryRow.photos.length - 6} more</span>
          ) : null}
        </span>
      </span>
    }
  />
);

const GalleriesContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listGalleries.queryOptions();
  const { data: galleries } = useSuspenseQuery(listQuery);
  const newsPostsQuery = useSuspenseQuery(
    orpc.cms.listNewsPosts.queryOptions()
  );
  const eventsQuery = useSuspenseQuery(orpc.cms.listEvents.queryOptions());
  const achievementsQuery = useSuspenseQuery(
    orpc.cms.listAchievements.queryOptions()
  );

  const [dialog, setDialog] = useState<{
    open: boolean;
    editing: GalleryRow | null;
    token: number;
  }>({ editing: null, open: false, token: 0 });
  const openToken = useRef(0);

  const invalidate = () => queryClient.invalidateQueries(listQuery);

  const deleteMutation = useMutation(
    orpc.cms.deleteGallery.mutationOptions({ onSuccess: invalidate })
  );

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Clubs"
        heading="Galleries"
        note="Every gallery, club-submitted or CMS-direct — review, link, edit and publish from one place."
      />
      <Panel>
        <PanelHead
          action={
            <CmsButton
              onClick={() =>
                setDialog({
                  editing: null,
                  open: true,
                  token: (openToken.current += 1),
                })
              }
              tone="primary"
            >
              Add gallery
            </CmsButton>
          }
          title="Galleries"
        />
        {galleries.length === 0 ? (
          <p>No galleries yet.</p>
        ) : (
          <RecordList label="Galleries">
            {galleries.map((galleryRow) => (
              <GalleryRowItem
                achievements={achievementsQuery.data}
                deletePending={deleteMutation.isPending}
                events={eventsQuery.data}
                galleryRow={galleryRow}
                key={galleryRow.id}
                newsPosts={newsPostsQuery.data}
                onDecided={invalidate}
                onDelete={(id) => deleteMutation.mutate({ id })}
                onEdit={(row) =>
                  setDialog({
                    editing: row,
                    open: true,
                    token: (openToken.current += 1),
                  })
                }
              />
            ))}
          </RecordList>
        )}
      </Panel>
      <GalleryDialog
        achievements={achievementsQuery.data}
        editing={dialog.editing}
        events={eventsQuery.data}
        key={dialog.token}
        newsPosts={newsPostsQuery.data}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={invalidate}
        open={dialog.open}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/cms/galleries")({
  head: () => ({
    meta: [
      { title: "Galleries — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: GalleriesContent,
});
