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

  const publishedEvents = initialEvents.slice(0, 3)
  const publishedNews = initialNews.slice(0, 3)
  const publishedAnnouncements = initialAnnouncements.slice(0, 3)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        eventsRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: eventsRef.current, start: "top 85%", once: true },
        }
      )

      gsap.fromTo(
        announcementsRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, x: 30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: announcementsRef.current, start: "top 85%", once: true },
        }
      )
    })

    return () => ctx.revert()
  }, [publishedEvents, publishedNews, publishedAnnouncements])

  return (
    <section aria-label="Events and announcements" className="px-4 sm:px-6 lg:px-8 py-16 border-t">
      <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div ref={eventsRef}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Upcoming Events</h2>
            <a href="/news-events" aria-label="View all upcoming events" className="text-sm font-medium hover:underline">
              View All Events
            </a>
          </div>
          <ul role="list" className="space-y-4">
            {publishedEvents.length > 0 ? (
              publishedEvents.map((event: any) => {
                const eventDate = new Date(event.startDate)
                const month = eventDate.toLocaleString("default", { month: "short" })
                const day = eventDate.getDate()
                const time = eventDate.toLocaleTimeString("default", { hour: "2-digit", minute: "2-digit" })

                return (
                  <li
                    key={event.id}
                    role="listitem"
                    data-animate
                  >
                    <Link
                      to="/events/$slug"
                      params={{ slug: event.slug }}
                      className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                    {event.coverImage ? (
                      <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden">
                        <img src={event.coverImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="shrink-0 text-center">
                        <div className="text-xs font-medium text-muted-foreground uppercase">{month}</div>
                        <time dateTime={event.startDate} className="text-2xl font-bold">{day}</time>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium mb-1">{event.title}</div>
                      {event.excerpt && (
                        <div className="text-xs text-muted-foreground mb-1 line-clamp-1">{event.excerpt}</div>
                      )}
                      {event.purpose && (
                        <div className="text-xs text-muted-foreground mb-1 line-clamp-1">{event.purpose}</div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {event.isAllDay ? "All day" : time}
                        {event.location && ` • ${event.location}`}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {event.organization && (
                          <span className="text-xs text-muted-foreground">{event.organization}</span>
                        )}
                        {event.organizerName && (
                          <span className="text-xs text-muted-foreground">
                            by {event.organizerName}
                            {event.organizerType && ` (${authorTypeLabels[event.organizerType] ?? event.organizerType})`}
                          </span>
                        )}
                        {event.isRecurring && (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Recurring
                          </span>
                        )}
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex gap-1">
                            {event.tags.slice(0, 2).map((tag: string) => (
                              <span key={tag} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5 shrink-0 text-muted-foreground" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    </Link>
                  </li>
                )
              })
            ) : (
              <li className="p-4 rounded-lg border text-center text-muted-foreground">
                No upcoming events
              </li>
            )}
          </ul>
        </div>

        {/* Latest Announcements */}
        <div ref={announcementsRef}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Latest Announcements</h2>
            <a href="/news-events" aria-label="View all announcements" className="text-sm font-medium hover:underline">
              View All
            </a>
          </div>
          <ul role="list" className="space-y-4">
            {publishedAnnouncements.length > 0 ? (
              publishedAnnouncements.map((item: any) => (
                <li
                  key={item.id}
                  role="listitem"
                  data-animate
                >
                   <Link
                    to="/announcements/$slug"
                    params={{ slug: item.slug }}
                    className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                   >
                  {item.coverImage && (
                    <div className="mb-3 overflow-hidden rounded-md">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                  <div className="font-medium mb-1">{item.title}</div>
                  {item.excerpt && (
                    <div className="text-sm text-muted-foreground mb-2">{item.excerpt}</div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <time dateTime={item.createdAt} className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </time>
                    {item.authorName && (
                      <span className="text-xs text-muted-foreground">
                        by {item.authorName}
                        {item.authorType && ` (${authorTypeLabels[item.authorType] ?? item.authorType})`}
                      </span>
                    )}
                    {item.audience && item.audience !== "all" && (
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {audienceLabels[item.audience] ?? item.audience}
                      </span>
                    )}
                    {item.addressedTo && (
                      <span className="text-xs text-muted-foreground">
                        To: {item.addressedTo}
                      </span>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1">
                        {item.tags.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="p-4 rounded-lg border text-center text-muted-foreground">
                No announcements yet
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Published News Section */}
      {publishedNews.length > 0 && (
        <div className="mx-auto max-w-6xl mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Latest News</h2>
            <a href="/news-events" aria-label="View all news" className="text-sm font-medium hover:underline">
              View All
            </a>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {publishedNews.map((item: any) => (
              <Link
                key={item.id}
                to="/news/$slug"
                params={{ slug: item.slug }}
                className="group rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
              >
                {item.coverImage ? (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center">
                    <span className="text-4xl font-bold text-blue-200 dark:text-blue-800">N</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="font-medium mb-1 group-hover:text-primary transition-colors">{item.title}</div>
                  {item.excerpt && (
                    <div className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.excerpt}</div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <time dateTime={item.createdAt} className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </time>
                    {item.authorName && (
                      <span className="text-xs text-muted-foreground">
                        by {item.authorName}
                        {item.authorType && ` (${authorTypeLabels[item.authorType] ?? item.authorType})`}
                      </span>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1">
                        {item.tags.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
