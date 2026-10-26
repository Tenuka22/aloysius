import type { GalleryPageItem } from "@aloysius/ui/components/pages/gallery-page";
import { GalleryPage } from "@aloysius/ui/components/pages/gallery-page";
import type { NavItem } from "@aloysius/ui/content/home";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { ORGANIZATION_ID, WEBSITE_ID, absoluteUrl, pageHead } from "@/lib/seo";
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
 * `:slug` not found in the approved list is a real 404, not a 200 "not
 * found" screen - see the loader.
 */

const CLUB = "photography" as const;

const NOT_FOUND_SUMMARY =
  "This gallery is not available. It may never have been published, or it may have been withdrawn.";

const LINK_LABEL: Record<"news" | "event" | "achievement", string> = {
  achievement: "Achievement",
  event: "Event",
  news: "News",
};

/**
 * Where each kind of linked content actually lives.
 *
 * Events, news and achievements have no detail route of their own, so they are
 * named in the link rather than pretended to be reachable.
 */
const LINK_HREF: Record<"news" | "event" | "achievement", string | null> = {
  event: null,
  achievement: null,
  news: null,
};

const linkHrefFor = (
  kind: "news" | "event" | "achievement",
  id: string | null
): string | null => {
  const base = LINK_HREF[kind];
  if (!base || !id) {
    return null;
  }
  return `${base}${id}`;
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
          href: linkHrefFor(
            gallery.linkedContent.kind,
            gallery.linkedContent.id
          ),
          targetLabel: LINK_LABEL[gallery.linkedContent.kind],
          targetTitle: gallery.linkedContent.title,
        },
      ]
    : undefined;

  return (
    <GalleryPage
      albumLabel={gallery.albumUrl ? "View the full album" : undefined}
      albumUrl={gallery.albumUrl}
      clubName={gallery.clubName}
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
  loader: async ({ context, params }) => {
    const galleries = await context.queryClient.ensureQueryData(
      orpc.club.listApprovedGalleries.queryOptions({ input: { club: CLUB } })
    );
    const found = galleries.find((candidate) => candidate.slug === params.slug);
    if (!found) {
      throw notFound();
    }
    return {
      description: found.description,
      imageUrl: found.coverImageUrl ?? found.photos[0]?.imageUrl ?? null,
      publishedAt: found.publishedAt,
      title: found.title,
    };
  },
  head: ({ loaderData, params }) => {
    const path = `/galleries/${params.slug}`;
    if (!loaderData) {
      return {};
    }
    const description =
      loaderData.description?.trim() ||
      `${loaderData.title} - a photo gallery from St. Aloysius' College, Galle.`;
    const image = loaderData.imageUrl
      ? absoluteUrl(loaderData.imageUrl)
      : undefined;

    return pageHead({
      crumbs: [
        { name: "Galleries", path: "/galleries" },
        { name: loaderData.title, path },
      ],
      description,
      image,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          datePublished: loaderData.publishedAt ?? undefined,
          description,
          image,
          isPartOf: { "@id": WEBSITE_ID },
          name: loaderData.title,
          publisher: { "@id": ORGANIZATION_ID },
          url: absoluteUrl(path),
        },
      ],
      path,
      title: `${loaderData.title} | Galleries | St. Aloysius' College, Galle`,
    });
  },
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <GalleryContent />
    </Suspense>
  ),
});
