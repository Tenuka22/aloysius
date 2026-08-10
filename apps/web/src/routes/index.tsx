import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Hero } from "@/components-client/hero";
import { Stats } from "@/components-client/stats";
import { StudentWorks } from "@/components-client/student-works";
import { EventsAnnouncements } from "@/components-client/events-announcements";
import { CTABanner } from "@/components-client/cta-banner";
import { Footer } from "@/components-client/footer";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const { orpc } = context;

    const [settings, stats] = await Promise.all([
      orpc.settings.getAll.call(),
      orpc.stats.list.call(),
    ]);

    return { settings, stats };
  },
  headers: () => ({
    "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
  }),
  staleTime: 60_000,
  component: Home,
});

function Home() {
  const { settings, stats } = Route.useLoaderData();

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
        <StudentWorks />
        <EventsAnnouncements />
        <CTABanner settings={settings} />
      </main>
      <Footer />
    </div>
  );
}
