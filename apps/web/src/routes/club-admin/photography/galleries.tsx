import {
  CmsButton,
  CmsLink,
  EmptyState,
  Field,
  Notice,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { MediaThumb } from "@aloysius/ui/components/primitives/media-frame";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Outlet,
  useMatch,
  useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";

import { SLUG_PATTERN, slugify } from "@/components/club/format";
import {
  ClubPage,
  ClubPageLoading,
  FieldStack,
} from "@/components/club/page-parts";
import { orpc } from "@/utils/orpc";

/**
 * The club's galleries, and the form that starts a new one.
 *
 * Creating a gallery is a two-field form rather than a wizard, because the only
 * thing the server needs to accept one is a slug and a title - images arrive
 * afterwards on the gallery's own screen, where they can be captioned, given a
 * role, and given a cover. A wizard would ask for images before the thing they
 * belong to exists, and every abandoned step would leave an orphaned upload
 * behind.
 *
 * The list shows each gallery's cover and what it is about. Both are the two
 * things most likely to be missing on a gallery that looks otherwise finished,
 * and both are only fixable on the gallery's own screen - so a "No cover" pill
 * here is a to-do, not a description.
 */

const MAX_SUMMARY = 500;

const NewGalleryPanel = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");

  const slug = slugify(title);
  const slugValid = SLUG_PATTERN.test(slug);
  const summaryTooLong = summary.trim().length > MAX_SUMMARY;
  const canSubmit = title.trim().length > 0 && slugValid && !summaryTooLong;

  const create = useMutation(
    orpc.clubs.submitGalleryCreate.mutationOptions({
      onSuccess: async () => {
        setTitle("");
        setSummary("");
        await queryClient.invalidateQueries({
          queryKey: orpc.clubs.listMyGalleries.key(),
        });
      },
    })
  );

  return (
    <Panel accent>
      <PanelHead
        note="A gallery is a set of photographs. Once it is approved you can add up to five images at a time, and link an album you host elsewhere."
        title="New gallery"
      />

      {create.isSuccess ? (
        <Notice tone="success">
          Your gallery is with a CMS editor. Add its images once it has been
          approved.
        </Notice>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          create.reset();
          create.mutate({
            payload: {
              id: crypto.randomUUID(),
              kind: "photo",
              slug,
              summary: summary.trim() || null,
              // Every kind needs its detail row; a photo gallery's is all
              // optional, so an empty object is the whole thing.
              photo: {},
              title: title.trim(),
            },
          });
        }}
      >
        <FieldStack>
          <Field
            hint={
              title.trim().length === 0
                ? "Give the gallery a title to set its address."
                : `Address: /clubs/${slug}`
            }
            label="Title"
            onChange={setTitle}
            value={title}
            wide
          />
          <Field
            hint={
              summaryTooLong
                ? `That is longer than ${MAX_SUMMARY} characters.`
                : "One or two sentences. This is what a visitor reads under the title."
            }
            kind="textarea"
            label="Summary"
            onChange={setSummary}
            value={summary}
            wide
          />
          {!slugValid && title.trim().length > 0 ? (
            <Notice tone="warning">
              That title has no letters or numbers in it, so it cannot make a
              web address. Try one with a word in it.
            </Notice>
          ) : null}
          {create.error ? (
            <Notice tone="danger">
              {create.error instanceof Error
                ? create.error.message
                : "The gallery could not be submitted."}
            </Notice>
          ) : null}
          <div>
            <CmsButton
              disabled={!canSubmit || create.isPending}
              tone="primary"
              type="submit"
            >
              {create.isPending ? "Sending…" : "Submit gallery"}
            </CmsButton>
          </div>
        </FieldStack>
      </form>
    </Panel>
  );
};

interface GallerySummary {
  id: string;
  title: string;
  summary: string | null;
  albumUrl: string | null;
  status: "archived" | "published";
  items: readonly unknown[];
  coverItem: { imageUrl: string | null } | null;
  links: readonly { id: string; targetTitle: string | null }[];
}

/**
 * What a gallery is, in one line under its title.
 *
 * Three facts a club administrator needs before clicking into a gallery, because
 * all three are the reason a gallery is not finished: how many photographs it
 * has, whether anyone can be sent to the full album off-site, and what it is
 * about. A list that only shows a count left "is this the one?" unanswerable
 * without opening every gallery.
 */
