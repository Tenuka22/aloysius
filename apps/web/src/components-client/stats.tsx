"use client"

import { useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { client } from "@/utils/orpc"

gsap.registerPlugin(ScrollTrigger)

const defaultStats = [
  { value: `${Math.floor(new Date().getFullYear() - 1895)}+`, label: "Years of Excellence", icon: "graduation" },
  { value: "4500+", label: "Students", icon: "users" },
  { value: "100+", label: "Co-Curricular Activities", icon: "trophy" },
  { value: "20+", label: "Global Partnerships", icon: "globe" },
]

const iconMap: Record<string, string> = {
  graduation: "graduation",
  school: "graduation",
  users: "users",
  trophy: "trophy",
  activity: "trophy",
  globe: "globe",
  world: "globe",
}

function StatIcon({ icon }: { icon: string }) {
  const mapped = iconMap[icon] ?? icon

  if (mapped === "graduation") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    )
  }
  if (mapped === "users") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }
  if (mapped === "trophy") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}

export function Stats({ initialData }: { initialData?: { id: string; value: string; label: string; icon: string | null }[] }) {
  const ref = useRef<HTMLDivElement>(null)

  const stats = initialData && initialData.length > 0
    ? initialData.map((s) => ({
        value: s.value,
        label: s.label,
        icon: s.icon ?? "graduation",
      }))
    : defaultStats

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section className="border-y bg-muted/30 px-4 sm:px-6 lg:px-8 py-12">
      <div ref={ref} className="mx-auto max-w-4xl flex flex-wrap justify-center gap-12">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center text-center gap-2">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-1">
              <StatIcon icon={stat.icon} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
