import { HomePage } from "@aloysius/ui/components/home/home-page";
import { principalContent } from "@aloysius/ui/content/cms-to-principal";
import type {
  Achievement,
  GalleryItem,
  NewsCategory,
  NewsItem,
  Notice,
} from "@aloysius/ui/content/home";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

/**
 * `/` - the public homepage.
 *
 * The CMS-authored blocks and the Principal's Message are live queries here,
 * same as always. The top notice strip used to be a single hand-typed field
 * on the homepage's own "Notice Strip" block - it is the most-relevant real
 * announcement now (`cms.listAnnouncements`, pinned first then newest),
 * falling back to `DEFAULT_NOTICE` when there are none. News, achievements
 * and the gallery strip read the same real tables the rest of the site does
 * (`cms.listNewsPosts`, `cms.listAchievements`, `club.listApprovedGalleries`)
 * rather than the hand-written placeholders this page used to ship with.
 */

const CLUB = "photography" as const;

const NEWS_CATEGORY_LABELS: Record<string, NewsCategory> = {
  academic: "Academic",
  achievement: "Achievements",
  arts: "College News",
  general: "College News",
  sports: "Sports",
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
  const announcementsQuery = orpc.cms.listAnnouncements.queryOptions();
  const { data: announcements } = useSuspenseQuery(announcementsQuery);
  const { data: newsPosts } = useSuspenseQuery(
    orpc.cms.listNewsPosts.queryOptions()
  );
  const { data: achievements } = useSuspenseQuery(
    orpc.cms.listAchievements.queryOptions()
  );
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

  const [topAnnouncement] = announcements;
  const notice: Notice | undefined = topAnnouncement
    ? {
        id: topAnnouncement.id,
        text: topAnnouncement.title,
        href: "/notices",
        priority: topAnnouncement.severity === "urgent" ? "high" : "standard",
      }
    : undefined;

  const newsItems: NewsItem[] = newsPosts.map((post) => ({
    id: post.id,
    category:
      NEWS_CATEGORY_LABELS[post.category ?? "general"] ?? "College News",
    date: post.publishedAt ?? undefined,
    title: post.title,
    href: "/news",
    image: post.coverImageUrl
      ? { src: post.coverImageUrl, alt: post.title }
      : undefined,
  }));
  const [featuredNews, ...restNews] = newsItems;

  const achievementItems: Achievement[] = achievements.map((achievement) => ({
    id: achievement.id,
    category: achievement.category,
    title: achievement.title,
    detail: achievement.detail ?? "",
  }));

  const galleryItems: GalleryItem[] = galleries.flatMap((gallery) =>
    gallery.photos.map((photo) => ({
      id: photo.id,
      image: photo.imageUrl
        ? { src: photo.imageUrl, alt: photo.altText }
        : undefined,
      label: photo.altText || photo.caption,
      preferredRatio: 1.5,
    }))
  );

  return (
    <HomePage
      achievements={achievementItems}
      blocks={homepage?.blocks ?? undefined}
      extraNavItems={extraNavItems}
      featuredNews={featuredNews}
      galleryItems={galleryItems}
      news={restNews}
      notice={notice}
      principal={principalContent(principal?.blocks)}
    />
  );
};

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({
      description:
        "Official website of St. Aloysius' College, Galle, Sri Lanka - a Catholic boys' college founded in 1862. Admissions, academics, student life, news and the Old Boys' Association.",
      path: "/",
      title: "St. Aloysius' College, Galle",
    }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <HomeContent />
    </Suspense>
  ),
});
