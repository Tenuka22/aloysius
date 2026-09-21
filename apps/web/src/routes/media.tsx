import { MediaPage } from "@aloysius/ui/components/pages/media-page";
import { blocksToMediaProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

const MediaContent = () => {
  const mediaQuery = orpc.cms.getMedia.queryOptions();
  const { data: media } = useSuspenseQuery(mediaQuery);
  const { data: session } = authClient.useSession();

  const cmsProps = media?.blocks ? blocksToMediaProps(media.blocks) : {};

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

  return <MediaPage {...cmsProps} extraNavItems={extraNavItems} />;
};

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Browse photographs and videos capturing life at St. Aloysius' College, Galle.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <MediaContent />
    </Suspense>
  ),
});
