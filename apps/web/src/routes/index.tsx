import { HomePage } from "@aloysius/ui/components/home/home-page";
import { principalContent } from "@aloysius/ui/content/cms-to-principal";
import type {
  Achievement,
  GalleryItem,
  NewsItem,
} from "@aloysius/ui/content/home";
import { FEATURED_STORY, NEWS_STORIES } from "@aloysius/ui/content/news";
import { aspectRatios } from "@aloysius/ui/tokens/aspect-ratios";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * The crop each image is composed for, from the role its club gave it.
 *
 * The role exists precisely so this is not a guess: a cover is shot to sit in a
 * listing, a banner to span a page, an ordinary item to sit among its peers.
 * Reading the role back is what makes a club's own choice of role visible, and
 * it is the same three numbers `aspect-ratios.ts` already names.
 */
const ratioForRole = (role: string | null) => {
  if (role === "banner") {
    return aspectRatios.hero;
  }
  if (role === "cover") {
    return aspectRatios.mosaicTile;
  }
  return aspectRatios.galleryThumb;
};

const HomeContent = () => {
  const homepageQuery = orpc.cms.getHomepage.queryOptions();
  const { data: homepage } = useSuspenseQuery(homepageQuery);
  /*
   * The Principal's Message is a global block with its own editor screen, so it
   * is a second query rather than part of the homepage's blocks.
   */
  const principalQuery = orpc.cms.getPrincipal.queryOptions();
  const { data: principal } = useSuspenseQuery(principalQuery);
  const { data: announcements } = useSuspenseQuery(
    orpc.clubs.listAnnouncements.queryOptions({ input: { limit: 12 } })
  );
  const { data: achievements } = useSuspenseQuery(
    orpc.clubs.listAchievements.queryOptions({ input: { limit: 12 } })
  );
  const { data: media } = useSuspenseQuery(
    orpc.clubs.getFeaturedMedia.queryOptions({
      input: { clubSlug: "photography" },
    })
  );
  const { data: session } = authClient.useSession();

  const extraNavItems = (() => {
    if (!session?.user) {
      return [];
    }
    const items = [];
    const { role } = session.user;
    if (role === "club-admin") {
      items.push({
        id: "club",
        label: "Club portal",
        href: "/club-admin/photography",
      });
    }
    if (role === "admin" || role === "cms") {
      items.push({ id: "cms", label: "CMS", href: "/cms" });
    }
    if (role === "admin") {
      items.push({ id: "admin", label: "Admin", href: "/admin" });
    }
    return items;
  })();

  const dynamicNews: NewsItem[] = announcements.map((item) => ({
    id: item.id,
    category: item.scope === "club" ? "Events" : "College News",
    date: item.publishedAt?.toISOString(),
    title: item.title,
    href: "/news",
  }));
  const dynamicAchievements: Achievement[] = achievements.map((item) => ({
    id: item.id,
    category: item.category,
    title: item.title,
    detail: item.detail,
  }));

  /*
   * Club galleries, with their photographs.
   *
   * The `image` used to be dropped here, which is why the homepage gallery
   * rendered a column of dashed placeholders no matter how many photographs the
   * photography club had uploaded and had approved. The API hands back a
   * resolved `imageUrl` per item; without it there is nothing to point an `<img>`
   * at, and the alt text is already the caption so it is used as the label.
   */
  const dynamicGallery: GalleryItem[] = [...media.covers, ...media.trending]
    .filter(({ item }) => item.imageUrl !== null)
    .map(({ albumUrl, galleryTitle, item }) => {
      const label = item.altText || item.caption || galleryTitle;
      return {
        id: item.id,
        label,
        ...(albumUrl ? { href: albumUrl, hrefLabel: "Full album" } : {}),
        ...(item.imageUrl
          ? {
              image: {
                alt: item.altText,
                src: item.imageUrl,
                aspectRatio: ratioForRole(item.imageRole),
              },
            }
          : {}),
        preferredRatio: ratioForRole(item.imageRole),
      };
    });

  return (
    <HomePage
      blocks={homepage?.blocks ?? undefined}
      principal={principalContent(principal?.blocks)}
      featuredNews={dynamicNews[0] ?? FEATURED_STORY}
      news={dynamicNews.length > 0 ? dynamicNews : NEWS_STORIES}
      achievements={dynamicAchievements}
      galleryItems={dynamicGallery.length > 0 ? dynamicGallery : undefined}
      extraNavItems={extraNavItems}
    />
  );
};

export const Route = createFileRoute("/")({
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <HomeContent />
    </Suspense>
  ),
});
