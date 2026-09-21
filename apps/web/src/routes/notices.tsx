import { NoticesPage } from "@aloysius/ui/components/pages/notices-page";
import { blocksToNoticesProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

const NoticesContent = () => {
  const noticesQuery = orpc.cms.getNotices.queryOptions();
  const { data: notices } = useSuspenseQuery(noticesQuery);
  const { data: session } = authClient.useSession();

  const cmsProps = notices?.blocks ? blocksToNoticesProps(notices.blocks) : {};

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

  return <NoticesPage {...cmsProps} extraNavItems={extraNavItems} />;
};

export const Route = createFileRoute("/notices")({
  head: () => ({
    meta: [
      { title: "Notices | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Official notices, circulars and announcements from the college administration.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <NoticesContent />
    </Suspense>
  ),
});
