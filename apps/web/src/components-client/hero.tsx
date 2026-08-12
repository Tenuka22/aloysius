"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { HeroCarousel } from "./hero-carousel";

const DEFAULTS: Record<string, string> = {
  hero_badge: "Est. 1862",
  hero_title: "Where Excellence\nIs Made",
  hero_subtitle:
    "St. Aloysius' College, Galle - nurturing minds, building character, and inspiring generations of leaders since 1862.",
  hero_cta1_text: "Explore Our College",
  hero_cta1_url: "/about",
  hero_cta2_text: "Student Works",
  hero_cta2_url: "/student-works",
};

type CarouselItem = {
  id: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category?: string;
  tags?: string[];
  source: "news" | "events" | "student-works" | "achievements" | "gallery" | "announcements";
};

export function Hero({
  settings,
  carouselItems,
}: {
  settings?: Record<string, string>;
  carouselItems?: CarouselItem[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const s = (key: string) => settings?.[key] || DEFAULTS[key] || "";

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(headingRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 })
        .fromTo(
          textRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4",
        )
        .fromTo(
          buttonsRef.current?.children ?? [],
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
          "-=0.3",
        )
        .fromTo(
          carouselRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.2",
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const titleLines = s("hero_title").split("\n");

  return (
    <section ref={sectionRef}>
      <div
        className="relative bg-[#0a1f0a] text-white size-full flex items-center justify-center"
        style={{ minHeight: "calc(100svh - 3.5rem)" }}
      >
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="py-20 sm:py-28 lg:py-36 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 text-[#c9a227]/80 text-xs sm:text-sm font-medium tracking-widest uppercase mb-6">
              <span className="w-8 h-px bg-[#c9a227]/40" />
              {s("hero_badge") || "Est. 1862"}
              <span className="w-8 h-px bg-[#c9a227]/40" />
            </div>

            <h1
              ref={headingRef}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.05] mb-6"
            >
              {titleLines.map((line: string, i: number) => (
                <span key={i}>
                  {i === titleLines.length - 1 ? (
                    <span className="text-[#c9a227]">{line}</span>
                  ) : (
                    line
                  )}
                  {i < titleLines.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p
              ref={textRef}
              className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              {s("hero_subtitle")}
            </p>

            <div
              ref={buttonsRef}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a
                href={s("hero_cta1_url") || "/about"}
                className="inline-flex h-12 items-center bg-[#c9a227] px-8 text-sm font-semibold text-[#0a1f0a] hover:bg-[#d4ad2e] transition-all duration-200 hover:shadow-lg hover:shadow-[#c9a227]/20"
              >
                {s("hero_cta1_text") || "Explore Our College"}
              </a>
              <a
                href={s("hero_cta2_url") || "/student-works"}
                className="inline-flex h-12 items-center border border-white/20 px-8 text-sm font-semibold text-white hover:bg-white/5 transition-all duration-200"
              >
                {s("hero_cta2_text") || "Student Works"}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel section */}
      <div ref={carouselRef} className="px-4 sm:px-6 lg:px-8 py-10 bg-background">
        {carouselItems && carouselItems.length > 0 ? <HeroCarousel items={carouselItems} /> : null}
      </div>
    </section>
  );
}
