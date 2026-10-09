import { GalleriesIndexPage } from "@aloysius/ui/components/pages/galleries-index-page";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * `/galleries` - every published gallery, in one place.
 *
 * Replaces the old hand-typed `/photography-club` page: a club's content is
 * its galleries, not a separate "club page" concept, so this is the index of
 * them - one card per approved gallery, linking to its own
 * `/galleries/<slug>`. Ungated for the same reason an individual gallery page
 * is: a row only exists here once a CMS reviewer has approved it.
 */

const CLUB = "photography" as const;

const GalleriesIndexContent = () => {
  const { data: galleries } = useSuspenseQuery(
    orpc.club.listApprovedGalleries.queryOptions({ input: { club: CLUB } })
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

  return (
    <GalleriesIndexPage
      extraNavItems={extraNavItems}
      galleries={galleries.map((gallery) => ({
        coverImageUrl:
          gallery.coverImageUrl ?? gallery.photos[0]?.imageUrl ?? null,
        description: gallery.description,
        id: gallery.id,
        photoCount: gallery.photos.length,
        slug: gallery.slug,
        title: gallery.title,
      }))}
    />
  );
};

export const Route = createFileRoute("/galleries/")({
  head: () => ({
    meta: [
      { title: "Galleries | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Published photo galleries from around the college, approved by the CMS team.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <GalleriesIndexContent />
    </Suspense>
  ),
});
