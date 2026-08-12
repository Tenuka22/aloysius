import { useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type StatRow = { id: string; value: string; label: string; icon: string | null };
type ActivityRow = {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  type: string;
};
type BigMatchRow = {
  id: string;
  name: string;
  opponent: string;
  type: string;
  year: number | null;
  eventId: string | null;
  galleryId: string | null;
};

const DEFAULTS: Record<string, string> = {
  about_hero_badge: "Est. 1895",
  about_hero_title: "St. Aloysius' College",
  about_hero_location: "Galle, Sri Lanka",
  about_hero_motto: '"Nil Desperandum" - Never Despair',
  about_mission_title: "Our Mission",
  about_mission_jesuit_title: "Jesuit Tradition",
  about_mission_jesuit_desc:
    "Founded in 1895 by Belgian Jesuit missionaries led by Bishop Joseph Van Reeth, we carry forward a 130-year tradition of forming young men of competence, conscience, and compassion.",
  about_mission_saint_title: "Named After a Saint",
  about_mission_saint_desc:
    "Named after St. Aloysius Gonzaga, the patron saint of youth, we embody the Jesuit values of academic excellence, moral integrity, and service to others.",
  about_values_title: "Our Values",
  about_value1_title: "Competence",
  about_value1_desc: "Academic excellence and practical skills for life",
  about_value2_title: "Conscience",
  about_value2_desc: "Moral integrity and ethical decision-making",
  about_value3_title: "Compassion",
  about_value3_desc: "Service to others and care for the community",
  about_clubs_title: "Clubs & Societies",
  about_clubs_desc:
    "Over 25 clubs and societies fostering leadership, creativity, and intellectual growth.",
  about_sports_title: "Sporting Excellence",
  about_sports_desc: "Excellence across 62+ sports disciplines, from cricket to rugby.",
  about_bigmatches_title: "Big Match Encounters",
  about_location_title: "Find Us",
  about_location_address:
    "St. Aloysius' College\nTemplars' Road\nGalle 80000\nSouthern Province, Sri Lanka",
  about_location_phone: "011 2 333 233",
  about_location_email: "info@loysius.lk",
  about_location_website: "aloysiuscollege.lk",
  about_alumni_title: "Old Aloysians",
  about_alumni_desc:
    "Our alumni network spans the globe, with branches in Australia, New Zealand, Qatar, and the United Kingdom.",
  about_alumni_countries: "Australia,New Zealand,Qatar,United Kingdom",
};

export const Route = createFileRoute("/about")({
  loader: async () => {
    const [settings, statsData, activitiesData, bigMatchesData] = await Promise.all([
      client.settings.getAll(),
      client.stats.list(),
      client.activities.list({ status: "published" }),
      client.bigMatches.list({ status: "published" }),
    ]);

    return {
      settings,
      stats: statsData,
      activities: activitiesData,
      bigMatches: bigMatchesData,
    };
  },
  staleTime: 5 * 60_000,
  component: AboutPage,
});

function AboutPage() {
  const {
    settings: settingsRaw,
    stats: statsRaw,
    activities,
    bigMatches: bigMatchesRaw,
  } = Route.useLoaderData();
  const heroRef = useRef<HTMLElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const clubsRef = useRef<HTMLDivElement>(null);
  const sportsRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);

  const settings = settingsRaw as Record<string, string>;
  const stats = (statsRaw as StatRow[]) ?? [];
  const allActivities = (activities as ActivityRow[]) ?? [];
  const bigMatches = (bigMatchesRaw as BigMatchRow[]) ?? [];

  const clubs = allActivities.filter((a) => a.type === "club");
  const sports = allActivities.filter((a) => a.type === "sport");

  const getSetting = (key: string) => settings[key] || DEFAULTS[key] || "";

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" },
      );

      gsap.fromTo(
        missionRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: missionRef.current, start: "top 85%", once: true },
        },
      );

      gsap.fromTo(
        clubsRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: { trigger: clubsRef.current, start: "top 85%", once: true },
        },
      );

      gsap.fromTo(
        sportsRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: { trigger: sportsRef.current, start: "top 85%", once: true },
        },
      );

      gsap.fromTo(
        valuesRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: valuesRef.current, start: "top 85%", once: true },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  const values = [
    { title: getSetting("about_value1_title"), description: getSetting("about_value1_desc") },
    { title: getSetting("about_value2_title"), description: getSetting("about_value2_desc") },
    { title: getSetting("about_value3_title"), description: getSetting("about_value3_desc") },
  ];

  const alumniCountries = getSetting("about_alumni_countries").split(",").filter(Boolean);
  const locationAddress = getSetting("about_location_address").split("\n");

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
        {/* Hero */}
        <section ref={heroRef} className="px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="mx-auto max-w-5xl text-center">
            <div
              data-animate
              className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 mb-6"
            >
              <span className="text-sm font-medium">{getSetting("about_hero_badge")}</span>
            </div>
            <h1
              data-animate
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4"
            >
              {getSetting("about_hero_title")}
            </h1>
            <p data-animate className="text-xl text-muted-foreground mb-2">
              {getSetting("about_hero_location")}
            </p>
            <p data-animate className="text-lg text-muted-foreground italic">
              {getSetting("about_hero_motto")}
            </p>
          </div>
        </section>

        {/* Quick Facts */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.length > 0
              ? stats.map((stat) => (
                  <div key={stat.id} className="p-5 rounded-xl border bg-card text-center">
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))
              : [
                  { value: "1895", label: "Founded" },
                  { value: "5,000+", label: "Students" },
                  { value: "62+", label: "Sports Disciplines" },
                  { value: "130+", label: "Years of Excellence" },
                ].map((fact) => (
                  <div key={fact.label} className="p-5 rounded-xl border bg-card text-center">
                    <div className="text-2xl font-bold mb-1">{fact.value}</div>
                    <div className="text-sm text-muted-foreground">{fact.label}</div>
                  </div>
                ))}
          </div>
        </section>

        {/* Admissions CTA */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 border-t">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
              Join Us
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Admissions Open</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Take the first step toward an exceptional education. Learn about our application process and enrol your child today.
            </p>
            <Link
              to="/admissions"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              How to Apply
            </Link>
          </div>
        </section>

        {/* Mission */}
        <section ref={missionRef} className="px-4 sm:px-6 lg:px-8 py-16 border-t">
          <div className="mx-auto max-w-5xl">
            <h2 data-animate className="text-2xl sm:text-3xl font-bold text-center mb-12">
              {getSetting("about_mission_title")}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div data-animate className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold text-lg mb-3">
                  {getSetting("about_mission_jesuit_title")}
                </h3>
                <p className="text-muted-foreground">{getSetting("about_mission_jesuit_desc")}</p>
              </div>
              <div data-animate className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold text-lg mb-3">
                  {getSetting("about_mission_saint_title")}
                </h3>
                <p className="text-muted-foreground">{getSetting("about_mission_saint_desc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section ref={valuesRef} className="px-4 sm:px-6 lg:px-8 py-16 border-t bg-muted/30">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
              {getSetting("about_values_title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {values.map((value) => (
                <div
                  key={value.title}
                  data-animate
                  className="p-6 rounded-xl border bg-card text-center"
                >
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="size-6 text-muted-foreground"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Clubs & Societies */}
        <section ref={clubsRef} className="px-4 sm:px-6 lg:px-8 py-16 border-t">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              {getSetting("about_clubs_title")}
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              {getSetting("about_clubs_desc")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubs.map((club) => (
                <div
                  key={club.id}
                  data-animate
                  className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  {club.coverImage ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={club.coverImage}
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="size-8 text-muted-foreground/40"
                      >
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium">{club.name}</h3>
                    {club.description && (
                      <p className="text-xs text-muted-foreground mt-1">{club.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sports */}
        <section ref={sportsRef} className="px-4 sm:px-6 lg:px-8 py-16 border-t bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              {getSetting("about_sports_title")}
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              {getSetting("about_sports_desc")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sports.map((sport) => (
                <div
                  key={sport.id}
                  data-animate
                  className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  {sport.coverImage ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={sport.coverImage}
                        alt={sport.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="size-8 text-muted-foreground/40"
                      >
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium">{sport.name}</h3>
                    {sport.description && (
                      <p className="text-xs text-muted-foreground mt-1">{sport.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Big Matches */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 border-t">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
              {getSetting("about_bigmatches_title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {bigMatches.map((match) => (
                <div key={match.id} className="p-6 rounded-xl border bg-card text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    {match.type}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{match.name}</h3>
                  <p className="text-sm text-muted-foreground">vs {match.opponent}</p>
                  {match.year && <p className="text-xs text-muted-foreground mt-2">{match.year}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 border-t bg-muted/30">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
              {getSetting("about_location_title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-3">Address</h3>
                <p className="text-muted-foreground">
                  {locationAddress.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < locationAddress.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-3">Contact</h3>
                <p className="text-muted-foreground">
                  Phone:{" "}
                  <a
                    href={`tel:${getSetting("about_location_phone").replace(/\s/g, "")}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {getSetting("about_location_phone")}
                  </a>
                  <br />
                  Email:{" "}
                  <a
                    href={`mailto:${getSetting("about_location_email")}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {getSetting("about_location_email")}
                  </a>
                  <br />
                  <a
                    href={`https://${getSetting("about_location_website")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    {getSetting("about_location_website")}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Old Boys */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 border-t">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {getSetting("about_alumni_title")}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {getSetting("about_alumni_desc")}
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              {alumniCountries.map((country) => (
                <span
                  key={country}
                  className="inline-flex items-center rounded-full bg-muted px-4 py-2 text-sm font-medium"
                >
                  {country}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
