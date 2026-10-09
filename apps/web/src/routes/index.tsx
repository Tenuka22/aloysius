import { HomePage } from "@aloysius/ui/components/home/home-page";
import { principalContent } from "@aloysius/ui/content/cms-to-principal";
import type { Notice } from "@aloysius/ui/content/home";
import { FEATURED_STORY, NEWS_STORIES } from "@aloysius/ui/content/news";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * `/` - the public homepage.
 *
 * The CMS-authored blocks and the Principal's Message are live queries here,
 * same as always. The top notice strip used to be a single hand-typed field
 * on the homepage's own "Notice Strip" block - it is the most-relevant real
 * announcement now (`cms.listAnnouncements`, pinned first then newest),
 * falling back to `DEFAULT_NOTICE` when there are none. There is still no
 * achievements panel or featured-media gallery: the flat club model has no
 * school-wide "every club's latest" query behind those sections, only
 * per-club approved photos/events/galleries - see `/photography-club` and
 * `/galleries/photography` for where that club's own content actually lives.
 */

const HomeContent = () => {
  const homepageQuery = orpc.cms.getHomepage.queryOptions();
  const { data: homepage } = useSuspenseQuery(homepageQuery);
  /*
   * The Principal's Message is a global block with its own editor screen, so it
   * is a second query rather than part of the homepage's blocks.
   */
  const principalQuery = orpc.cms.getPrincipal.queryOptions();
  const { data: principal } = useSuspenseQuery(principalQuery);
  const announcementsQuery = orpc.cms.listAnnouncements.queryOptions();
  const { data: announcements } = useSuspenseQuery(announcementsQuery);
  const { data: session } = authClient.useSession();

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

  const [topAnnouncement] = announcements;
  const notice: Notice | undefined = topAnnouncement
    ? {
        id: topAnnouncement.id,
        text: topAnnouncement.title,
        href: "/notices",
        priority: topAnnouncement.severity === "urgent" ? "high" : "standard",
      }
    : undefined;

  return (
    <HomePage
      blocks={homepage?.blocks ?? undefined}
      extraNavItems={extraNavItems}
      featuredNews={FEATURED_STORY}
      news={NEWS_STORIES}
      notice={notice}
      principal={principalContent(principal?.blocks)}
    />
  );
};

export const Route = createFileRoute("/")({
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <HomeContent />
    </Suspense>
  ),
});
