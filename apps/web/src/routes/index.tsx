import { HomePage } from "@aloysius/ui/components/home/home-page";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Placeholder content until the CMS routers expose news and achievements. Kept
 * here rather than inside the components so swapping it for a loader is a
 * one-line change and no layout code moves. No backend changes were made.
 */
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

export const Route = createFileRoute("/")({
  component: () => <HomePage featuredNews={featuredNews} news={news} />,
});
