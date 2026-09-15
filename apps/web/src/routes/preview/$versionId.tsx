import { HomePage } from "@aloysius/ui/components/home/home-page";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orpc } from "@/utils/orpc";

const news = [
  {
    id: "news-1",
    category: "Academic" as const,
    title: "Advanced Level results announced for the 2025 cohort",
    href: "/news",
  },
  {
    id: "news-2",
    category: "Sports" as const,
    title: "First XI cricket team retains the Southern Province title",
    href: "/news",
  },
  {
    id: "news-3",
    category: "Events" as const,
    title: "Annual prize giving held in the college main hall",
    href: "/news",
  },
  {
    id: "news-4",
    category: "Announcements" as const,
    title: "Circular: term dates and school calendar",
    href: "/news",
  },
];

const featuredNews = {
  id: "featured",
  category: "College News" as const,
  title: "Aloysians mark another year of service, scholarship and sport",
  href: "/news",
};

const PreviewPage = () => {
  const { versionId } = Route.useParams();
  const versionQuery = orpc.cms.getHomepageVersion.queryOptions({
    input: { versionId },
  });
  const { data: version } = useSuspenseQuery(versionQuery);

  return (
    <HomePage
      blocks={version?.blocks ?? undefined}
      featuredNews={featuredNews}
      news={news}
    />
  );
};

export const Route = createFileRoute("/preview/$versionId")({
  head: () => ({
    meta: [
      { title: "Preview — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PreviewPage,
});
