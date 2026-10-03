import {
  CmsButton,
  EmptyState,
  Field,
  Notice,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import type { NoticeTone } from "@aloysius/ui/components/cms/cms-primitives";
import {
  FileBatchUploader,
  FileUploader,
  MAX_IMAGES_PER_BATCH,
} from "@aloysius/ui/components/cms/file-uploader";
import type { QueuedImage } from "@aloysius/ui/components/cms/file-uploader";
import {
  MediaFrame,
  MediaThumb,
} from "@aloysius/ui/components/primitives/media-frame";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  IMAGE_ROLE_CROP,
  IMAGE_ROLE_FRAME,
  IMAGE_ROLE_OPTIONS,
  IMAGE_ROLE_RATIO,
  IMAGE_ROLE_TONE,
} from "@/components/club/gallery-roles";
import type { ImageRole as GalleryImageRole } from "@/components/club/gallery-roles";
import {
  ClubPage,
  ClubPageLoading,
  FieldStack,
} from "@/components/club/page-parts";
import { uploadImageFile } from "@/components/club/upload";
import { client, orpc } from "@/utils/orpc";

/**
 * One gallery: its images, what each image is for, its cover, and what it is
 * about.
 *
 * Everything here is a *submission*. Nothing on this screen changes the live
 * gallery, so the screen has to be honest about that or the club administrator
 * will think their photographs are up when they are still in a queue. The
 * notice after every submit says so explicitly.
 *
 * The three things a gallery can be given beyond its pictures are all on this
 * screen, deliberately together rather than spread across sub-pages: a **cover**
 * to represent it, **links** to the events and achievements it is about, and an
 * **off-site album** link for the photographs that are too many to host here.
 */

type ImageRole = GalleryImageRole;

/** The item shape `listMyGalleries` returns, narrowed to what this screen uses. */
interface GalleryItem {
  id: string;
  altText: string;
  caption: string | null;
  imageRole: ImageRole;
  isCover: boolean;
  imageUrl: string | null;
}

const ROLE_CROP = IMAGE_ROLE_CROP;
const ROLE_FRAME = IMAGE_ROLE_FRAME;
const ROLE_TONE = IMAGE_ROLE_TONE;

const ALBUM_URL_PATTERN = /^https?:\/\/\S+$/iu;

/**
 * The cover image, as its own upload.
 *
 * The cover is a `gallery_item` with `imageRole: "cover"` - there is no separate
 * cover column, so the one-cover-per-gallery rule is a database constraint rather
 * than something this screen has to police. That is also why changing it is two
 * submissions rather than one: demoting the old cover and promoting the new one
 * are two different rows, and a submission is a row. The panel says so, because a
 * club that uploads a replacement and sees the old cover still there has otherwise
 * no way to tell a pending change from a failed one.
 */
