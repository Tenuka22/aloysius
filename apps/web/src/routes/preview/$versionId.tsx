import { HomePage } from "@aloysius/ui/components/home/home-page";
import { FEATURED_STORY, NEWS_STORIES } from "@aloysius/ui/content/news";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orpc } from "@/utils/orpc";

const PreviewPage = () => {
  const { versionId } = Route.useParams();
  const versionQuery = orpc.cms.getHomepageVersion.queryOptions({
    input: { versionId },
  });
  const { data: version } = useSuspenseQuery(versionQuery);

  return (
    <HomePage
      blocks={version?.blocks ?? undefined}
      featuredNews={FEATURED_STORY}
      news={NEWS_STORIES}
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
