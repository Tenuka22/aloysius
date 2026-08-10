"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const authorTypeLabels: Record<string, string> = {
  student: "Student",
  faculty: "Faculty",
  club: "Club",
  org: "Organization",
}

interface GalleryRow {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  authorName: string | null
  authorType: string | null
  tags: string[] | null
}

export function Gallery({ initialData }: { initialData?: GalleryRow[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

  const items = initialData ?? []

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: headingRef.current, start: "top 85%", once: true },
        }
      )

      gsap.fromTo(
        ref.current?.children ?? [],
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 border-t">
      <div className="mx-auto max-w-6xl">
        <div ref={headingRef} className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">Gallery</h2>
          <a href="/gallery" className="text-sm font-medium hover:underline inline-flex items-center gap-1">
            View All
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
          {items.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No gallery albums published yet.
            </div>
          ) : items.map((item) => (
            <div key={item.id} className="group rounded-lg border overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="size-8 text-muted-foreground/50">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                )}
              </div>
              <div className="p-4">
                <div className="font-medium mb-1 group-hover:text-primary transition-colors">{item.title}</div>
                {item.description && (
                  <div className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