const CoverPanel = ({
  cover,
  galleryId,
  itemCount,
}: {
  cover: GalleryItem | null;
  galleryId: string;
  itemCount: number;
}) => {
  const queryClient = useQueryClient();
  /*
   * The uploaded file's id, not the file. `FileUploader` has already cropped and
   * uploaded by the time it calls back, so all that is left to do is attach an id
   * and an alt text to a submission — and holding the `File` here would mean
   * keeping a cropped copy of the image in memory for a form the club may not
   * submit.
   */
  const [fileId, setFileId] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    tone: NoticeTone;
    text: string;
  } | null>(null);

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: orpc.clubs.listMyGalleries.key(),
    });
  };

  const clearCover = useMutation(
    orpc.clubs.submitGalleryItemUpdate.mutationOptions({
      onSuccess: async () => {
        setNotice({
          tone: "success",
          text: "Sent for review. The cover stays until a CMS editor approves.",
        });
        await refresh();
      },
    })
  );

  /*
   * A gallery with no images at all cannot have its cover removed, because there
   * is no cover to remove. Guarded so the button is never rendered rather than
   * rendered-and-disabled: a control that cannot work should not be there.
   */
  const canClear = cover !== null && itemCount > 0;

  const submit = async () => {
    if (!fileId || altText.trim() === "") {
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await client.clubs.submitGalleryItemCreate({
        galleryId,
        payload: {
          altText: altText.trim(),
          id: crypto.randomUUID(),
          fileId,
          imageRole: "cover",
          /*
           * Last, so the cover sits at the end of the masonry grid rather than
           * the front of it. A cover is the gallery's representative, not
           * usually its opening shot.
           */
          position: itemCount,
        },
      });
      setFileId(null);
      setAltText("");
      setNotice({
        tone: "success",
        text: "Sent for review. The cover appears in listings once a CMS editor approves it.",
      });
      await refresh();
    } catch (error) {
      setNotice({
        tone: "danger",
        text:
          error instanceof Error
            ? error.message
            : "That cover could not be sent. Try a smaller file.",
      });
    }
    // No `finally`: the React Compiler cannot lower a `try` with one.
    setBusy(false);
  };

  return (
    <Panel accent>
      <PanelHead
        eyebrow="How this gallery is represented"
        note="The cover is the single image that stands in for this gallery in listings, on the events page, and when it is shared. A gallery has at most one."
        title="Cover image"
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      {cover ? (
        <>
          <MediaFrame
            alt={cover.altText}
            aspectRatio={ROLE_FRAME.cover}
            src={cover.imageUrl}
          />
          <RecordRow
            actions={<Pill tone="positive">Cover</Pill>}
            meta={<span>{cover.altText}</span>}
            name="Current cover"
          />
          <div>
            <CmsButton
              disabled={!canClear || clearCover.isPending}
              onClick={() => {
                clearCover.mutate({
                  itemId: cover.id,
                  payload: { imageRole: "item" },
                });
              }}
              tone="danger"
            >
              {clearCover.isPending ? "Sending…" : "Remove the cover"}
            </CmsButton>
          </div>
          <Notice tone="info">
            To use a different photograph, remove this cover first and upload
            the new one. Each change is reviewed on its own, so the cover stays
            as it is until the removal is approved.
          </Notice>
        </>
      ) : (
        <>
          {/*
           * `FileUploader` owns the frame, the crop and the upload, so this panel
           * is left with only the submission: an alt text is required before the
           * cover can be sent for review.
           */}
          <FileUploader
            disabled={busy}
            hint={`Landscape works best. Cropped to ${ROLE_CROP.cover} before it is uploaded.`}
            label="Cover photograph"
            onChange={setFileId}
            onUpload={uploadImageFile}
            ratioKey={IMAGE_ROLE_RATIO.cover}
            value={fileId}
          />
          <Field
            hint="Describe the photograph for someone who cannot see it. Required."
            label="Alt text"
            onChange={setAltText}
            value={altText}
            wide
          />
          <div>
            <CmsButton
              disabled={!fileId || altText.trim() === "" || busy}
              onClick={() => {
                void submit();
              }}
              tone="primary"
            >
              {busy ? "Sending…" : "Send cover for review"}
            </CmsButton>
          </div>
        </>
      )}
    </Panel>
  );
};

/**
 * What the "change role" button does, per current role.
 *
 * Module scope rather than built inside the row: a fresh object each render looks
 * new to every memoised child below it, for no benefit. Promoting a plain image
 * to cover, and demoting a cover or banner back to a plain image, are the only
 * two moves offered — the partial unique indexes mean a gallery has at most one
 * cover and at most one banner, so a second of either would fail on approval.
 */
const NEXT_ROLE: Record<ImageRole, ImageRole> = {
  banner: "item",
  cover: "item",
  item: "cover",
};

/**
 * Per-image controls: what each image is for, and whether it stays.
 *
 * The cover could always be set at upload time and never afterwards, which meant
 * a club whose best shot arrived in a later batch could not promote it. These
 * buttons are the same `submitGalleryItemUpdate` endpoint the panel above uses to
 * clear a cover.
 */
const ImageRow = ({
  busy,
  item,
  onSetRole,
}: {
  busy: boolean;
  item: GalleryItem;
  onSetRole: (itemId: string, role: ImageRole) => void;
}) => (
  <RecordRow
    actions={
      <>
        <Pill tone={ROLE_TONE[item.imageRole] ?? "neutral"}>
          {item.imageRole}
        </Pill>
        <CmsButton
          disabled={busy}
          onClick={() => {
            onSetRole(item.id, NEXT_ROLE[item.imageRole]);
          }}
          tone="quiet"
        >
          {item.imageRole === "item" ? "Make cover" : "Make plain"}
        </CmsButton>
      </>
    }
    meta={
      <>
        <MediaThumb src={item.imageUrl} />
        <span>{item.altText}</span>
        {item.caption ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{item.caption}</span>
          </>
        ) : null}
      </>
    }
    name={item.caption || item.altText}
  />
);

