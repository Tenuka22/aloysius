import { NewsPage } from "@aloysius/ui/components/pages/news-page";
import { blocksToNewsProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

const NewsContent = () => {
  const { data: news } = useSuspenseQuery(orpc.cms.getNews.queryOptions());
  /*
   * The stories themselves, which are rows rather than blocks. The route read
   * only the header blocks and left the archive to a hardcoded placeholder, so
   * every story the CMS holds was invisible on the public page.
   */
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
    body: post.body,
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
    <NewsPage {...cmsProps} extraNavItems={extraNavItems} stories={stories} />
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
