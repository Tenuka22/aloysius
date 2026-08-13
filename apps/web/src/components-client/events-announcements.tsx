"use client";

import { useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface EventsAnnouncementsProps {
  initialEvents?: any[];
  initialNews?: any[];
  initialAnnouncements?: any[];
  settings?: Record<string, string>;
}

type FeedSource = "news" | "events" | "announcements";

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
};

function formatDate(date: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function EventsAnnouncements({
  initialEvents = [],
  initialNews = [],
  initialAnnouncements = [],
  settings,
}: EventsAnnouncementsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const heading = settings?.events_heading || "Life at the College";

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
  ].sort((a, b) => b.date.localeCompare(a.date));

  const featured = merged[0];
  const list = merged.slice(1, 5);

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
  }, [merged.length]);

  const featuredMeta = featured ? sourceMeta[featured.source] : null;

  return (
    <section
      ref={sectionRef}
      className="bg-[#fffdf6] border-t border-[#013405]/[0.08] py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12"
    >
      <div className="mx-auto max-w-[1180px]">
        <div
          data-animate
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14"
        >
          <div>
            <div className="text-[11px] tracking-[0.4em] font-bold text-[#A51919] mb-4.5">
              NEWS &amp; EVENTS
            </div>
            <h2 className="font-['Cormorant_Garamond'] font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] m-0">
              {heading}
            </h2>
          </div>
          <a
            href="/news-events"
            className="font-bold text-sm text-[#013405] border-b-2 border-[#FFB203] pb-1.5 whitespace-nowrap"
          >
            View All News &rarr;
          </a>
        </div>

        {!featured || !featuredMeta ? (
          <div className="text-center text-[#013405]/50 py-12">
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
                className="w-full h-[280px] sm:h-[380px] object-cover"
              />
            ) : (
              <div className="w-full h-[280px] sm:h-[380px] bg-gradient-to-br from-[#013405]/10 to-[#013405]/5" />
            )}
            <div className="flex gap-3.5 items-center mt-5 mb-2.5 text-[11px] tracking-[0.14em] font-bold">
              <span style={{ color: featuredMeta.color }}>{featuredMeta.label}</span>
              <span className="text-[#013405]/45">{formatDate(featured.date)}</span>
            </div>
            <div className="font-['Cormorant_Garamond'] text-2xl sm:text-[32px] font-semibold leading-[1.15] text-[#013405]">
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
                    className="block py-5.5 border-b border-[#013405]/[0.12]"
                  >
                    <div className="flex gap-3.5 text-[10.5px] tracking-[0.14em] font-bold mb-2">
                      <span style={{ color: meta.color }}>{meta.label}</span>
                      <span className="text-[#013405]/45">{formatDate(item.date)}</span>
                    </div>
                    <div className="font-bold text-[16.5px] leading-snug text-[#013405]">
                      {item.title}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-sm text-[#013405]/50">No further updates yet.</div>
            )}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
