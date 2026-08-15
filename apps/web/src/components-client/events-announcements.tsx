"use client";

import { useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getAspectRatio, aspectRatioClass } from "@/lib/image-ratio";

gsap.registerPlugin(ScrollTrigger);

interface EventsAnnouncementsProps {
  initialEvents?: any[];
  initialNews?: any[];
  initialAnnouncements?: any[];
  initialClubs?: any[];
  initialGallery?: any[];
  settings?: Record<string, string>;
}

type FeedSource = "news" | "events" | "announcements" | "clubs" | "gallery";

type FeedItem = {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string | null;
  coverImage?: string | null;
  date: string;
  source: FeedSource;
};

const sourceMeta: Record<FeedSource, { label: string; color: string; to: string }> = {
  news: { label: "COLLEGE NEWS", color: "#FFB203", to: "/news/$slug" },
  events: { label: "EVENTS", color: "#FFD45A", to: "/events/$slug" },
  announcements: { label: "ANNOUNCEMENTS", color: "#E05252", to: "/announcements/$slug" },
  clubs: { label: "CLUBS", color: "#FFB203", to: "/clubs/$slug" },
  gallery: { label: "GALLERY", color: "#5EEAD4", to: "/gallery/$slug" },
};

function formatDate(date: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function resolveAspectClass(imageUrl: string | null | undefined): string {
  const ratio = getAspectRatio(imageUrl);
  return aspectRatioClass(ratio) || "aspect-video";
}

export function EventsAnnouncements({
  initialEvents = [],
  initialNews = [],
  initialAnnouncements = [],
  initialClubs = [],
  initialGallery = [],
  settings,
}: EventsAnnouncementsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const s = (key: string) => settings?.[key] ?? "";
  const heading = s("events_heading");

  const merged: FeedItem[] = [
    ...initialNews.map((n: any) => ({
      id: n.id,
      title: n.title,
      slug: n.slug,
      excerpt: n.excerpt,
      coverImage: n.coverImage,
      date: n.publishedAt ?? n.createdAt ?? "",
      source: "news" as const,
    })),
    ...initialEvents.map((e: any) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      excerpt: e.location,
      coverImage: e.coverImage,
      date: e.publishedAt ?? e.startDate ?? e.createdAt ?? "",
      source: "events" as const,
    })),
    ...initialAnnouncements.map((a: any) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      coverImage: a.coverImage,
      date: a.publishedAt ?? a.createdAt ?? "",
      source: "announcements" as const,
    })),
    ...initialClubs.map((c: any) => ({
      id: c.id,
      title: c.name,
      slug: c.slug,
      excerpt: c.description,
      coverImage: c.coverImage,
      date: c.createdAt ?? "",
      source: "clubs" as const,
    })),
    ...initialGallery.map((g: any) => ({
      id: g.id,
      title: g.title,
      slug: g.slug,
      excerpt: g.description,
      coverImage: g.coverImage,
      date: g.publishedAt ?? g.createdAt ?? "",
      source: "gallery" as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  function shuffled<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  }
  const first = merged[0];
  const rest = merged.slice(1);
  const mixed = first ? [first, ...shuffled(rest)] : [];

  const featured = mixed[0];
  const list = mixed.slice(1, 5);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-animate]"),
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [mixed.length]);

  if (!featured || !heading) return null;

  const featuredMeta = sourceMeta[featured.source];

  return (
    <section
      ref={sectionRef}
      className="bg-green-darker py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12"
    >
      <div className="mx-auto max-w-[1180px]">
        <div
          data-animate
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 lg:mb-14"
        >
          <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] text-cream m-0">
            {heading}
          </h2>
          {s("events_cta_text") && (
            <Link
              to={s("events_cta_url") || "/news-events"}
              className="text-gold font-bold text-sm border-b-2 border-gold pb-1.5 whitespace-nowrap hover:text-gold-light transition-colors"
            >
              {s("events_cta_text")} &rarr;
            </Link>
          )}
        </div>

        <div data-animate className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
          <Link
            to={featuredMeta.to}
            params={{ slug: featured.slug }}
            className="group block"
          >
            <div className="relative w-full overflow-hidden">
              {featured.coverImage ? (
                <img
                  src={featured.coverImage}
                  alt={featured.title}
                  className={`w-full ${resolveAspectClass(featured.coverImage)} object-cover transition-transform duration-500 group-hover:scale-105`}
                />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-gold/10 to-green-dark/20" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />
              <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                <div className="bg-green-dark text-cream font-bold text-xs sm:text-[13px] tracking-[0.1em] px-5 py-3">
                  {featured.title}
                </div>
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
            {list.map((item) => {
              const meta = sourceMeta[item.source];
              return (
                <Link
                  key={item.id}
                  to={meta.to}
                  params={{ slug: item.slug }}
                  className="group block"
                >
                  <div className="relative w-full overflow-hidden">
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className={`w-full ${resolveAspectClass(item.coverImage)} object-cover transition-transform duration-500 group-hover:scale-105`}
                      />
                    ) : (
                      <div className="w-full aspect-video bg-gradient-to-br from-gold/10 to-green-dark/20" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                      <div className="bg-green-dark text-cream font-bold text-xs sm:text-[13px] tracking-[0.1em] px-5 py-3">
                        {item.title}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