const UploadImagesPanel = ({
  galleryId,
  hasCover,
  hasBanner,
  position,
}: {
  galleryId: string;
  hasCover: boolean;
  hasBanner: boolean;
  position: number;
}) => {
  const queryClient = useQueryClient();
  const [images, setImages] = useState<QueuedImage[]>([]);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [role, setRole] = useState<ImageRole>("item");
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState<{
    tone: NoticeTone;
    text: string;
  } | null>(null);

  const reset = () => {
    for (const image of images) {
      URL.revokeObjectURL(image.previewUrl);
    }
    setImages([]);
    setAltText("");
    setCaption("");
    setRole("item");
  };

  const roleTaken =
    (role === "cover" && hasCover) || (role === "banner" && hasBanner);
  const canSubmit =
    images.length > 0 &&
    altText.trim().length > 0 &&
    !roleTaken &&
    !isUploading;

  const submitLabel =
    images.length === 0
      ? "Submit images"
      : `Submit ${images.length} ${images.length === 1 ? "image" : "images"}`;

  const runSubmit = async () => {
    if (images.length === 0) {
      return;
    }
    /*
     * Re-checked here rather than trusted from the picker: the component can be
     * driven by a restored state or a future entry point that skips it.
     */
    const batch = images.slice(0, MAX_IMAGES_PER_BATCH);
    setNotice(null);
    setIsUploading(true);

    /*
     * All five in flight together. Sequentially this is the sum of five upload
     * round-trips, and on a school connection that is the difference between a
     * batch that feels instant and one that looks hung. Each is independent, and
     * `Promise.allSettled` is the point: one photograph failing to upload must
     * not discard the four that worked, and the operator needs to know which.
     */
    const settled = await Promise.allSettled(
      batch.map(async (image, index) => {
        const fileId = await uploadImageFile(image.file);
        /*
         * Only the first image of the batch may claim a unique role. The rest
         * would each fail the one-per-gallery partial index, so they go in as
         * ordinary items and the club can promote one of them later.
         */
        const imageRole: ImageRole = index === 0 ? role : "item";
        await client.clubs.submitGalleryItemCreate({
          galleryId,
          payload: {
            altText: altText.trim(),
            caption: caption.trim() || null,
            id: crypto.randomUUID(),
            fileId,
            imageRole,
            position: position + index,
          },
        });
        return image.file.name;
      })
    );

    const failures = settled.flatMap((outcome, index) => {
      if (outcome.status === "fulfilled") {
        return [];
      }
      const name = batch[index]?.file.name ?? "image";
      const reason =
        outcome.reason instanceof Error ? outcome.reason.message : "failed";
      return [`${name}: ${reason}`];
    });
    const sent = settled.length - failures.length;

    setIsUploading(false);
    reset();
    await queryClient.invalidateQueries({
      queryKey: orpc.clubs.listMyGalleries.key(),
    });

    if (failures.length > 0) {
      setNotice({
        tone: sent > 0 ? "warning" : "danger",
        text: `${sent} of ${batch.length} submitted. ${failures.join("; ")}`,
      });
      return;
    }

    setNotice({
      tone: "success",
      text: `${sent} ${sent === 1 ? "image" : "images"} sent for review. Nothing appears on the website until a CMS editor approves it.`,
    });
  };

  return (
    <Panel accent>
      <PanelHead
        note={`Up to ${MAX_IMAGES_PER_BATCH} images per batch. There is no limit on the total in a gallery — submit these and come back for more.`}
        title="Add images"
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <FieldStack>
        {/*
         * The batch is cropped to the role chosen below, and changing the role
         * re-crops nothing already chosen — the frames follow the new role so a
         * portrait offered as a 16:9 banner looks wrong while it is being picked,
         * and the club can see that before they submit rather than after approval.
         */}
        <FileBatchUploader
          disabled={isUploading}
          images={images}
          label="Images"
          onChange={setImages}
          ratioKey={IMAGE_ROLE_RATIO[role]}
        />

        <Field
          hint="Describe the photograph for someone who cannot see it. This is the only text a screen reader user gets."
          label="Alt text"
          onChange={setAltText}
          value={altText}
          wide
        />

        <Field
          hint="Optional. A name, a place, or nothing at all."
          label="Caption"
          onChange={setCaption}
          value={caption}
          wide
        />

        <Field
          hint={`${ROLE_CROP[role]} — the first image in the batch takes this role, the rest go in as gallery images.`}
          kind="select"
          label="What is the first image for?"
          onChange={(next) => {
            setRole(next as ImageRole);
          }}
          options={IMAGE_ROLE_OPTIONS.map((option) => ({
            label:
              roleTaken && option.value === role
                ? `${option.label} — this gallery already has one`
                : option.label,
            value: option.value,
          }))}
          value={role}
          wide
        />

        {roleTaken ? (
          <Notice tone="warning">
            This gallery already has {role === "cover" ? "a cover" : "a banner"}
            . Only one is allowed. Choose a different role, or add this as a
            gallery image.
          </Notice>
        ) : null}

        <div>
          <CmsButton
            disabled={!canSubmit}
            onClick={() => {
              void runSubmit();
            }}
            tone="primary"
          >
            {isUploading ? "Uploading…" : submitLabel}
          </CmsButton>
        </div>
      </FieldStack>
    </Panel>
  );
};

