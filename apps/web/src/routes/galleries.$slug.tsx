import type { GalleryPageItem } from "@aloysius/ui/components/pages/gallery-page";
import { GalleryPage } from "@aloysius/ui/components/pages/gallery-page";
import type { NavItem } from "@aloysius/ui/content/home";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * A single gallery, at `/galleries/:slug`, open to anyone.
 *
 * `:slug` is the *gallery's* own slug now, not a club's - the club model
 * supports any number of named, reviewed galleries per club, each with its
 * own address. There is one club seat (`photography`) serving galleries
 * today and a modest gallery count, so rather than add a dedicated
 * single-gallery endpoint, this fetches every approved gallery for that club
 * and finds the matching one client-side. There is no session check and no
 * additional gate: a gallery only reaches that list once a CMS reviewer has
 * approved it, so the approval *is* the access control.
 *
 * An unrecognised slug renders the same "not found" state a withdrawn or
 * never-published gallery would, rather than a server validation error.
 */

const CLUB = "photography" as const;
const CLUB_NAME = "Photography Club" as const;

const NOT_FOUND_SUMMARY =
  "This gallery is not available. It may never have been published, or it may have been withdrawn.";

const LINK_LABEL: Record<"news" | "event" | "achievement", string> = {
  achievement: "Achievement",
  event: "Event",
  news: "News",
};

const GalleryContent = () => {
  const { slug } = Route.useParams();
  const { data: session } = authClient.useSession();
  const { data: galleries } = useSuspenseQuery(
    orpc.club.listApprovedGalleries.queryOptions({ input: { club: CLUB } })
  );

  const extraNavItems: NavItem[] = (() => {
    if (!session?.user) {
      return [];
    }
    const items: NavItem[] = [];
    const { role } = session.user;
    if (role === "admin" || role === "cms") {
      items.push({ id: "cms", label: "CMS", href: "/cms" });
    }
    if (role === "admin") {
      items.push({ id: "admin", label: "Admin", href: "/admin" });
    }
    return items;
  })();

  const gallery = galleries.find((candidate) => candidate.slug === slug);

  if (!gallery) {
    return (
      <GalleryPage
        albumUrl={null}
        extraNavItems={extraNavItems}
        items={[]}
        kind="photo"
        summary={NOT_FOUND_SUMMARY}
        title="Gallery not found"
      />
    );
  }

  const items: GalleryPageItem[] = gallery.photos.map((photo) => ({
    alt: photo.altText,
    caption: photo.caption,
    id: photo.id,
    imageUrl: photo.imageUrl,
  }));

  const links = gallery.linkedContent
    ? [
        {
          href: null,
          targetLabel: LINK_LABEL[gallery.linkedContent.kind],
          targetTitle: gallery.linkedContent.title,
        },
      ]
    : undefined;

  return (
    <GalleryPage
      albumLabel={gallery.albumUrl ? "View the full album" : undefined}
      albumUrl={gallery.albumUrl}
      clubName={CLUB_NAME}
      extraNavItems={extraNavItems}
      items={items}
      kind="photo"
      links={links}
      summary={gallery.description}
      title={gallery.title}
    />
  );
};

export const Route = createFileRoute("/galleries/$slug")({
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <GalleryContent />
    </Suspense>
  ),
});
