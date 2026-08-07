"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

      tl.fromTo(headingRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1 })
        .fromTo(badgeRef.current, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5 }, "-=0.5")
        .fromTo(
          gridRef.current?.children ?? [],
          { opacity: 0, y: 30, rotateX: 15 },
          { opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.08 },
          "-=0.3"
        )
        .fromTo(textRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.3")
        .fromTo(
          buttonsRef.current?.children ?? [],
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
          "-=0.3"
        )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="px-4 sm:px-6 lg:px-8 pt-16 pb-12">
      <div className="mx-auto max-w-5xl text-center">
        <h1
          ref={headingRef}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8"
        >
          A place to shape
          <br />
          character. A stage to
          <br />
          showcase greatness.
        </h1>

        <div ref={badgeRef} className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 mb-8">
          <span className="text-sm font-medium">#AloysiusPride</span>
        </div>

        {/* Image Grid Placeholder */}
        <div ref={gridRef} className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-3xl mx-auto mb-8 perspective-[1000px]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-xl bg-muted flex items-center justify-center overflow-hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="size-8 text-muted-foreground/50">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          ))}
        </div>

        <p ref={textRef} className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8">
          At Aloysius College, students don&apos;t just learn — they create, explore, and inspire.
          <br className="hidden sm:block" />
          Discover the talent, innovation, and spirit of our students.
        </p>

        <div ref={buttonsRef} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button className="inline-flex h-10 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Explore Student Works
          </button>
          <button className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-6 text-sm font-medium hover:bg-muted transition-colors">
            About Our College
          </button>
        </div>
      </div>
    </section>
  )
}