const AlbumLinkPanel = ({
  galleryId,
  albumUrl,
  albumLabel,
}: {
  galleryId: string;
  albumUrl: string | null;
  albumLabel: string | null;
}) => {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState(albumUrl ?? "");
  const [label, setLabel] = useState(albumLabel ?? "See the full album");
  const [notice, setNotice] = useState<{
    tone: NoticeTone;
    text: string;
  } | null>(null);

  const urlValid = url.trim() === "" || ALBUM_URL_PATTERN.test(url.trim());
  const canSubmit =
    urlValid && (url.trim() !== albumUrl || label !== albumLabel);

  const submit = useMutation(
    orpc.clubs.submitGalleryUpdate.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.clubs.listMyGalleries.key(),
        });
      },
    })
  );

  return (
    <Panel>
      <PanelHead
        eyebrow="More photographs"
        note="If most of your album is too many or too large to host here, add a link to it — a Facebook album, a Flickr set, anywhere. Visitors see the link; the images stay where you host them."
        title="Link an off-site album"
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
      {albumUrl ? (
        <Notice tone="info">
          This gallery currently links to {albumUrl}. Changing it is sent for
          review like everything else.
        </Notice>
      ) : null}

      <FieldStack>
        <Field
          hint="A web address beginning with https://"
          kind="email"
          label="Album address"
          onChange={setUrl}
          value={url}
          wide
        />
        <Field
          hint="What the link should say."
          label="Link text"
          onChange={setLabel}
          value={label}
          wide
        />
        {urlValid ? null : (
          <Notice tone="danger">
            That does not look like a web address. It needs to start with
            http:// or https://
          </Notice>
        )}
        <div>
          <CmsButton
            disabled={!canSubmit || submit.isPending}
            onClick={() => {
              setNotice(null);
              submit.mutate({
                galleryId,
                payload: {
                  albumLabel: url.trim() === "" ? null : label.trim(),
                  albumUrl: url.trim() === "" ? null : url.trim(),
                },
              });
            }}
            tone="primary"
          >
            {submit.isPending ? "Sending…" : "Send album link"}
          </CmsButton>
        </div>
      </FieldStack>
    </Panel>
  );
};

const TARGET_LABEL: Record<string, string> = {
  achievement: "a school achievement",
  announcement: "a school announcement",
  clubAchievement: "a club achievement",
  clubAnnouncement: "a club announcement",
  clubEvent: "a club event",
  event: "a school event",
  exhibition: "an exhibition",
  person: "a person",
};

/** The link targets a club can actually pick from, in the order they are offered. */
const TARGET_OPTIONS = [
  { label: "Club events", value: "clubEvent" },
  { label: "Club achievements", value: "clubAchievement" },
  { label: "Club announcements", value: "clubAnnouncement" },
  { label: "School events", value: "event" },
  { label: "School achievements", value: "achievement" },
  { label: "School announcements", value: "announcement" },
] as const;

type LinkTarget = (typeof TARGET_OPTIONS)[number]["value"];

/**
 * What to say when the chosen kind has nothing to choose from.
 *
 * At module scope because it is constant: rebuilt inside the component it would
 * be a new object on every render, which defeats memoisation on everything below
 * it for no benefit. The wording is the point - "you have not had an event
 * approved yet" sends the club to the right screen, where a bare "no options"
 * would not.
 */
