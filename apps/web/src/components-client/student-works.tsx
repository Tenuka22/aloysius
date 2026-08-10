"use client"

import { useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { client } from "@/utils/orpc"

gsap.registerPlugin(ScrollTrigger)

const fallbackWorks = [
  { id: "1", title: "The Silent Witness", category: "film", studentNames: ["Media Club"], coverImage: null },
  { id: "2", title: "Fragments", category: "art", studentNames: ["Visual Arts Society"], coverImage: null },
  { id: "3", title: "Form & Function", category: "design", studentNames: ["Design Studio"], coverImage: null },
  { id: "4", title: "Strike, Serve, Shine.", category: "design", studentNames: ["Tech Club"], coverImage: null },
  { id: "5", title: "Reverie", category: "music", studentNames: ["Music Society"], coverImage: null },
]

const categoryLabels: Record<string, string> = {
  film: "Short Film",
  art: "Digital Art",
  music: "Music",
  writing: "Writing",
  design: "UI/UX Design",
  photography: "Photography",
  code: "Code",
  other: "Other",
}

export function StudentWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ["student-works-home"],
    queryFn: () => client.studentWorks.list({ page: 1, pageSize: 5, status: "published" }),
  })

  const works = data?.rows && data.rows.length > 0 ? data.rows : fallbackWorks

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
    <section className="px-4 sm:px-6 lg:px-8 py-16">
      <div className="mx-auto max-w-6xl">
        <div ref={headingRef} className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">Latest Student Works</h2>
          <a href="/student-works" className="text-sm font-medium hover:underline inline-flex items-center gap-1">
            View All Works
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {works.map((work) => (
            <div key={work.id} className="group cursor-pointer">
              <div className="aspect-[3/4] rounded-xl bg-muted flex items-center justify-center overflow-hidden mb-3">
                {work.coverImage ? (
                  <img
                    src={work.coverImage}
                    alt={work.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="size-8 text-muted-foreground/50">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                )}
              </div>
              <div className="text-xs text-muted-foreground mb-1">
                {categoryLabels[work.category] ?? work.category}
              </div>
              <div className="text-sm font-medium mb-1">{work.title}</div>
              <div className="text-xs text-muted-foreground">by {work.studentNames?.join(", ")}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
