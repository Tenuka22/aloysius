import { NewsPage } from "@aloysius/ui/components/pages/news-page";
import { blocksToNewsProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

const NewsContent = () => {
  const newsQuery = orpc.cms.getNews.queryOptions();
  const { data: news } = useSuspenseQuery(newsQuery);
  const { data: session } = authClient.useSession();

  const cmsProps = news?.blocks ? blocksToNewsProps(news.blocks) : {};

  const extraNavItems = (() => {
    if (!session?.user) {
      return [];
    }
    const items = [];
    const { role } = session.user;
    if (role === "admin" || role === "cms") {
      items.push({ id: "cms", label: "CMS", href: "/cms" });
    }
    return items;
  })();

  return <NewsPage {...cmsProps} extraNavItems={extraNavItems} />;
};

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News & Events | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Stay informed with the latest news, events and achievements from St. Aloysius' College, Galle.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <NewsContent />
    </Suspense>
  ),
});
