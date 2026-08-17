"use client";

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";
import { orpc } from "@/utils/orpc";
import { getAspectRatio, aspectRatioClass } from "@/lib/image-ratio";

type StorySource = "news" | "events" | "announcements" | "achievement";

type Story = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  date: string;
  catLabel: string;
  catColor: string;
  source: StorySource;
};

const CATEGORIES = [
  "ALL",
  "COLLEGE NEWS",
  "ACADEMIC",
  "SPORTS",
  "EVENTS",
  "ANNOUNCEMENTS",
  "ACHIEVEMENTS",
];
const GREEN = "#013405";
const MAROON = "#A51919";
const PAGE_SIZE = 9;

const routeFor: Record<StorySource, string> = {
  news: "/news/$slug",
  events: "/events/$slug",
  announcements: "/announcements/$slug",
  achievement: "/achievements/$slug",
};

function formatDate(date: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

export const Route = createFileRoute("/news-events")({
  loader: async ({ context }) => {
    const [newsData, eventsData, announcementsData, achievementsData, settings] = await Promise.all([
      client.news.list({ page: 1, pageSize: 50, status: "published" }),
      client.events.list({ page: 1, pageSize: 50, status: "published" }),
      client.announcements.list({ page: 1, pageSize: 50, status: "published" }),
      client.achievements.list({ page: 1, pageSize: 50, status: "published" }),
      context.queryClient.prefetchQuery(orpc.settings.getAll.queryOptions()),
    ]);
    return {
      news: newsData.rows,
      events: eventsData.rows,
      announcements: announcementsData.rows,
      achievements: achievementsData.rows,
      settings,
    };
  },
  staleTime: 5 * 60_000,
  component: NewsEventsPage,
});

function NewsEventsPage() {
  const { news, events, announcements, achievements, settings } = Route.useLoaderData();
  const [activeCat, setActiveCat] = useState("ALL");
  const [page, setPage] = useState(1);

  const allStories: Story[] = useMemo(() => {
    const fromNews: Story[] = news.map((n) => ({
      id: n.id,
      slug: n.slug,
      title: n.title,
      image: n.coverImage,
      date: n.publishedAt ?? n.createdAt ?? "",
      catLabel: "COLLEGE NEWS",
      catColor: GREEN,
      source: "news",
    }));
    const fromEvents: Story[] = events.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      image: e.coverImage,
      date: e.publishedAt ?? e.startDate ?? e.createdAt ?? "",
      catLabel: "EVENTS",
      catColor: GREEN,
      source: "events",
    }));
    const fromAnnouncements: Story[] = announcements.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      image: a.coverImage,
      date: a.publishedAt ?? a.createdAt ?? "",
      catLabel: "ANNOUNCEMENTS",
      catColor: GREEN,
      source: "announcements",
    }));
    const fromAchievements: Story[] = achievements.map((a) => {
      const catLabel =
        a.category === "academic"
          ? "ACADEMIC"
          : a.category === "sports"
            ? "SPORTS"
            : "ACHIEVEMENTS";
      return {
        id: a.id,
        slug: a.slug,
        title: a.title,
        image: a.coverImage,
        date: a.publishedAt ?? a.createdAt ?? "",
        catLabel,
        catColor: MAROON,
        source: "achievement",
      };
    });
    return [...fromNews, ...fromEvents, ...fromAnnouncements, ...fromAchievements].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [news, events, announcements, achievements]);

  const featured = allStories[0];

  const filtered = useMemo(() => {
    const base =
      activeCat === "ALL" ? allStories : allStories.filter((s) => s.catLabel === activeCat);
    return base.filter((s) => s.id !== featured?.id);
  }, [allStories, activeCat, featured]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => new Date(e.startDate).getTime() >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 4);
  }, [events]);

  const selectCategory = (cat: string) => {
    setActiveCat(cat);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:border focus:border-[#FFB203] focus:bg-[#013405] focus:px-4 focus:py-2 focus:text-sm focus:text-[#FFB203] focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar settings={settings} />
      <main id="main-content">
        {/* Hero */}
        <section className="bg-[#013405] text-[#FFF8E7] pt-20 pb-16 sm:pt-24 sm:pb-19 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-295">
            <div className="text-xs tracking-[0.2em] text-[#FFF8E7]/60 mb-6.5">
              <Link to="/" className="hover:text-[#FFB203] transition-colors">
                HOME
              </Link>
              &nbsp;/&nbsp;<span className="text-[#FFB203]">NEWS &amp; EVENTS</span>
            </div>
            <div className="flex items-center gap-4.5 mb-6.5">
              <span className="h-px w-12 bg-[#FFB203]/50 shrink-0" />
              <span className="text-[11px] tracking-[0.4em] font-bold text-[#FFB203]">
                STORIES &amp; UPDATES
              </span>
            </div>
            <h1 className="font-heading font-semibold text-5xl sm:text-6xl lg:text-[72px] leading-[1.02] m-0">
              News &amp; Events
            </h1>
            <div className="flex gap-3 flex-wrap mt-11">
              {CATEGORIES.map((cat) => {
                const active = cat === activeCat;
                return (
                  <button
                    key={cat}
                    onClick={() => selectCategory(cat)}
                    className="text-xs font-bold tracking-widest px-4.5 py-2.25 transition-colors"
                    style={{
                      border: `1px solid ${active ? "#FFB203" : "rgba(255,178,3,0.4)"}`,
                      background: active ? "#FFB203" : "transparent",
                      color: active ? "#013405" : "#FFB203",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured story */}
        {featured && (
          <section className="bg-[#FFF8E7] py-22.5 px-4 sm:px-6 lg:px-12">
            <div className="mx-auto max-w-295 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-14 items-end">
              <Link
                to={routeFor[featured.source]}
                params={{ slug: featured.slug }}
                className="block overflow-hidden"
              >
                {featured.image ? (
                  (() => {
                    const ratio = getAspectRatio(featured.image);
                    const aspectClass = aspectRatioClass(ratio);
                    return (
                      <div className={aspectClass || ""}>
                        <img
                          src={featured.image}
                          alt={featured.title}
                          className={`w-full h-full object-cover${aspectClass ? "" : " h-auto"}`}
                        />
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-full aspect-[16/9] bg-gradient-to-br from-[#013405]/10 to-[#013405]/5" />
                )}
              </Link>
              <div>
                <div className="flex gap-3.5 text-[11px] tracking-[0.14em] font-bold mb-4">
                  <span className="text-[#A51919]">FEATURED</span>
                  <span className="text-[#013405]/45">{formatDate(featured.date)}</span>
                </div>
                <h2 className="font-heading font-semibold text-3xl sm:text-[44px] leading-[1.1] mb-5">
                  <Link to={routeFor[featured.source]} params={{ slug: featured.slug }}>
                    {featured.title}
                  </Link>
                </h2>
                <Link
                  to={routeFor[featured.source]}
                  params={{ slug: featured.slug }}
                  className="inline-flex items-center gap-2.5 font-bold text-sm border-b-2 border-[#FFB203] pb-1.5"
                >
                  Read the Story <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Grid */}
        <section className="bg-[#fffdf6] border-t border-[#013405]/[0.08] py-22.5 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-295">
            {pageItems.length === 0 ? (
              <div className="text-center text-[#013405]/50 py-16">
                No stories in this category yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 gap-x-8">
                {pageItems.map((story) => (
                  <Link
                    key={story.id}
                    to={routeFor[story.source]}
                    params={{ slug: story.slug }}
                    className="block group"
                  >
                    <div className="overflow-hidden">
                      {story.image ? (
                        (() => {
                          const ratio = getAspectRatio(story.image);
                          const aspectClass = aspectRatioClass(ratio);
                          return (
                            <div className={aspectClass || ""}>
                              <img
                                src={story.image}
                                alt={story.title}
                                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500${aspectClass ? "" : " h-auto"}`}
                              />
                            </div>
                          );
                        })()
                      ) : (
                        <div className="w-full aspect-[16/10] bg-gradient-to-br from-[#013405]/10 to-[#013405]/5" />
                      )}
                    </div>
                    <div className="flex gap-3.5 text-[10.5px] tracking-[0.14em] font-bold my-4.5">
                      <span style={{ color: story.catColor }}>{story.catLabel}</span>
                      <span className="text-[#013405]/45">{formatDate(story.date)}</span>
                    </div>
                    <div className="font-heading text-2xl font-semibold leading-tight">
                      {story.title}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2.5 mt-20 text-sm font-bold">
                {pageWindow(currentPage, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span
                      key={`e${i}`}
                      className="w-10 h-10 flex items-center justify-center text-[#013405]/40"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-10 h-10 flex items-center justify-center transition-colors"
                      style={
                        p === currentPage
                          ? { background: "#013405", color: "#FFB203" }
                          : { border: "1px solid rgba(1,52,5,0.25)" }
                      }
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center border border-[#013405]/25 disabled:opacity-30"
                >
                  &rarr;
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="bg-[#013405] text-[#FFF8E7] py-27.5 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-295">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
              <div>
                <div className="text-[11px] tracking-[0.4em] font-bold text-[#FFB203] mb-4.5">
                  CALENDAR
                </div>
                <h2 className="font-heading font-semibold text-4xl sm:text-5xl m-0">
                  Upcoming Events
                </h2>
              </div>
            </div>
            <div className="flex flex-col">
              {upcomingEvents.length === 0 ? (
                <div className="text-[#FFF8E7]/50 py-8">No upcoming events scheduled.</div>
              ) : (
                upcomingEvents.map((event) => {
                  const eventDate = new Date(event.startDate);
                  const day = eventDate.getDate();
                  const month = eventDate
                    .toLocaleString("default", { month: "short" })
                    .toUpperCase();
                  const time = event.isAllDay
                    ? "All day"
                    : eventDate.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                  return (
                    <div
                      key={event.id}
                      className="grid grid-cols-[auto_1fr_auto] gap-6 sm:gap-10 items-center py-7.5 border-b border-[#FFF8E7]/[0.12]"
                    >
                      <div className="text-center border border-[#FFB203]/40 px-2.5 py-3.5 w-21.5">
                        <div className="font-heading text-[34px] font-semibold text-[#FFB203] leading-none">
                          {day}
                        </div>
                        <div className="text-[10px] tracking-[0.2em] text-[#FFF8E7]/60 mt-1.5">
                          {month}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-lg sm:text-[19px]">{event.title}</div>
                        <div className="text-[13px] text-[#FFF8E7]/60 mt-1.5">
                          {[event.location, time].filter(Boolean).join(" • ")}
                        </div>
                      </div>
                      <Link
                        to="/events/$slug"
                        params={{ slug: event.slug }}
                        className="border border-[#FFF8E7]/40 text-[#FFF8E7] font-bold text-xs sm:text-[12.5px] px-4 sm:px-5.5 py-2.75 whitespace-nowrap hover:border-[#FFB203] hover:text-[#FFB203] transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </div>
  );
}
