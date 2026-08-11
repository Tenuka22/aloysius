"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@aloysius-web/ui/components/carousel"
import Autoplay from "embla-carousel-autoplay"
import { cn } from "@aloysius-web/ui/lib/utils"

type HeroCarouselItem = {
  id: string
  title: string
  excerpt?: string | null
  coverImage?: string | null
  category?: string
  tags?: string[]
  source: "news" | "events" | "student-works" | "achievements" | "gallery" | "announcements"
}

const sourceColors: Record<string, string> = {
  news: "bg-blue-100 text-blue-700",
  events: "bg-emerald-100 text-emerald-700",
  "student-works": "bg-violet-100 text-violet-700",
  achievements: "bg-amber-100 text-amber-700",
  gallery: "bg-pink-100 text-pink-700",
  announcements: "bg-rose-100 text-rose-700",
}

const sourceLabels: Record<string, string> = {
  news: "News",
  events: "Event",
  "student-works": "Student Work",
  achievements: "Achievement",
  gallery: "Gallery",
  announcements: "Announcement",
}

export function HeroCarousel({ items }: { items: HeroCarouselItem[] }) {
  if (!items.length) return null

  return (
    <div className="max-w-5xl mx-auto mb-8">
      <Carousel
        opts={{ loop: true, align: "center" }}
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
        className="w-full"
      >
        <CarouselContent>
          {items.map((item) => (
            <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted relative">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="size-10 text-muted-foreground/30">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10">
                  <span className={cn(
                    "inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-1.5",
                    sourceColors[item.source] ?? "bg-gray-100 text-gray-700"
                  )}>
                    {sourceLabels[item.source] ?? item.source}
                  </span>
                  <h3 className="text-white text-xs sm:text-sm font-semibold leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
