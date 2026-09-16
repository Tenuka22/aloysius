import { HomePage } from "@aloysius/ui/components/home/home-page";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
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

const HomeContent = () => {
  const homepageQuery = orpc.cms.getHomepage.queryOptions();
  const { data: homepage } = useSuspenseQuery(homepageQuery);
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
    if (role === "admin" || role === "studentOfficer") {
      items.push({
        id: "students-admin",
        label: "Manage Students",
        href: "/student-officer",
      });
    }
    if (role === "admin" || role === "teacherOfficer") {
      items.push({
        id: "teachers-admin",
        label: "Staff",
        href: "/teacher-officer",
      });
    }
    if (role === "admin") {
      items.push({ id: "admin", label: "Admin", href: "/admin" });
    }
    return items;
  })();

  return (
    <HomePage
      blocks={homepage?.blocks ?? undefined}
      featuredNews={featuredNews}
      news={news}
      extraNavItems={extraNavItems}
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
