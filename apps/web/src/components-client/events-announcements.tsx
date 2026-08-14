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
  news: { label: "COLLEGE NEWS", color: "#013405", to: "/news/$slug" },
  events: { label: "EVENTS", color: "#013405", to: "/events/$slug" },
  announcements: { label: "ANNOUNCEMENTS", color: "#A51919", to: "/announcements/$slug" },
  clubs: { label: "CLUBS", color: "#9A6700", to: "/clubs/$slug" },
  gallery: { label: "GALLERY", color: "#0F766E", to: "/gallery/$slug" },
};

function formatDate(date: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
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

  // Shuffle so the mix of clubs/events/gallery/news varies between refreshes,
  // while keeping the newest items weighted toward the top.
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

  const featuredMeta = featured ? sourceMeta[featured.source] : null;

  return (
    <section
      ref={sectionRef}
      className="bg-cream-warm border-t border-green-dark/[0.08] py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12"
    >
      <div className="mx-auto max-w-[1180px]">
        <div
          data-animate
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14"
        >
          <div>
            {s("events_eyebrow") && (
              <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                {s("events_eyebrow")}
              </div>
            )}
            <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] m-0">
              {heading}
            </h2>
          </div>
          {s("events_cta_text") && (
            <a
              href={s("events_cta_url") || "/news-events"}
              className="font-bold text-sm text-green-dark border-b-2 border-gold pb-1.5 whitespace-nowrap"
            >
              {s("events_cta_text")} &rarr;
            </a>
          )}
        </div>

        {!featured || !featuredMeta ? (
          <div className="text-center text-green-dark/50 py-12">
            No news, events, or announcements published yet.
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-start">
          <Link
            data-animate
            to={featuredMeta.to}
            params={{ slug: featured.slug }}
            className="block"
          >
            {featured.coverImage ? (
              <img
                src={featured.coverImage}
                alt={featured.title}
                className={`w-full ${aspectRatioClass(getAspectRatio(featured.coverImage)) || "aspect-video"} object-cover`}
              />
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-green-dark/10 to-green-dark/5" />
            )}
            <div className="flex gap-3.5 items-center mt-5 mb-2.5 text-[11px] tracking-[0.14em] font-bold">
              <span style={{ color: featuredMeta.color }}>{featuredMeta.label}</span>
              <span className="text-green-dark/45">{formatDate(featured.date)}</span>
            </div>
            <div className="font-heading text-2xl sm:text-[32px] font-semibold leading-[1.15] text-green-dark">
              {featured.title}
            </div>
          </Link>

          <div data-animate className="flex flex-col">
            {list.length > 0 ? (
              list.map((item) => {
                const meta = sourceMeta[item.source];
                return (
                  <Link
                    key={item.id}
                    to={meta.to}
                    params={{ slug: item.slug }}
                    className="block py-5.5 border-b border-green-dark/[0.12]"
                  >
                    <div className="flex gap-3.5 text-[10.5px] tracking-[0.14em] font-bold mb-2">
                      <span style={{ color: meta.color }}>{meta.label}</span>
                      <span className="text-green-dark/45">{formatDate(item.date)}</span>
                    </div>
                    <div className="font-bold text-[16.5px] leading-snug text-green-dark">
                      {item.title}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-sm text-green-dark/50">No further updates yet.</div>
            )}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
