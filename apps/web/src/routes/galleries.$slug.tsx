import { GalleryPage } from "@aloysius/ui/components/pages/gallery-page";
import type {
  GalleryPageItem,
  GalleryPageLink,
} from "@aloysius/ui/components/pages/gallery-page";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * A single gallery, at `/galleries/:slug`, open to anyone.
 *
 * This is the "open any gallery" surface. There is no session check and no club
 * check on the route or the query behind it, and that is deliberate rather than
 * an oversight: a gallery only has a row to find once a CMS reviewer has
 * approved it, so the approval *is* the access control. Adding a gate here would
 * not hide anything a visitor should not see - it would only stop a parent
 * browsing the photographs from their own kitchen.
 *
 * The route is `/galleries/:slug` rather than `/clubs/:club/galleries/:slug`
 * because a gallery is global content with a curator, not club-owned data. A
 * gallery with no club attached - a teacher's art show, say - still needs an
 * address, and a club-scoped path would have to invent a club for it.
 */

const GALLERY_TARGET_HREF: Record<string, (id: string) => string> = {
  clubEvent: (id) => `/events#event-${id}`,
  event: (id) => `/events#event-${id}`,
  achievement: (id) => `/events#achievement-${id}`,
  clubAchievement: (id) => `/events#achievement-${id}`,
};

const GALLERY_TARGET_WORD: Record<string, string> = {
  clubEvent: "club event",
  event: "school event",
  achievement: "school achievement",
  clubAchievement: "club achievement",
  person: "person",
  exhibition: "exhibition",
};

/**
 * Which detail fields are worth showing for each kind of gallery.
 *
 * A table rather than a chain of ternaries: three near-identical branches in one
 * expression is where a field gets added to two of them and missed in the third.
 */
const DETAIL_FIELDS: Record<string, readonly { key: string; label: string }[]> =
  {
    photo: [
      { key: "shotOn", label: "Shot on" },
      { key: "location", label: "Location" },
      { key: "camera", label: "Camera" },
      { key: "lens", label: "Lens" },
      { key: "exposure", label: "Exposure" },
    ],
    art: [
      { key: "medium", label: "Medium" },
      { key: "artist", label: "Artist" },
      { key: "venue", label: "Venue" },
      { key: "year", label: "Year" },
    ],
    digital: [
      { key: "format", label: "Format" },
      { key: "venue", label: "Venue" },
    ],
  };

/**
 * Turn a kind-specific detail row into the short labelled lines shown under the
 * title.
 *
 * Read defensively on purpose: the shape is a merged table row, and a gallery
 * whose detail row is missing should render a page with fewer facts, not throw.
 * A photograph with no date and no location is still a photograph.
 */
const describeDetails = (kind: string, details: Record<string, unknown>) => {
  const asText = (key: string) => {
    const value = details[key];
    return typeof value === "string" && value.trim() !== ""
      ? value.trim()
      : null;
  };
  const asNumber = (key: string) => {
    const value = details[key];
    return typeof value === "number" ? String(value) : null;
  };

  return (DETAIL_FIELDS[kind] ?? []).flatMap(({ key, label }) => {
    const value =
      key === "year" || key === "durationSeconds" ? asNumber(key) : asText(key);
    return value === null ? [] : [{ label, value }];
  });
};

const GalleryContent = () => {
  const { slug } = Route.useParams();
  const { data: gallery } = useSuspenseQuery(
    orpc.clubs.getGallery.queryOptions({ input: { slug } })
  );
  const { data: session } = authClient.useSession();

  const extraNavItems = (() => {
    if (!session?.user) {
      return [];
    }
    const items = [];
    const { role } = session.user;
    if (role === "admin" || role === "cms") {
      items.push({ id: "cms", label: "CMS", href: "/cms" });
    }
    if (role === "admin") {
      items.push({ id: "admin", label: "Admin", href: "/admin" });
    }
    return items;
  })();

  if (!gallery) {
    /*
     * The query resolved and found nothing: either the slug does not exist, or
     * the gallery exists but is archived or never approved. Those are
     * deliberately indistinguishable to a visitor - saying "this gallery is
     * waiting for review" would leak the review queue, and saying "this gallery
     * was withdrawn" would tell a club its withdrawn album is still findable by
     * anyone who kept the link.
     */
    return (
      <GalleryPage
        albumUrl={null}
        extraNavItems={extraNavItems}
        items={[]}
        kind="photo"
        links={[]}
        summary="This gallery is not available. It may never have been published, or it may have been withdrawn."
        title="Gallery not found"
      />
    );
  }

  const items: GalleryPageItem[] = gallery.items.map((item) => ({
    id: item.id,
    alt: item.altText,
    caption: item.caption,
    imageUrl: item.imageUrl,
  }));

  /*
   * A link to a target the site cannot route to is rendered as plain text rather
   * than as a link to nowhere. `linkTargetTitle` returns null for a target that
   * has been deleted, and that row is kept precisely so it can be shown as
   * missing and then cleared - not so it can become a dead hyperlink. A target
   * that resolves to a title but has no public route (a `person`, say) is
   * likewise shown as text rather than linked.
   */
  const links: GalleryPageLink[] = gallery.links
    .map((link) => {
      const build = GALLERY_TARGET_HREF[link.target];
      const canLink = build !== undefined && link.targetTitle !== null;
      return {
        targetLabel: GALLERY_TARGET_WORD[link.target] ?? link.target,
        targetTitle: link.targetTitle,
        href: canLink ? build(link.targetId) : null,
      };
    })
    .filter((link) => link.targetTitle !== null);

  return (
    <GalleryPage
      albumLabel={gallery.albumLabel}
      albumUrl={gallery.albumUrl}
      clubName={gallery.clubName}
      details={describeDetails(gallery.kind, gallery.details)}
      extraNavItems={extraNavItems}
      items={items}
      kind={gallery.kind}
      links={links}
      summary={gallery.summary}
      title={gallery.title}
    />
  );
};

export const Route = createFileRoute("/galleries/$slug")({
  /**
   * `loader` before `head`, not the other way round: TanStack infers the route's
   * types from the first property's position, and `head` reading loader data
   * before the loader is declared loses them.
   */
  loader: ({ params }) => ({ slug: params.slug }),
  head: ({ params }) => ({
    meta: [
      { title: `Gallery — St. Aloysius' College, Galle` },
      {
        name: "description",
        content: `A gallery from St. Aloysius' College, Galle (${params.slug}).`,
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <GalleryContent />
    </Suspense>
  ),
});
