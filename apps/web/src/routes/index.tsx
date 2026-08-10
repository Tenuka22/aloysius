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

    const [settings, statsData, studentWorksData, achievementsData, galleryData, eventsData, newsData, announcementsData] =
      await Promise.all([
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
  const { settings, stats, studentWorks, achievements, gallery, events, news, announcements } = Route.useLoaderData();

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
        <Hero settings={settings} />
        <Stats initialData={stats} />
        <StudentWorks initialData={studentWorks} />
        <Achievements initialData={achievements} />
        <Gallery initialData={gallery} />
        <EventsAnnouncements initialEvents={events} initialNews={news} initialAnnouncements={announcements} />
      </main>
      <Footer />
    </div>
  );
}
