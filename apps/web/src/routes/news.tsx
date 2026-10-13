import { NewsPage } from "@aloysius/ui/components/pages/news-page";
import { blocksToNewsProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

/**
 * `/news` - the public archive of published news posts.
 *
 * The stories themselves are rows (`cms.listNewsPosts`), not CMS blocks, so they
 * are a second query rather than part of `blocksToNewsProps`. An earlier version
 * of this route read only the header blocks and left the archive to a hardcoded
 * placeholder, which meant every story the CMS held was invisible on the public
 * page.
 *
 * `eyebrow` is resolved by the mapper and deliberately not passed through: the
 * page has no eyebrow above its `h1`. `body` is not passed either - the page
 * shows a summary and a photograph, and there is no `/news/:slug` route on which
 * the full text could be read.
 */

const NewsContent = () => {
  const { data: news } = useSuspenseQuery(orpc.cms.getNews.queryOptions());
  const { data: posts } = useSuspenseQuery(
    orpc.cms.listNewsPosts.queryOptions()
  );
  const { data: session } = authClient.useSession();

  /* Always call the mapper so an unpublished page falls back to content/news.ts. */
  const cmsProps = blocksToNewsProps(news?.blocks ?? []);

  const stories = posts.map((post) => ({
    id: post.id,
    title: post.title,
    summary: post.summary,
    category: post.category,
    publishedAt: post.publishedAt,
    coverImageUrl: post.coverImageUrl,
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
      feedHeading={cmsProps.feedHeading}
      heading={cmsProps.heading}
      extraNavItems={extraNavItems}
      heroImage={cmsProps.heroImage}
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
