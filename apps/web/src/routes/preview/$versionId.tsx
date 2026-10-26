import { HomePage } from "@aloysius/ui/components/home/home-page";
import { FEATURED_STORY, NEWS_STORIES } from "@aloysius/ui/content/news";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { privateHead } from "@/lib/seo";
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
  /*
   * An unknown version id used to fall through to the stock homepage with a
   * 200 - a soft 404 that duplicated `/`. It is a real 404 now.
   */
  loader: async ({ context, params }) => {
    const version = await context.queryClient.ensureQueryData(
      orpc.cms.getHomepageVersion.queryOptions({
        input: { versionId: params.versionId },
      })
    );
    if (!version) {
      throw notFound();
    }
  },
  head: () => privateHead("Preview | St. Aloysius' College"),
  component: PreviewPage,
});
