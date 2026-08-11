"use client"

import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Navbar } from "@/components-client/navbar"
import { Footer } from "@/components-client/footer"
import { client } from "@/utils/orpc"

type Tab = "events" | "announcements" | "news"

type Event = {
  id: string
  title: string
  excerpt: string | null
  coverImage: string | null
  location: string | null
  startDate: string
  endDate: string | null
  isAllDay: boolean
  isRecurring: boolean
  organizerName: string | null
  organizerType: string | null
  organization: string | null
  tags: string[] | null
}

type Announcement = {
  id: string
  title: string
  excerpt: string | null
  coverImage: string | null
  audience: string
  addressedTo: string | null
  authorName: string | null
  authorType: string | null
  createdAt: string
  tags: string[] | null
}

type NewsItem = {
  id: string
  title: string
  excerpt: string | null
  coverImage: string | null
  authorName: string | null
  authorType: string | null
  createdAt: string
  tags: string[] | null
}

const authorTypeLabels: Record<string, string> = {
  student: "Student",
  faculty: "Faculty",
  club: "Club",
  org: "Organization",
}

const audienceLabels: Record<string, string> = {
  all: "Everyone",
  students: "Students",
  parents: "Parents",
  staff: "Staff",
  alumni: "Alumni",
}

export const Route = createFileRoute("/news-events")({
  component: NewsEventsPage,
})

function NewsEventsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("events")

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["events", "public"],
    queryFn: () => client.events.list({ page: 1, pageSize: 50, status: "published" }),
  })

  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ["announcements", "public"],
    queryFn: () => client.announcements.list({ page: 1, pageSize: 50, status: "published" }),
  })

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ["news", "public"],
    queryFn: () => client.news.list({ page: 1, pageSize: 50, status: "published" }),
  })

  const events = (eventsData?.rows ?? []) as Event[]
  const announcements = (announcementsData?.rows ?? []) as Announcement[]
  const news = (newsData?.rows ?? []) as NewsItem[]

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "events", label: "Events", count: events.length },
    { key: "announcements", label: "Announcements", count: announcements.length },
    { key: "news", label: "News", count: news.length },
  ]

  const isLoading = eventsLoading || announcementsLoading || newsLoading

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
        <section className="px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              News & Events
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stay updated with the latest happenings at St. Aloysius College.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-6xl">
            {/* Tabs */}
            <div className="flex gap-1 border-b mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="text-center text-muted-foreground py-16">Loading...</div>
            ) : (
              <>
                {/* Events Tab */}
                {activeTab === "events" && (
                  <div className="space-y-4">
                    {events.length === 0 ? (
                      <div className="text-center text-muted-foreground py-16">No events yet.</div>
                    ) : (
                      events.map((event) => {
                        const eventDate = new Date(event.startDate)
                        const month = eventDate.toLocaleString("default", { month: "short" })
                        const day = eventDate.getDate()
                        const time = eventDate.toLocaleTimeString("default", { hour: "2-digit", minute: "2-digit" })

                        return (
                          <div
                            key={event.id}
                            className="flex items-start gap-4 p-5 rounded-xl border bg-card hover:shadow-md transition-shadow"
                          >
                            {event.coverImage ? (
                              <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                                <img src={event.coverImage} alt="" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="shrink-0 text-center w-16">
                                <div className="text-xs font-medium text-muted-foreground uppercase">{month}</div>
                                <time dateTime={event.startDate} className="text-3xl font-bold">{day}</time>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                              {event.excerpt && (
                                <p className="text-sm text-muted-foreground mb-2">{event.excerpt}</p>
                              )}
                              <div className="text-sm text-muted-foreground">
                                {event.isAllDay ? "All day" : time}
                                {event.location && ` • ${event.location}`}
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                                    {event.tags.slice(0, 3).map((tag) => (
                                      <span key={tag} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                {/* Announcements Tab */}
                {activeTab === "announcements" && (
                  <div className="space-y-4">
                    {announcements.length === 0 ? (
                      <div className="text-center text-muted-foreground py-16">No announcements yet.</div>
                    ) : (
                      announcements.map((item) => (
                        <div
                          key={item.id}
                          className="p-5 rounded-xl border bg-card hover:shadow-md transition-shadow"
                        >
                          {item.coverImage && (
                            <div className="mb-3 overflow-hidden rounded-lg">
                              <img src={item.coverImage} alt={item.title} className="w-full h-40 object-cover" />
                            </div>
                          )}
                          <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                          {item.excerpt && (
                            <p className="text-sm text-muted-foreground mb-2">{item.excerpt}</p>
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
                              <span className="text-xs text-muted-foreground">To: {item.addressedTo}</span>
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex gap-1">
                                {item.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* News Tab */}
                {activeTab === "news" && (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {news.length === 0 ? (
                      <div className="col-span-full text-center text-muted-foreground py-16">No news yet.</div>
                    ) : (
                      news.map((item) => (
                        <article
                          key={item.id}
                          className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
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
                          <div className="p-5">
                            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                            {item.excerpt && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.excerpt}</p>
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
                                  {item.tags.slice(0, 2).map((tag) => (
                                    <span key={tag} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
