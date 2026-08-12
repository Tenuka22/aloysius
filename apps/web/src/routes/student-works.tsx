"use client"

import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Navbar } from "@/components-client/navbar"
import { Footer } from "@/components-client/footer"
import { client } from "@/utils/orpc"

const categoryColors: Record<string, string> = {
  film: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  art: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  music: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  writing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  design: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  photography: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  code: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

type StudentWork = {
  id: string
  title: string
  description: string | null
  category: string
  studentNames: string[]
  studentGrade: string | null
  coverImage: string | null
}

export const Route = createFileRoute("/student-works")({
  component: StudentWorksPage,
})

function StudentWorksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["studentWorks", "public"],
    queryFn: () => client.studentWorks.list({ page: 1, pageSize: 50, status: "published" }),
  })

  const items = (data?.rows ?? []) as StudentWork[]

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
              Student Works
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover the creativity and talent of our students across film, art, music, writing, and more.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-6xl">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-16">Loading student works...</div>
            ) : items.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">No student works yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to="/student-works/$studentWorkId"
                    params={{ studentWorkId: item.id }}
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
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
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
                      </div>
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.studentNames?.join(", ")}
                        {item.studentGrade && (
                          <span className="ml-1 text-xs opacity-60">({item.studentGrade})</span>
                        )}
                      </p>
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
