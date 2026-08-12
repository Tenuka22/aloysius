"use client";

import { useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const audienceLabels: Record<string, string> = {
  all: "Everyone",
  students: "Students",
  parents: "Parents",
  staff: "Staff",
  alumni: "Alumni",
};

interface EventsAnnouncementsProps {
  initialEvents?: any[];
  initialNews?: any[];
  initialAnnouncements?: any[];
  settings?: Record<string, string>;
}

export function EventsAnnouncements({
  initialEvents = [],
  initialNews = [],
  initialAnnouncements = [],
  settings,
}: EventsAnnouncementsProps) {
  const eventsRef = useRef<HTMLDivElement>(null);
  const announcementsRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  const heading = settings?.events_heading || "Events & Announcements";
  const publishedEvents = initialEvents.slice(0, 4);
  const publishedNews = initialNews.slice(0, 3);
  const publishedAnnouncements = initialAnnouncements.slice(0, 3);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: headingRef.current, start: "top 90%", once: true },
        },
      );

      gsap.fromTo(
        eventsRef.current?.children ?? [],
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: eventsRef.current, start: "top 90%", once: true },
        },
      );

      gsap.fromTo(
        announcementsRef.current?.children ?? [],
        { opacity: 0, x: 20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: announcementsRef.current, start: "top 90%", once: true },
        },
      );
    });

    return () => ctx.revert();
  }, [publishedEvents, publishedNews, publishedAnnouncements]);

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
            Stay Updated
          </span>
          <h2 className="text-2xl sm:text-3xl font-light">{heading}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Upcoming Events */}
          <div ref={eventsRef}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Upcoming Events</h3>
              <a
                href="/news-events"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                View All →
              </a>
            </div>
            <div className="space-y-3">
              {publishedEvents.length > 0 ? (
                publishedEvents.map((event: any) => {
                  const eventDate = new Date(event.startDate);
                  const month = eventDate.toLocaleString("default", { month: "short" });
                  const day = eventDate.getDate();

                  return (
                    <Link
                      key={event.id}
                      to="/events/$slug"
                      params={{ slug: event.slug }}
                      className="group relative overflow-hidden bg-card border border-border hover:shadow-md transition-all"
                    >
                      <span className="absolute inset-y-0 left-0 w-0 bg-primary/90 group-hover:w-full transition-all duration-700 ease-out -z-0" />
                      {event.coverImage && (
                        <div className="absolute inset-0">
                          <img
                            src={event.coverImage}
                            alt={event.title || "Event cover"}
                            className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
                        </div>
                      )}
                      <div className="relative flex items-start gap-4 p-4">
                        <div className="shrink-0 text-center w-12">
                          <div className="text-[10px] font-medium uppercase tracking-wider text-[#c9a227]">
                            {month}
                          </div>
                          <time
                            dateTime={event.startDate}
                            className="text-2xl font-light text-foreground group-hover:text-primary transition-colors"
                          >
                            {day}
                          </time>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors mb-0.5">
                            {event.title}
                          </div>
                          <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                            {event.isAllDay
                              ? "All day"
                              : eventDate.toLocaleTimeString("default", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                            {event.location && ` · ${event.location}`}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="p-6 bg-muted/50 border border-border text-center text-muted-foreground text-sm">
                  No upcoming events
                </div>
              )}
            </div>
          </div>

          {/* Latest Announcements */}
          <div ref={announcementsRef}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Latest Announcements</h3>
              <a
                href="/news-events"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                View All →
              </a>
            </div>
            <div className="space-y-3">
              {publishedAnnouncements.length > 0 ? (
                publishedAnnouncements.map((item: any) => (
                  <Link
                    key={item.id}
                    to="/announcements/$slug"
                    params={{ slug: item.slug }}
                    className="group relative block p-4 bg-card border border-border hover:shadow-md transition-all"
                  >
                    <span className="absolute inset-y-0 left-0 w-0 bg-primary/90 group-hover:w-full transition-all duration-700 ease-out -z-0" />
                    <div className="relative">
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors mb-1">
                        {item.title}
                      </div>
                      {item.excerpt && (
                        <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors mb-2 line-clamp-2">{item.excerpt}</div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <time dateTime={item.createdAt} className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </time>
                        {item.audience && item.audience !== "all" && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c9a227]">
                            {audienceLabels[item.audience] ?? item.audience}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 bg-muted/50 border border-border text-center text-muted-foreground text-sm">
                  No announcements yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Published News */}
        {publishedNews.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Latest News</h3>
              <a
                href="/news-events"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                View All →
              </a>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedNews.map((item: any) => (
                <Link
                  key={item.id}
                  to="/news/$slug"
                  params={{ slug: item.slug }}
                  className="group relative bg-card border border-border overflow-hidden hover:shadow-md transition-all"
                >
                  <span className="absolute inset-y-0 left-0 w-0 bg-primary/90 group-hover:w-full transition-all duration-700 ease-out -z-0" />
                  {item.coverImage ? (
                    <div className="relative z-10 aspect-video overflow-hidden">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="relative z-10 aspect-video bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="size-10 text-primary/20"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="relative z-10 p-4">
                    <time dateTime={item.createdAt} className="text-xs text-muted-foreground group-hover:text-primary transition-colors block mb-1.5">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                    </time>
                    <div className="font-medium text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-2">
                      {item.title}
                    </div>
                    {item.excerpt && (
                      <div className="text-xs text-muted-foreground group-hover:text-primary/80 transition-colors mb-2 line-clamp-2">{item.excerpt}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
