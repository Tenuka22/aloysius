"use client"

import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Navbar } from "@/components-client/navbar"
import { Footer } from "@/components-client/footer"
import { client } from "@/utils/orpc"

const categoryColors: Record<string, string> = {
  academic: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sports: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  arts: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  clubs: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  community: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

type Achievement = {
  id: string
  title: string
  description: string | null
  category: string
  recipientName: string | null
  recipientType: string
  year: number | null
  coverImage: string | null
}

export const Route = createFileRoute("/achievements")({
  component: AchievementsPage,
})

function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["achievements", "public"],
    queryFn: () => client.achievements.list({ page: 1, pageSize: 50, status: "published" }),
  })

  const items = (data?.rows ?? []) as Achievement[]

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
              Our Achievements
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Celebrating excellence in academics, sports, arts, and community service.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-6xl">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-16">Loading achievements...</div>
            ) : items.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">No achievements yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to="/achievements"
                    params={{}}
                    className="group block overflow-hidden rounded-xl border bg-card hover:shadow-md transition-shadow"
                  >
                    {item.coverImage ? (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-muted flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="size-10 text-muted-foreground/40">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${categoryColors[item.category] ?? categoryColors.other}`}
                        >
                          {item.category}
                        </span>
                        {item.year && (
                          <span className="text-xs text-muted-foreground">{item.year}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">{item.title}</h3>
                      {item.recipientName && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.recipientName}
                          <span className="ml-1 text-xs capitalize opacity-60">({item.recipientType})</span>
                        </p>
                      )}
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
