import { NoticesPage } from "@aloysius/ui/components/pages/notices-page";
import { blocksToNoticesProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

const NoticesContent = () => {
  const { data: notices } = useSuspenseQuery(
    orpc.cms.getNotices.queryOptions()
  );
  /*
   * The announcements themselves, which are rows rather than blocks - the page
   * was reading only the header blocks and had nothing to list underneath.
   */
  const { data: announcements } = useSuspenseQuery(
    orpc.cms.listAnnouncements.queryOptions()
  );
  const { data: session } = authClient.useSession();

  /* Always call the mapper so an unpublished page falls back to content/notices.ts. */
  const cmsProps = blocksToNoticesProps(notices?.blocks ?? []);

  const noticeSummaries = announcements.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
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
    <NoticesPage
      {...cmsProps}
      extraNavItems={extraNavItems}
      notices={noticeSummaries}
    />
  );
};

export const Route = createFileRoute("/notices")({
  head: () =>
    pageHead({
      description:
        "Official notices, circulars and announcements from the college administration.",
      path: "/notices",
      title: "Notices | St. Aloysius' College, Galle",
    }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <NoticesContent />
    </Suspense>
  ),
});
