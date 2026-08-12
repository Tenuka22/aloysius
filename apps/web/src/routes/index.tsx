import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Hero } from "@/components-client/hero";
import { Stats } from "@/components-client/stats";
import { StudentWorks } from "@/components-client/student-works";
import { Achievements } from "@/components-client/achievements";
import { Gallery } from "@/components-client/gallery";
import { EventsAnnouncements } from "@/components-client/events-announcements";
import { Footer } from "@/components-client/footer";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [{ createRouterClient }, { appRouter }] = await Promise.all([
      import("@orpc/server"),
      import("@aloysius-web/api/routers/index"),
    ]);

    const serverClient = createRouterClient(appRouter);

    const [
      settings,
      statsData,
      studentWorksData,
      achievementsData,
      galleryData,
      eventsData,
      newsData,
      announcementsData,
    ] = await Promise.all([
      serverClient.settings.getAll(),
      serverClient.stats.list(),
      serverClient.studentWorks.list({ page: 1, pageSize: 6, status: "published" }),
      serverClient.achievements.list({ page: 1, pageSize: 6, status: "published" }),
      serverClient.gallery.list({ page: 1, pageSize: 6, status: "published" }),
      serverClient.events.list({ page: 1, pageSize: 10, status: "published" }),
      serverClient.news.list({ page: 1, pageSize: 10, status: "published" }),
      serverClient.announcements.list({ page: 1, pageSize: 10, status: "published" }),
    ]);

    return {
      settings,
      stats: statsData,
      studentWorks: studentWorksData.rows,
      achievements: achievementsData.rows,
      gallery: galleryData.rows,
      events: eventsData.rows,
      news: newsData.rows,
      announcements: announcementsData.rows,
    };
  },
  staleTime: 5 * 60_000,
  component: Home,
});

function Home() {
  const { settings, stats, studentWorks, achievements, gallery, events, news, announcements } =
    Route.useLoaderData();

  const carouselItems = [
    ...news.slice(0, 3).map((n: any) => ({ ...n, source: "news" as const })),
    ...events.slice(0, 3).map((e: any) => ({ ...e, source: "events" as const })),
    ...studentWorks.slice(0, 3).map((sw: any) => ({ ...sw, source: "student-works" as const })),
    ...achievements.slice(0, 3).map((a: any) => ({ ...a, source: "achievements" as const })),
    ...gallery.slice(0, 2).map((g: any) => ({ ...g, source: "gallery" as const })),
    ...announcements.slice(0, 2).map((a: any) => ({ ...a, source: "announcements" as const })),
  ].sort((a, b) => {
    const da = a.publishedAt ?? a.createdAt ?? "";
    const db = b.publishedAt ?? b.createdAt ?? "";
    return db.localeCompare(da);
  });

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <Hero settings={settings} carouselItems={carouselItems} />
        <Stats initialData={stats} />
        <StudentWorks initialData={studentWorks} settings={settings} />
        <Achievements initialData={achievements} settings={settings} />
        <Gallery initialData={gallery} settings={settings} />
        <EventsAnnouncements
          initialEvents={events}
          initialNews={news}
          initialAnnouncements={announcements}
          settings={settings}
        />
      </main>
      <Footer />
    </div>
  );
}