const EMPTY_LINK_HINT: Record<LinkTarget, string> = {
  clubEvent:
    "No club events to link yet — yours appear once proposed on the Events page, and other clubs' once they have events.",
  clubAchievement:
    "No club achievements to link yet — propose one on the Achievements page, then link its photographs here.",
  clubAnnouncement:
    "No club announcements to link yet — propose one on the Announcements page, then link its photographs here.",
  event: "The school has no events yet.",
  achievement: "The school has not published any achievements yet.",
  announcement: "The school has not published any announcements yet.",
};

/**
 * Attach a gallery to something else on the site.
 *
 * The point is that a set of photographs and the thing it is about are usually
 * separate records: a gallery of the inter-house athletics, and the achievement
 * the club won for photographing it. A link joins them without either becoming
 * the other, and it is approval-gated with everything else, so a club cannot
 * quietly attach itself to a school-level achievement.
 *
 * The club's *own* events and achievements come first, because those are what a
 * club actually reaches for. They are read from `listMyLinkTargets` rather than
 * the public event list, and that is not a shortcut: the public list only returns
 * events that are approved *and* still upcoming, so a club waiting on review of
 * the very event it is trying to attach photographs to would find nothing to
 * pick. A link and the event it names are approved separately, so a club has to
 * be able to name an event before either exists publicly.
 *
 * The school's photography club is additionally offered the school-wide tables
 * and every other club's records, each labelled with the club that owns it.
 * Reading another club's titles is not a leak: a link is a pointer, not a
 * permission, and the photographs of another club's event are exactly what the
 * school's photographers exist to publish. The other club does not approve the
 * link - the CMS does, in the same queue as everything else.
 */
/** A title with its date appended, for an option label. */
const dated = (title: string, when: string | Date | null) =>
  when ? `${title} — ${new Date(when).toLocaleDateString("en-GB")}` : title;

/** The shape `listMyLinkTargets` and `listSchoolLinkTargets` return rows in. */
interface TargetRecord {
  id: string;
  title: string;
  startsAt?: Date | null;
  achievedOn?: string | null;
  category?: string | null;
  clubName?: string | null;
}

/**
 * The picker's label for one record.
 *
 * An achievement or an announcement carries two different dates or kinds, and
 * showing whichever one it has is the difference between a list a club can pick
 * from and a list of identical titles.
 */
const labelFor = (target: LinkTarget, row: TargetRecord): string => {
  if (target === "clubEvent" || target === "event") {
    return dated(row.title, row.startsAt ?? null);
  }

  if (target === "achievement" || target === "clubAchievement") {
    if (row.achievedOn) {
      return `${row.title} (${row.achievedOn})`;
    }
    return row.category ? `${row.title} (${row.category})` : row.title;
  }

  return row.title;
};

/**
 * The records of one kind, from one source.
 *
 * A lookup rather than a chain of ternaries at the call site: the three sources
 * are three different shapes (`mine` is always present, `school` and `otherClubs`
 * are not), and an unrecognised target has to mean "nothing to pick from" rather
 * than "everything".
 */
const recordsFor = (
  target: LinkTarget,
  source:
    | {
        events?: readonly TargetRecord[] | undefined;
        achievements?: readonly TargetRecord[] | undefined;
        announcements?: readonly TargetRecord[] | undefined;
      }
    | undefined
): readonly TargetRecord[] => {
  switch (target) {
    case "clubEvent":
    case "event": {
      return source?.events ?? [];
    }
    case "clubAchievement":
    case "achievement": {
      return source?.achievements ?? [];
    }
    case "clubAnnouncement":
    case "announcement": {
      return source?.announcements ?? [];
    }
    default: {
      return [];
    }
  }
};

/**
 * The picker's options for one target kind.
 *
 * Module scope rather than inline in the panel: it reads only its arguments,
 * and the panel body is already at the complexity budget. Own records come
 * first, then other clubs' labelled with the club that owns them - the club
 * reaches for its own event far more often than for another club's.
 */
const optionsFor = (
  target: LinkTarget,
  mine: readonly TargetRecord[],
  schoolRows: readonly TargetRecord[],
  otherClubRows: readonly TargetRecord[]
) => [
  ...mine.map((row) => ({ label: labelFor(target, row), value: row.id })),
  ...otherClubRows.map((row) => ({
    label: `${labelFor(target, row)} — ${row.clubName ?? "another club"}`,
    value: row.id,
  })),
  ...schoolRows.map((row) => ({
    label: labelFor(target, row),
    value: row.id,
  })),
];

