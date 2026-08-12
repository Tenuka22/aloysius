"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { HeroCarousel } from "./hero-carousel"

const DEFAULTS: Record<string, string> = {
  hero_title: "Where Excellencies\nAre Made",
  hero_subtitle: "St. Aloysius' College, Galle — nurturing minds, building character, and inspiring generations of leaders since 1862.",
  hero_cta1_text: "Explore Our College",
  hero_cta1_url: "/about",
  hero_cta2_text: "Student Works",
  hero_cta2_url: "/student-works",
}

type CarouselItem = {
  id: string
  title: string
  excerpt?: string | null
  coverImage?: string | null
  category?: string
  tags?: string[]
  source: "news" | "events" | "student-works" | "achievements" | "gallery" | "announcements"
}

export function Hero({ settings, carouselItems }: { settings?: Record<string, string>; carouselItems?: CarouselItem[] }) {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  const s = (key: string) => settings?.[key] || DEFAULTS[key] || ""

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

      tl.fromTo(headingRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1 })
        .fromTo(textRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.5")
        .fromTo(
          buttonsRef.current?.children ?? [],
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
          "-=0.3"
        )
        .fromTo(carouselRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.2")
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const titleLines = s("hero_title").split("\n")

  return (
    <section ref={sectionRef}>
      {/* Hero with dark background - fills viewport minus navbar */}
      <div className="relative bg-[#0a1f0a] text-white overflow-hidden h-[calc(100svh-3.5rem)]">
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0a1f0a]" />

        <div className="relative h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h1
              ref={headingRef}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.05] mb-6"
            >
              {titleLines.map((line: string, i: number) => (
                <span key={i}>
                  {line}
                  {i < titleLines.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p ref={textRef} className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
              {s("hero_subtitle")}
            </p>

            <div ref={buttonsRef} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={s("hero_cta1_url") || "/about"} className="inline-flex h-12 items-center rounded-lg bg-[#c9a227] px-8 text-sm font-semibold text-[#0a1f0a] hover:bg-[#b89220] transition-colors">
                {s("hero_cta1_text") || "Explore Our College"}
              </a>
              <a href={s("hero_cta2_url") || "/student-works"} className="inline-flex h-12 items-center rounded-lg border border-white/20 bg-white/5 px-8 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                {s("hero_cta2_text") || "Student Works"}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel section */}
      <div ref={carouselRef} className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-6xl">
          {carouselItems && carouselItems.length > 0 ? (
            <HeroCarousel items={carouselItems} />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-3xl mx-auto perspective-[1000px]">
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
          )}
        </div>
      </div>
    </section>
  )
}
