import { NewsPage } from "@aloysius/ui/components/news/news-page";
import { createFileRoute } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

const NewsContent = () => {
  const { data: session } = authClient.useSession();

  /*
   * Role-gated nav entries, mirroring `/`, `/about`, `/academics` and
   * `/students`. No Suspense wrapper: like Students this page has no CMS query
   * to await - its stories come from `content/news.ts` - so it server-renders
   * in one pass.
   */
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

  return <NewsPage extraNavItems={extraNavItems} />;
};

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News & Events | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Results, fixtures, feast days and circulars from St. Aloysius' College, Galle - college news and the calendar of upcoming events.",
      },
    ],
  }),
  component: NewsContent,
});