const GalleryLinksPanel = ({ galleryId }: { galleryId: string }) => {
  const queryClient = useQueryClient();
  const linksQuery = useQuery(
    orpc.clubs.listMyGalleryLinks.queryOptions({ input: { galleryId } })
  );
  const mineQuery = useQuery(orpc.clubs.listMyLinkTargets.queryOptions());
  const schoolQuery = useQuery(orpc.clubs.listSchoolLinkTargets.queryOptions());
  const myClubQuery = useQuery(orpc.clubs.myClub.queryOptions());

  const [target, setTarget] = useState<LinkTarget>("clubEvent");
  const [targetId, setTargetId] = useState("");

  const links = linksQuery.data ?? [];
  const chosen = targetId !== "";
  const alreadyLinked = links.some(
    (link) => link.target === target && link.targetId === targetId
  );

  const mine = mineQuery.data ?? {
    events: [],
    achievements: [],
    announcements: [],
  };

  /*
   * Only the club charged with the school's photography is offered records
   * beyond its own. `listSchoolLinkTargets` returns the school-wide tables and
   * every other club's records; without the capability the picker shows only
   * what `listMyLinkTargets` returned, and the cross-club lists are never
   * relied on.
   */
  const managesSchoolGalleries =
    myClubQuery.data?.capabilities.managesSchoolGalleries ?? false;
  const school = schoolQuery.data?.school;
  const otherClubs = managesSchoolGalleries
    ? schoolQuery.data?.otherClubs
    : undefined;

  const options = optionsFor(
    target,
    recordsFor(target, mine),
    recordsFor(target, school),
    recordsFor(target, otherClubs)
  );

  const submit = useMutation(
    orpc.clubs.submitGalleryLinkCreate.mutationOptions({
      onSuccess: async () => {
        setTargetId("");
        await queryClient.invalidateQueries({
          queryKey: orpc.clubs.listMyGalleryLinks.key(),
        });
      },
    })
  );

  /*
   * Unlinking is a submission like any other, so the link stays on the gallery -
   * and keeps appearing on the event's page - until a reviewer approves. The
   * button says "Sending…" rather than disappearing, because a link that
   * vanishes on click and reappears on the next reload is indistinguishable from
   * a bug.
   */
  const unlink = useMutation(
    orpc.clubs.submitGalleryLinkDelete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.clubs.listMyGalleryLinks.key(),
        });
      },
    })
  );

  return (
    <Panel>
      <PanelHead
        eyebrow="Related"
        note="Attach this gallery to one of your club's events or achievements, or to a school-wide one, so the photographs and the thing they are about are found together."
        title="Link to something else"
      />

      {linksQuery.error ? (
        <Notice tone="danger">
          The links on this gallery could not be loaded.
        </Notice>
      ) : null}

      {links.length === 0 ? (
        <EmptyState
          note="A gallery can stand on its own. Linking it to an event or an achievement puts the two side by side."
          title="Not linked to anything yet."
        />
      ) : (
        <RecordList label="Links from this gallery">
          {links.map((link) => (
            <RecordRow
              actions={
                <CmsButton
                  disabled={unlink.isPending}
                  onClick={() => {
                    unlink.mutate({ linkId: link.id });
                  }}
                  tone="danger"
                >
                  {unlink.isPending && unlink.variables?.linkId === link.id
                    ? "Sending…"
                    : "Unlink"}
                </CmsButton>
              }
              key={link.id}
              meta={
                <span>
                  {link.targetTitle
                    ? `Points at ${link.targetTitle}`
                    : "The record it pointed at no longer exists — unlink it to clear it"}
                </span>
              }
              name={`Linked to ${TARGET_LABEL[link.target] ?? link.target}`}
            />
          ))}
        </RecordList>
      )}

      <FieldStack>
        <Field
          hint="What kind of thing you are linking to."
          kind="select"
          label="Link to"
          onChange={(next) => {
            setTarget(next as LinkTarget);
            setTargetId("");
          }}
          options={TARGET_OPTIONS.map((option) => ({
            label: option.label,
            value: option.value,
          }))}
          value={target}
          wide
        />
        <Field
          hint={options.length === 0 ? EMPTY_LINK_HINT[target] : "Pick one."}
          kind="select"
          label="Which one"
          onChange={setTargetId}
          options={[{ label: "Choose…", value: "" }, ...options]}
          value={targetId}
          wide
        />

        {alreadyLinked ? (
          <Notice tone="warning">
            This gallery is already linked to that. Choose a different one.
          </Notice>
        ) : null}

        {submit.error ? (
          <Notice tone="danger">
            {submit.error instanceof Error
              ? submit.error.message
              : "The link could not be submitted."}
          </Notice>
        ) : null}

        {unlink.error ? (
          <Notice tone="danger">
            {unlink.error instanceof Error
              ? unlink.error.message
              : "That link could not be removed."}
          </Notice>
        ) : null}

        <div>
          <CmsButton
            disabled={!chosen || alreadyLinked || submit.isPending}
            onClick={() => {
              if (!chosen) {
                return;
              }
              submit.mutate({ galleryId, payload: { target, targetId } });
            }}
            tone="primary"
          >
            {submit.isPending ? "Sending…" : "Send link"}
          </CmsButton>
        </div>
      </FieldStack>
    </Panel>
  );
};