const describeGallery = (gallery: {
  albumUrl: string | null;
  summary: string | null;
  links: readonly { targetTitle: string | null }[];
}) => {
  const parts = [
    gallery.albumUrl ? "Full album off-site" : "No off-site album",
  ];

  if (gallery.links.length === 0) {
    parts.push("Not linked to anything");
  } else {
    const named = gallery.links
      .map((link) => link.targetTitle)
      .filter((title): title is string => title !== null);
    parts.push(
      named.length > 0
        ? `About ${named.join(", ")}`
        : `${gallery.links.length} broken link${gallery.links.length === 1 ? "" : "s"}`
    );
  }

  return gallery.summary
    ? `${gallery.summary} — ${parts.join(" · ")}`
    : parts.join(" · ");
};

const GalleryList = ({
  galleries,
  onOpen,
}: {
  galleries: readonly GallerySummary[];
  onOpen: (galleryId: string) => void;
}) => {
  if (galleries.length === 0) {
    return (
      <EmptyState
        note="Create your first gallery below. A CMS editor reviews it before it appears on the site."
        title="No galleries yet."
      />
    );
  }

  return (
    <RecordList label="Galleries">
      {galleries.map((gallery) => {
        const needsImages = gallery.items.length === 0;
        const isLive = gallery.status === "published";
        const hasCover = Boolean(gallery.coverItem);

        return (
          <RecordRow
            actions={
              <>
                <Pill tone={isLive ? "positive" : "neutral"}>
                  {isLive ? "Live" : "Archived"}
                </Pill>
                {hasCover ? null : <Pill tone="warning">No cover</Pill>}
                <CmsLink
                  href={`/club-admin/photography/galleries/${gallery.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    onOpen(gallery.id);
                  }}
                  tone="quiet"
                >
                  {needsImages ? "Add images" : "Manage"}
                </CmsLink>
              </>
            }
            key={gallery.id}
            meta={
              <>
                <MediaThumb src={gallery.coverItem?.imageUrl ?? null} />
                <span>
                  {gallery.items.length}{" "}
                  {gallery.items.length === 1 ? "image" : "images"}
                </span>
                <span aria-hidden="true">·</span>
                <span>{describeGallery(gallery)}</span>
              </>
            }
            name={gallery.title}
          />
        );
      })}
    </RecordList>
  );
};

const GalleriesPage = () => {
  const navigate = useNavigate();
  const query = useQuery(orpc.clubs.listMyGalleries.queryOptions());
  const galleries = query.data ?? [];
  /*
   * `galleries.$galleryId` is a child of this route, so a gallery's own screen
   * draws only where the child slot is drawn. Without yielding here the list
   * would paint over it and the gallery would never be reachable from its own
   * URL — so the child owns the viewport for as long as its URL is open, and
   * this list returns untouched when the URL leaves it.
   */
  const isGalleryDetail = Boolean(
    useMatch({
      from: "/club-admin/photography/galleries/$galleryId",
      shouldThrow: false,
    })
  );

  if (isGalleryDetail) {
    return <Outlet />;
  }

  const body = (() => {
    if (query.isPending) {
      return <ClubPageLoading what="your galleries" />;
    }
    if (query.error) {
      return (
        <Notice tone="danger">
          Your galleries could not be loaded. Reload the page to try again.
        </Notice>
      );
    }
    return (
      <GalleryList
        galleries={galleries}
        onOpen={(galleryId) => {
          navigate({
            to: "/club-admin/photography/galleries/$galleryId",
            params: { galleryId },
          });
        }}
      />
    );
  })();

  return (
    <ClubPage
      eyebrow="Club / Galleries"
      note="Each gallery is a set of photographs with a cover and, usually, something it is about. Open one to add images, choose its cover, and link it to an event or achievement. Everything is reviewed before it appears on the website."
      title="Galleries"
    >
      <Panel>
        <PanelHead
          eyebrow="Live"
          note="These are on the website. A gallery without a cover still shows — it just has no picture in listings."
          title="Your galleries"
        />
        {body}
      </Panel>

      <NewGalleryPanel />
    </ClubPage>
  );
};

export const Route = createFileRoute("/club-admin/photography/galleries")({
  head: () => ({
    meta: [
      { title: "Galleries — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: GalleriesPage,
});
