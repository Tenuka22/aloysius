"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const studentWorks = [
  { title: "The Silent Witness", category: "Short Film", club: "Media Club" },
  { title: "Fragments", category: "Digital Art", club: "Visual Arts Society" },
  { title: "Form & Function", category: "Architecture", club: "Design Studio" },
  { title: "Strike, Serve, Shine.", category: "UI/UX Design", club: "Tech Club" },
  { title: "Reverie", category: "Music", club: "Music Society" },
]

export function StudentWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

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
          <a href="#works" className="text-sm font-medium hover:underline inline-flex items-center gap-1">
            View All Works
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {studentWorks.map((work) => (
            <div key={work.title} className="group cursor-pointer">
              <div className="aspect-[3/4] rounded-xl bg-muted flex items-center justify-center overflow-hidden mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="size-8 text-muted-foreground/50">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <div className="text-xs text-muted-foreground mb-1">{work.category}</div>
              <div className="text-sm font-medium mb-1">{work.title}</div>
              <div className="text-xs text-muted-foreground">by {work.club}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
