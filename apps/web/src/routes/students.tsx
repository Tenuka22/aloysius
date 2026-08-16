import { useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_HOUSES = [
  { name: "Cooreman", color: "#FFD700" },
  { name: "Murphy", color: "#E31E24" },
  { name: "Neut", color: "#009A44" },
  { name: "Standaert", color: "#C52691" },
  { name: "Van Reeth", color: "#0072CE" },
];

const DEFAULTS: Record<string, string> = {
  students_title: "Student Life",
  students_intro: "Sports, societies, houses and the traditions that shape every Aloysian.",
  sports_more_text: "Swimming • Football • Chess • more",
  prefects_title: "Prefects' Guild & Student Leadership",
  prefects_subtitle: "Leadership, service and discipline.",
  prefects_cta_text: "Meet the Prefects",
  prefects_cta_url: "#",
};

export const Route = createFileRoute("/students")({
  loader: async () => {
    const [settings, clubs] = await Promise.all([
      client.settings.getAll(),
      client.activities.list({ status: "published", type: "club" }),
    ]);
    return { settings, clubs };
  },
  staleTime: 5 * 60_000,
  component: StudentsPage,
});

function StudentsPage() {
  const { settings, clubs } = Route.useLoaderData();
  const s = (key: string) => settings[key] || DEFAULTS[key] || "";

  const heroRef = useRef<HTMLElement>(null);
  const sportsRef = useRef<HTMLElement>(null);
  const clubsRef = useRef<HTMLElement>(null);
  const housesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      for (const ref of [heroRef, sportsRef, clubsRef, housesRef]) {
        gsap.fromTo(
          ref.current?.querySelectorAll("[data-animate]") ?? [],
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
          },
        );
      }
    });
    return () => ctx.revert();
  }, []);

  const houses = [1, 2, 3, 4, 5].map((i) => ({
    name: settings[`house${i}_name`] || DEFAULT_HOUSES[i - 1].name,
    color: settings[`house${i}_color`] || DEFAULT_HOUSES[i - 1].color,
  }));

  return (
    <div className="min-h-screen bg-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        {/* Hero */}
        <section
          ref={heroRef}
          className="relative bg-green-dark text-cream overflow-hidden py-32.5 sm:pt-32.5 sm:pb-27.5 px-4 sm:px-6 lg:px-12"
        >
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none opacity-[0.07] hidden sm:block"
            style={{ right: -90, top: -60, height: 480, width: "auto" }}
          />
          <div className="relative mx-auto max-w-295">
            <div data-animate className="text-xs tracking-[0.2em] text-cream/60 mb-6.5">
              <a href="/" className="hover:text-gold transition-colors">
                HOME
              </a>
              &nbsp;/&nbsp;<span className="text-gold">STUDENTS</span>
            </div>
            <h1
              data-animate
              className="text-5xl sm:text-6xl lg:text-[76px] leading-[1.02] mb-6 max-w-[14ch]"
            >
              {s("students_title")}
            </h1>
            <p
              data-animate
              className="text-base sm:text-[17px] leading-[1.7] text-cream/75 max-w-[56ch]"
            >
              {s("students_intro")}
            </p>
          </div>
        </section>

        {/* Sports */}
        <section ref={sportsRef} className="bg-cream py-24 sm:py-30 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-295">
            <div
              data-animate
              className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5"
            >
              SPORTS
            </div>
            <h2 data-animate className="text-4xl sm:text-5xl lg:text-[54px] mb-15">
              On the Field
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 auto-rows-[90px] sm:auto-rows-[110px] lg:auto-rows-32 gap-3 sm:gap-4">
              <SportsTile
                src={settings.sports_cricket_image}
                label="CRICKET"
                className="col-span-2 sm:col-span-2 lg:col-span-4 row-span-3"
              />
              <SportsTile
                src={settings.sports_rugby_image}
                label="RUGBY"
                className="col-span-1 sm:col-span-2 lg:col-span-2 row-span-1"
              />
              <SportsTile
                src={settings.sports_athletics_image}
                label="ATHLETICS"
                className="col-span-1 sm:col-span-2 lg:col-span-2 row-span-1"
              />
              <div
                data-animate
                className="col-span-2 sm:col-span-4 lg:col-span-2 row-span-1 bg-red-brand text-cream flex items-center justify-center text-center p-4"
              >
                <div>
                  <div className="font-extrabold text-sm tracking-[0.08em]">MORE SPORTS</div>
                  <div className="text-xs text-gold-light mt-1">{s("sports_more_text")}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clubs & Societies */}
        <section
          ref={clubsRef}
          className="text-cream py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
          style={{ background: "linear-gradient(180deg, var(--green-dark), var(--green-darker))" }}
        >
          <div className="mx-auto max-w-295">
            <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4.5">
              CLUBS &amp; SOCIETIES
            </div>
            <h2 data-animate className="text-4xl sm:text-5xl lg:text-[54px] mb-15">
              Beyond the Classroom
            </h2>
            {clubs.length === 0 ? (
              <div className="text-cream/50">No clubs published yet.</div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px border border-gold/20"
                style={{ background: "rgba(255,178,3,0.2)" }}
              >
                {clubs.map((club) => (
                  <Link
                    key={club.id}
                    data-animate
                    to="/clubs/$id"
                    params={{ id: club.id }}
                    className="block bg-green-dark hover:bg-green-darker transition-colors px-6.5 py-7.5"
                  >
                    <div className="font-bold text-base">{club.name}</div>
                    {club.description && (
                      <div className="text-xs text-cream/55 mt-1.5 line-clamp-2">
                        {club.description}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Houses */}
        <section
          ref={housesRef}
          className="bg-cream-warm border-t border-green-dark/8 py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
        >
          <div className="mx-auto max-w-295">
            <div
              data-animate
              className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5"
            >
              HOUSE SYSTEM
            </div>
            <h2 data-animate className="text-4xl sm:text-5xl lg:text-[54px] mb-15">
              The College Houses
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {houses.map((house, i) => (
                <div
                  key={i}
                  data-animate
                  className="border border-green-dark/15 text-center px-6 py-11 bg-cream"
                >
                  <div
                    className="w-13.5 h-13.5 mx-auto mb-5 rotate-45"
                    style={{ background: house.color }}
                  />
                  <div className="font-heading text-2xl font-semibold">{house.name}</div>
                  <div className="text-[11px] tracking-[0.16em] text-green-dark/60 mt-2">
                    HOUSE COLOURS
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Prefects CTA */}
        <section className="bg-green-dark text-cream py-20 sm:py-25 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-270 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div>
              <div className="font-heading text-3xl sm:text-[36px] font-semibold">
                {s("prefects_title")}
              </div>
              <div className="text-sm text-cream/65 mt-2">{s("prefects_subtitle")}</div>
            </div>
            <a
              href={s("prefects_cta_url") || "#"}
              className="inline-flex items-center bg-gold text-green-dark font-extrabold text-sm px-8 py-3.75 whitespace-nowrap hover:bg-gold-light transition-colors"
            >
              {s("prefects_cta_text")} &rarr;
            </a>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </div>
  );
}

function SportsTile({
  src,
  label,
  className,
}: {
  src?: string;
  label: string;
  className?: string;
}) {
  return (
    <div data-animate className={`relative overflow-hidden ${className ?? ""}`}>
      {src ? (
        <img src={src} alt={label} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-green-dark/15 to-green-dark/5" />
      )}
      <div className="absolute left-4 sm:left-5 bottom-3 sm:bottom-4 bg-green-dark text-cream font-bold text-xs sm:text-[13px] tracking-[0.1em] px-3 sm:px-4 py-1.5 sm:py-2 pointer-events-none">
        {label}
      </div>
    </div>
  );
}