const GalleryDetailPage = () => {
  const { galleryId } = Route.useParams();
  const queryClient = useQueryClient();
  const query = useQuery(orpc.clubs.listMyGalleries.queryOptions());
  const gallery = (query.data ?? []).find((row) => row.id === galleryId);

  /*
   * One mutation for every per-image role change. Hoisted to the page rather than
   * given to each row because the busy state has to be shared: two rows must not
   * each believe they are the only thing in flight, or the administrator can fire
   * a second change at an image whose first change is still queued and find out
   * which one the reviewer saw.
   */
  const setRole = useMutation(
    orpc.clubs.submitGalleryItemUpdate.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.clubs.listMyGalleries.key(),
        });
      },
    })
  );

  if (query.isPending) {
    return (
      <ClubPage
        eyebrow="Club / Galleries"
        note="Loading this gallery…"
        title="Gallery"
      >
        <ClubPageLoading what="this gallery" />
      </ClubPage>
    );
  }

  if (!gallery) {
    return (
      <ClubPage
        eyebrow="Club / Galleries"
        note="This gallery is not available to you."
        title="Gallery"
      >
        <Panel>
          <EmptyState
            note="It may belong to another club, or it may have been removed."
            title="No such gallery."
          />
        </Panel>
      </ClubPage>
    );
  }

  const cover = gallery.items.find((item) => item.isCover) ?? null;
  const banner = gallery.items.find((item) => item.imageRole === "banner");
  const items: GalleryItem[] = gallery.items;

  return (
    <ClubPage
      eyebrow="Club / Galleries"
      note="Add images, say what each one is for, choose a cover, and say what this gallery is about. Everything on this page goes to a CMS editor before it appears on the website."
      title={gallery.title}
    >
      <Panel>
        <PanelHead
          eyebrow="In this gallery"
          note="An image's role decides what it is used for. The cover appears in listings, the banner across the top, and everything else in the gallery grid."
          title="Images"
        />
        {setRole.error ? (
          <Notice tone="danger">
            {setRole.error instanceof Error
              ? setRole.error.message
              : "That change could not be sent."}
          </Notice>
        ) : null}
        {items.length === 0 ? (
          <EmptyState
            note="Use the panels below to add images and choose a cover."
            title="No images yet."
          />
        ) : (
          <RecordList label="Gallery images">
            {items.map((item) => (
              <ImageRow
                busy={setRole.isPending}
                item={item}
                key={item.id}
                onSetRole={(itemId, role) => {
                  setRole.mutate({ itemId, payload: { imageRole: role } });
                }}
              />
            ))}
          </RecordList>
        )}
      </Panel>

      <CoverPanel
        cover={cover}
        galleryId={gallery.id}
        itemCount={items.length}
      />

      <UploadImagesPanel
        galleryId={gallery.id}
        hasBanner={Boolean(banner)}
        hasCover={Boolean(cover)}
        position={items.length}
      />

      <AlbumLinkPanel
        albumLabel={gallery.albumLabel}
        albumUrl={gallery.albumUrl}
        galleryId={gallery.id}
      />

      <GalleryLinksPanel galleryId={gallery.id} />
    </ClubPage>
  );
};

export const Route = createFileRoute(
  "/club-admin/photography/galleries/$galleryId"
)({
  head: () => ({
    meta: [
      { title: "Gallery — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: GalleryDetailPage,
});
