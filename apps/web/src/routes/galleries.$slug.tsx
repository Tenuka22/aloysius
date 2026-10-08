import type { GalleryPageItem } from "@aloysius/ui/components/pages/gallery-page";
import { GalleryPage } from "@aloysius/ui/components/pages/gallery-page";
import type { NavItem } from "@aloysius/ui/content/home";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * A single club's gallery, at `/galleries/:slug`, open to anyone.
 *
 * The flat club model has no standalone `gallery` entity any more - a club
 * has exactly one gallery, its own stream of approved photos, addressed by
 * the club's own slug. There is no session check and no additional gate: a
 * photo only reaches this query once a CMS reviewer has approved it, so the
 * approval *is* the access control.
 *
 * `:slug` is validated against the one club seat the flat model currently
 * serves rather than passed straight to the query - an unrecognised slug
 * renders the same "not found" state a withdrawn or never-published gallery
 * would, rather than a server validation error.
 */

const CLUB_SLUGS = ["photography"] as const;
type ClubSlug = (typeof CLUB_SLUGS)[number];

const CLUB_NAME: Record<ClubSlug, string> = {
  photography: "Photography Club",
};

const isClubSlug = (slug: string): slug is ClubSlug =>
  (CLUB_SLUGS as readonly string[]).includes(slug);

const ClubGallery = ({
  club,
  extraNavItems,
}: {
  club: ClubSlug;
  extraNavItems: readonly NavItem[];
}) => {
  const { data: photos } = useSuspenseQuery(
    orpc.club.listApprovedPhotos.queryOptions({ input: { club } })
  );

  const items: GalleryPageItem[] = photos.map((photo) => ({
    alt: photo.altText,
    caption: photo.caption,
    id: photo.id,
    imageUrl: photo.imageUrl,
  }));

  const albumUrl = photos.find((photo) => photo.albumUrl)?.albumUrl ?? null;

  return (
    <GalleryPage
      albumLabel={albumUrl ? "View the full album" : undefined}
      albumUrl={albumUrl}
      clubName={CLUB_NAME[club]}
      extraNavItems={extraNavItems}
      items={items}
      kind="photo"
      summary="Photographs submitted by the club and approved for the public gallery."
      title={`${CLUB_NAME[club]} Gallery`}
    />
  );
};

const GalleryContent = () => {
  const { slug } = Route.useParams();
  const { data: session } = authClient.useSession();

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

  if (!isClubSlug(slug)) {
    return (
      <GalleryPage
        albumUrl={null}
        extraNavItems={extraNavItems}
        items={[]}
        kind="photo"
        summary="This gallery is not available. It may never have been published, or it may have been withdrawn."
        title="Gallery not found"
      />
    );
  }

  return <ClubGallery club={slug} extraNavItems={extraNavItems} />;
};

export const Route = createFileRoute("/galleries/$slug")({
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <GalleryContent />
    </Suspense>
  ),
});
