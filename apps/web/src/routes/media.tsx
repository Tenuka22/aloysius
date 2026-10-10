import { MediaPage } from "@aloysius/ui/components/pages/media-page";
import { blocksToMediaProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

const MediaContent = () => {
  const { data: media } = useSuspenseQuery(orpc.cms.getMedia.queryOptions());
  /*
   * No `club` input: /media is the site's general gallery, so it wants every
   * approved gallery rather than one club's. This is what the page was missing -
   * it rendered a hero and two lines of copy with no images at all, because
   * nothing on the route ever asked for a gallery.
   */
  const { data: galleries } = useSuspenseQuery(
    orpc.club.listApprovedGalleries.queryOptions({ input: {} })
  );
  const { data: session } = authClient.useSession();

  /* Always call the mapper so an unpublished page falls back to content/media.ts. */
  const cmsProps = blocksToMediaProps(media?.blocks ?? []);

  /*
   * One tile per gallery, built from its cover (falling back to its first photo,
   * since a gallery may be uploaded without a cover). Only the images already
   * uploaded by the CMS are shown - /media never invented stock.
   */
  const galleryItems = galleries.flatMap((gallery) => {
    const imageUrl = gallery.coverImageUrl ?? gallery.photos[0]?.imageUrl;
    if (!imageUrl) {
      return [];
    }
    return [
      {
        id: gallery.id,
        title: gallery.title,
        href: `/galleries/${gallery.slug}`,
        image: {
          src: imageUrl,
          alt: gallery.photos[0]?.altText ?? gallery.title,
        },
      },
    ];
  });

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

  return (
    <MediaPage
      {...cmsProps}
      extraNavItems={extraNavItems}
      galleries={galleryItems}
    />
  );
};

export const Route = createFileRoute("/media")({
  head: () =>
    pageHead({
      description:
        "Browse photographs and videos capturing life at St. Aloysius' College, Galle.",
      path: "/media",
      title: "Media | St. Aloysius' College, Galle",
    }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <MediaContent />
    </Suspense>
  ),
});
