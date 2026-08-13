import { createFileRoute } from "@tanstack/react-router";
import { NoticeStrip } from "@/components-client/notice-strip";
import { Navbar } from "@/components-client/navbar";
import { Hero } from "@/components-client/hero";
import { Heritage } from "@/components-client/heritage";
import { PrincipalMessage } from "@/components-client/principal-message";
import { Academics } from "@/components-client/academics";
import { StudentLife } from "@/components-client/student-life";
import { EventsAnnouncements } from "@/components-client/events-announcements";
import { Achievements } from "@/components-client/achievements";
import { Alumni } from "@/components-client/alumni";
import { Gallery } from "@/components-client/gallery";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [settings, statsData, achievementsData, galleryData, eventsData, newsData, announcementsData, principalData] =
      await Promise.all([
        client.settings.getAll(),
        client.stats.list(),
        client.achievements.list({ page: 1, pageSize: 6, status: "published" }),
        client.gallery.list({ page: 1, pageSize: 6, status: "published" }),
        client.events.list({ page: 1, pageSize: 10, status: "published" }),
        client.news.list({ page: 1, pageSize: 10, status: "published" }),
        client.announcements.list({ page: 1, pageSize: 10, status: "published" }),
        client.principals.getCurrent(),
      ]);

    return {
      settings,
      stats: statsData,
      achievements: achievementsData.rows,
      gallery: galleryData.rows,
      events: eventsData.rows,
      news: newsData.rows,
      announcements: announcementsData.rows,
      principal: principalData,
    };
  },
  staleTime: 5 * 60_000,
  component: Home,
});

function Home() {
  const { settings, stats, achievements, gallery, events, news, announcements, principal } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <NoticeStrip settings={settings} />
      <Navbar />
      <main id="main-content">
        <Hero settings={settings} />
        <Heritage settings={settings} />
        <PrincipalMessage settings={settings} principal={principal} />
        <Academics settings={settings} stats={stats} />
        <StudentLife settings={settings} />
        <EventsAnnouncements
          initialEvents={events}
          initialNews={news}
          initialAnnouncements={announcements}
          settings={settings}
        />
        <Achievements initialData={achievements} settings={settings} />
        <Alumni settings={settings} />
        <Gallery initialData={gallery} settings={settings} />
      </main>
      <Footer settings={settings} />
    </div>
  );
}
