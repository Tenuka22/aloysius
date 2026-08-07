import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Hero } from "@/components-client/hero";
import { Stats } from "@/components-client/stats";
import { StudentWorks } from "@/components-client/student-works";
import { EventsAnnouncements } from "@/components-client/events-announcements";
import { CTABanner } from "@/components-client/cta-banner";
import { Footer } from "@/components-client/footer";

function Home() {
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
        <Hero />
        <Stats />
        <StudentWorks />
        <EventsAnnouncements />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: Home,
});
