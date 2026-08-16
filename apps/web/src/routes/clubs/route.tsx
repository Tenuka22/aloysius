"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { MediaImage } from "@/components-client/media-image";
import { orpc } from "@/utils/orpc";
import { cn } from "@aloysius-web/ui/lib/utils";
import { IconArrowRight } from "@tabler/icons-react";

gsap.registerPlugin(ScrollTrigger);

type Club = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  type: "club" | "sport" | "other";
};

type Filter = "all" | "club" | "sport" | "other";

const typeMeta: Record<"club" | "sport" | "other", { label: string; plural: string }> = {
  club: { label: "Club", plural: "Clubs" },
  sport: { label: "Sport", plural: "Sports" },
  other: { label: "Society", plural: "Societies" },
};

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "club", label: "Clubs" },
  { value: "sport", label: "Sports" },
  { value: "other", label: "Societies" },
];

export const Route = createFileRoute("/clubs")({
  component: ClubsDirectoryPage,
});

function ClubsDirectoryPage() {
  const { data, isLoading } = useQuery(orpc.activities.list.queryOptions());

  const clubs = (data ?? []) as unknown as Club[];
  const [filter, setFilter] = useState<Filter>("all");

  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const directoryRef = useRef<HTMLElement>(null);

  const goToType = (type: Filter) => {
    setFilter(type);
    directoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const counts = useMemo(() => {
    return clubs.reduce(
      (acc, club) => {
        acc[club.type] += 1;
        return acc;
      },
      { club: 0, sport: 0, other: 0 } as Record<"club" | "sport" | "other", number>,
    );
  }, [clubs]);

  const visible = useMemo(
    () => (filter === "all" ? clubs : clubs.filter((c) => c.type === filter)),
    [clubs, filter],
  );

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        hero.querySelectorAll("[data-animate]"),
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" },
      );
    }, hero);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        grid.querySelectorAll("[data-animate-card]"),
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: { trigger: grid, start: "top 82%", once: true },
        },
      );
    }, grid);
    return () => ctx.revert();
  }, [filter, visible.length]);

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
        {/* Hero — dark green, editorial */}
        <section className="relative overflow-hidden bg-green-darker px-4 sm:px-6 lg:px-12 pt-24 pb-20 sm:pt-32 sm:pb-24">
          <div
            className="pointer-events-none absolute -top-48 -right-40 size-[520px] rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--gold) 0%, transparent 70%)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-gold/80 via-gold/30 to-transparent"
            aria-hidden="true"
          />
          <div ref={heroRef} className="relative mx-auto max-w-[1180px]">
            <p
              data-animate
              className="mb-6 text-[11px] font-bold uppercase tracking-[0.26em] text-gold"
            >
              St. Aloysius&rsquo; College &bull; Galle
            </p>
            <h1
              data-animate
              className="font-heading max-w-3xl text-5xl font-semibold leading-[1.04] text-cream sm:text-6xl lg:text-[68px]"
            >
              Clubs, Sports <span className="text-gold">&amp;</span> Societies
            </h1>
            <p
              data-animate
              className="mt-7 max-w-xl text-base leading-relaxed text-cream/70 sm:text-lg"
            >
              Beyond the classroom, a boy grows into a man of character. Discover the fraternities
              of St. Aloysius&rsquo; — where talent is nurtured, brotherhood is forged, and every
              gift finds its stage.
            </p>
            {!isLoading && clubs.length > 0 && (
              <div data-animate className="mt-12 flex flex-wrap gap-x-12 gap-y-6 border-t border-gold/25 pt-8">
                {(["club", "sport", "other"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => goToType(type)}
                    className="group text-left"
                  >
                    <div className="font-heading text-4xl font-semibold text-gold transition-colors group-hover:text-gold-light sm:text-5xl">
                      {counts[type]}
                    </div>
                    <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cream/60 transition-colors group-hover:text-cream">
                      {typeMeta[type].plural}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Directory — cream, editorial grid */}
        <section ref={directoryRef} className="scroll-mt-24 bg-cream px-4 py-20 sm:px-6 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex flex-col gap-6 border-b-2 border-green-dark/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-gold">
                  The Directory
                </p>
                <h2 className="font-heading text-4xl font-semibold leading-tight text-green-dark sm:text-5xl">
                  Find your fraternity
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFilter(f.value)}
                    aria-pressed={filter === f.value}
                    className={cn(
                      "border-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors duration-300",
                      filter === f.value
                        ? "border-green-dark bg-green-dark text-gold"
                        : "border-green-dark/15 bg-cream-light text-green-dark/70 hover:border-gold hover:text-green-dark",
                    )}
                  >
                    {f.label}
                    <span className="ml-2 opacity-60">
                      {f.value === "all" ? clubs.length : counts[f.value as "club" | "sport" | "other"]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div ref={gridRef} className="mt-10">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="border-2 border-green-dark/10 bg-cream-light animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-green-dark/10" />
                      <div className="space-y-3 p-6">
                        <div className="h-5 w-2/3 bg-green-dark/10" />
                        <div className="h-3 w-full bg-green-dark/10" />
                        <div className="h-3 w-4/5 bg-green-dark/10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="border-2 border-dashed border-green-dark/20 bg-cream-light p-16 text-center">
                  <h3 className="font-heading text-2xl font-semibold text-green-dark">
                    Nothing here yet
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-green-dark/60">
                    No {filter === "all" ? "clubs" : typeMeta[filter as "club" | "sport" | "other"].plural.toLowerCase()} are
                    published right now. Please check back soon.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((club) => (
                    <Link
                      key={club.id}
                      to="/clubs/$id"
                      params={{ id: club.id }}
                      data-animate-card
                      className="group flex flex-col border-2 border-green-dark/10 bg-cream-light transition-colors duration-300 hover:border-gold"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-green-dark/5">
                        <MediaImage
                          src={club.bannerUrl ?? club.coverImage ?? club.logoUrl}
                          alt={club.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                          fallback={
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gold/15 to-green-dark/25">
                              <span className="font-heading text-6xl font-semibold text-green-dark/25">
                                {club.name.charAt(0)}
                              </span>
                            </div>
                          }
                        />
                        <span className="absolute left-3 top-3 bg-green-dark px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                          {typeMeta[club.type].label}
                        </span>
                        <div className="absolute inset-0 bg-green-dark/0 transition-colors duration-300 group-hover:bg-green-dark/15" />
                        <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <h3 className="font-heading text-[22px] font-semibold leading-snug text-green-dark transition-colors duration-300 group-hover:text-primary">
                          {club.name}
                        </h3>
                        {club.description && (
                          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-green-dark/60">
                            {club.description}
                          </p>
                        )}
                        <span className="mt-auto inline-flex items-center gap-2 border-b-2 border-gold pb-1.5 pt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-green-dark">
                          Explore
                          <IconArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
