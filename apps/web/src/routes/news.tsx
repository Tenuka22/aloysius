import { NewsPage } from "@aloysius/ui/components/news/news-page";
import { blocksToNewsProps } from "@aloysius/ui/content/cms-to-pages";
import type { NewsCategory } from "@aloysius/ui/content/home";
import type { CollegeEvent, NewsStory } from "@aloysius/ui/content/news";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

/**
 * `/news` - the public archive of published news posts, with the college
 * calendar beneath it.
 *
 * The stories themselves are rows (`cms.listNewsPosts`), not CMS blocks, so they
 * are a second query rather than part of `blocksToNewsProps`. The newest post
 * leads the page as the featured story and the rest fill the archive grid;
 * upcoming dates come from `cms.listEvents`.
 *
 * There is no `/news/:slug` page yet, so stories carry no `href` and render as
 * plain cards - nothing links to a page that does not exist.
 */

const UPCOMING_EVENT_LIMIT = 5;

const KNOWN_CATEGORIES: readonly NewsCategory[] = [
  "Academic",
  "Sports",
  "Events",
  "Announcements",
  "Achievements",
  "College News",
];

/** A post's free-text category, matched case-insensitively to a known one. */
const toCategory = (value: string | null): NewsCategory =>
  KNOWN_CATEGORIES.find(
    (category) => category.toLowerCase() === value?.trim().toLowerCase()
  ) ?? "College News";

const NewsContent = () => {
  const { data: news } = useSuspenseQuery(orpc.cms.getNews.queryOptions());
  const { data: posts } = useSuspenseQuery(
    orpc.cms.listNewsPosts.queryOptions()
  );
  const { data: events } = useSuspenseQuery(orpc.cms.listEvents.queryOptions());
  const { data: session } = authClient.useSession();
  // Read once per mount: a lazy initializer is the one safe place for `Date.now()`.
  const [now, setNow] = useState(() => Date.now());
  void setNow;

  /* Always call the mapper so an unpublished page falls back to content/news.ts. */
  const cmsProps = blocksToNewsProps(news?.blocks ?? []);

  const allStories: NewsStory[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    category: toCategory(post.category),
    date: post.publishedAt ?? undefined,
    href: "",
    excerpt: post.summary ?? undefined,
    image: post.coverImageUrl
      ? { src: post.coverImageUrl, alt: post.title }
      : undefined,
  }));
  const [featured, ...stories] = allStories;

  const upcoming: CollegeEvent[] = events
    .filter((event) => new Date(event.startsAt).getTime() >= now)
    .toSorted((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, UPCOMING_EVENT_LIMIT)
    .map((event) => ({
      id: event.id,
      title: event.title,
      date: event.startsAt,
      venue: event.location ?? undefined,
    }));

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
    <NewsPage
      events={upcoming}
      extraNavItems={extraNavItems}
      featured={featured ?? null}
      heading={cmsProps.heading}
      stories={stories}
      tagline={cmsProps.tagline}
    />
  );
};

export const Route = createFileRoute("/news")({
  head: () =>
    pageHead({
      description:
        "Stay informed with the latest news, events and achievements from St. Aloysius' College, Galle.",
      path: "/news",
      title: "News & Events | St. Aloysius' College, Galle",
    }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <NewsContent />
    </Suspense>
  ),
});
