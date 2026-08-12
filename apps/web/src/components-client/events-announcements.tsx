"use client"

import { useRef, useEffect } from "react"
import { Link } from "@tanstack/react-router"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const audienceLabels: Record<string, string> = {
  all: "Everyone",
  students: "Students",
  parents: "Parents",
  staff: "Staff",
  alumni: "Alumni",
}

const authorTypeLabels: Record<string, string> = {
  student: "Student",
  faculty: "Faculty",
  club: "Club",
  org: "Organization",
}

interface EventsAnnouncementsProps {
  initialEvents?: any[]
  initialNews?: any[]
  initialAnnouncements?: any[]
}

export function EventsAnnouncements({ initialEvents = [], initialNews = [], initialAnnouncements = [] }: EventsAnnouncementsProps) {
  const eventsRef = useRef<HTMLDivElement>(null)
  const announcementsRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

  const publishedEvents = initialEvents.slice(0, 4)
  const publishedNews = initialNews.slice(0, 3)
  const publishedAnnouncements = initialAnnouncements.slice(0, 3)

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
        }
      )

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
        }
      )

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
        }
      )
    })

    return () => ctx.revert()
  }, [publishedEvents, publishedNews, publishedAnnouncements])

  return (
    <section className="py-16 sm:py-20 bg-[#0a1f0a]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">Stay Updated</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Events & Announcements</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Upcoming Events */}
          <div ref={eventsRef}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Upcoming Events</h3>
              <a href="/news-events" className="text-xs font-medium text-white/50 hover:text-white transition-colors">
                View All →
              </a>
            </div>
            <div className="space-y-3">
              {publishedEvents.length > 0 ? (
                publishedEvents.map((event: any) => {
                  const eventDate = new Date(event.startDate)
                  const month = eventDate.toLocaleString("default", { month: "short" })
                  const day = eventDate.getDate()

                  return (
                    <Link
                      key={event.id}
                      to="/events/$slug"
                      params={{ slug: event.slug }}
                      className="group flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="shrink-0 text-center w-12">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#c9a227]">{month}</div>
                        <time dateTime={event.startDate} className="text-2xl font-bold text-white">{day}</time>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white group-hover:text-[#c9a227] transition-colors mb-0.5">{event.title}</div>
                        <div className="text-xs text-white/40">
                          {event.isAllDay ? "All day" : eventDate.toLocaleTimeString("default", { hour: "2-digit", minute: "2-digit" })}
                          {event.location && ` · ${event.location}`}
                        </div>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-white/40 text-sm">
                  No upcoming events
                </div>
              )}
            </div>
          </div>

          {/* Latest Announcements */}
          <div ref={announcementsRef}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Latest Announcements</h3>
              <a href="/news-events" className="text-xs font-medium text-white/50 hover:text-white transition-colors">
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
                    className="group block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="font-medium text-white group-hover:text-[#c9a227] transition-colors mb-1">{item.title}</div>
                    {item.excerpt && (
                      <div className="text-xs text-white/40 mb-2 line-clamp-2">{item.excerpt}</div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <time dateTime={item.createdAt} className="text-xs text-white/30">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </time>
                      {item.audience && item.audience !== "all" && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c9a227]">
                          {audienceLabels[item.audience] ?? item.audience}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-white/40 text-sm">
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
              <h3 className="text-lg font-semibold text-white">Latest News</h3>
              <a href="/news-events" className="text-xs font-medium text-white/50 hover:text-white transition-colors">
                View All →
              </a>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedNews.map((item: any) => (
                <Link
                  key={item.id}
                  to="/news/$slug"
                  params={{ slug: item.slug }}
                  className="group rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 transition-colors"
                >
                  {item.coverImage ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-[#c9a227]/10 to-transparent flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="size-10 text-[#c9a227]/20">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="font-medium text-white group-hover:text-[#c9a227] transition-colors mb-1 line-clamp-2">{item.title}</div>
                    {item.excerpt && (
                      <div className="text-xs text-white/40 mb-2 line-clamp-2">{item.excerpt}</div>
                    )}
                    <time dateTime={item.createdAt} className="text-xs text-white/30">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </time>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
