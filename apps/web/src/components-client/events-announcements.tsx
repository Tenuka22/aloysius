"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const events = [
  { date: "Jun 20", isoDate: "2026-06-20", title: "Founders' Day Celebration", time: "08:30 AM", location: "College Main Hall" },
  { date: "Jun 28", isoDate: "2026-06-28", title: "Inter-House Sports Meet", time: "07:30 AM", location: "College Grounds" },
  { date: "Jul 05", isoDate: "2026-07-05", title: "Aloysian Art Exhibition", time: "10:00 AM", location: "Loyola Hall" },
]

const announcements = [
  { title: "Admissions Open for Grade 6 – 2026", description: "Applications are now open.", date: "May 15, 2026", isoDate: "2026-05-15" },
  { title: "Exam Timetable – Term 2", description: "Please check the timetable for updates.", date: "May 12, 2026", isoDate: "2026-05-12" },
  { title: "Congratulations to Our Debaters!", description: "Winners at the All-Island Inter-School Competition.", date: "May 10, 2026", isoDate: "2026-05-10" },
]

export function EventsAnnouncements() {
  const eventsRef = useRef<HTMLDivElement>(null)
  const announcementsRef = useRef<HTMLDivElement>(null)

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
  }, [])

  return (
    <section aria-label="Events and announcements" className="px-4 sm:px-6 lg:px-8 py-16 border-t">
      <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div ref={eventsRef}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Upcoming Events</h2>
            <a href="#events" aria-label="View all upcoming events" className="text-sm font-medium hover:underline">
              View All Events
            </a>
          </div>
          <ul role="list" className="space-y-4">
            {events.map((event) => (
              <li
                key={event.title}
                role="listitem"
                data-animate
                aria-label={`${event.title}, ${event.date}, ${event.time} at ${event.location}`}
                className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="shrink-0 text-center">
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    {event.date.split(" ")[0]}
                  </div>
                  <time dateTime={event.isoDate} className="text-2xl font-bold">{event.date.split(" ")[1]}</time>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium mb-1">{event.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {event.time} • {event.location}
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5 shrink-0 text-muted-foreground" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </li>
            ))}
          </ul>
        </div>

        {/* Latest Announcements */}
        <div ref={announcementsRef}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Latest Announcements</h2>
            <a href="#announcements" aria-label="View all announcements" className="text-sm font-medium hover:underline">
              View All
            </a>
          </div>
          <ul role="list" className="space-y-4">
            {announcements.map((item) => (
              <li
                key={item.title}
                role="listitem"
                data-animate
                aria-label={`${item.title}. ${item.description}`}
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="font-medium mb-1">{item.title}</div>
                <div className="text-sm text-muted-foreground mb-2">{item.description}</div>
                <time dateTime={item.isoDate} className="text-xs text-muted-foreground">{item.date}</time>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
