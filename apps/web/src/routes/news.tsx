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
    if (role === "admin" || role === "teacher") {
      items.push({
        id: "students-admin",
        label: "Manage Students",
        href: "/student-officer",
      });
    }
    if (role === "admin" || role === "teacher") {
      items.push({ id: "teachers-admin", label: "Staff", href: "/teacher" });
    }
    if (role === "admin") {
      items.push({ id: "admin", label: "Admin", href: "/admin" });
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
