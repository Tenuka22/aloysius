import { MediaPage } from "@aloysius/ui/components/media/media-page";
import {
  blocksToContactProps,
  blocksToMediaProps,
} from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

/**
 * `/media` - Gallery & Media: the album mosaic and the "College on Film"
 * videos.
 *
 * Albums are the approved galleries (`club.listApprovedGalleries`, with no
 * `club` input: /media is the site's general gallery, so it wants every
 * approved gallery rather than one club's). The YouTube channel link is the
 * one set on the Contact page, so it is written once.
 */

const MediaContent = () => {
  const { data: media } = useSuspenseQuery(orpc.cms.getMedia.queryOptions());
  const { data: galleries } = useSuspenseQuery(
    orpc.club.listApprovedGalleries.queryOptions({ input: {} })
  );
  const { data: contact } = useSuspenseQuery(
    orpc.cms.getContact.queryOptions()
  );
  const { data: session } = authClient.useSession();

  /* Always call the mapper so an unpublished page falls back to content/media.ts. */
  const cmsProps = blocksToMediaProps(media?.blocks ?? []);
  const channelUrl = blocksToContactProps(contact?.blocks ?? []).youtubeUrl;

  /*
   * One tile per gallery, built from its cover (falling back to its first photo,
   * since a gallery may be uploaded without a cover). Only the images already
   * uploaded by the CMS are shown - /media never invents stock.
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
    if (role === "admin") {
      items.push({ id: "admin", label: "Admin", href: "/admin" });
    }
    return items;
  })();

  return (
    <MediaPage
      channelUrl={channelUrl || undefined}
      extraNavItems={extraNavItems}
      galleries={galleryItems}
      heading={cmsProps.heading}
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
